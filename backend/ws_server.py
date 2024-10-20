from collections import defaultdict
import json
import time
import cv2
import websockets
import base64
import asyncio
import tempfile
import uuid
import firebase_admin
from firebase_admin import credentials, storage
from ultralytics import YOLO
import os
from moviepy.editor import ImageSequenceClip

from gemini_agent import get_context

model = YOLO("./best.pt")

PORT = 8080
INTERVAL = 5

# Initialize video capture
cap = cv2.VideoCapture(0)  # CHANGE THIS TO THE INPUT STREAM FOR THE HARDWARE
print("Camera initialized")

cred = credentials.Certificate(
    "calhacks2024-c1a62-firebase-adminsdk-9obo0-63385ce9b4.json"
)
firebase_admin.initialize_app(
    cred,
    {
        "storageBucket": "calhacks2024-c1a62.appspot.com",
        "databaseURL": "calhacks2024-c1a62-default-rtdb.firebaseio.com/",
    },
)

class_names = {0: "forceps", 1: "gauze", 2: "scissors"}
colors = [(255, 42, 4), (235, 219, 11), (243, 243, 243)]
last_seen = {tool: "" for tool in class_names.values()}


async def handle_connection(ws: websockets.WebSocketServerProtocol):
    print("Client connected")
    results = []
    frames = []
    start_time = time.time()

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            resized_frame = cv2.resize(frame, (640, 480))

            # Get detection result
            result = model(resized_frame, verbose=False, conf=0.4)
            results.append(result)
            # Annotate the frame
            annotated_frame = result[0].plot(boxes=False)

            drawn = set()
            for detection in result[0].boxes.data:
                x1, y1, x2, y2, conf, cls = detection
                cls = int(cls)
                if cls in drawn:
                    continue
                drawn.add(cls)
                cv2.putText(
                    annotated_frame,
                    class_names[cls],
                    (int(x1), int(y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    colors[cls],
                    2,
                )
            frames.append(annotated_frame)
            _, buffer = cv2.imencode(".jpg", annotated_frame)
            img_b64 = base64.b64encode(buffer).decode("utf-8")
            await ws.send("image" + img_b64)

            # Get the current time
            current_time = time.time()

            if current_time - start_time >= INTERVAL:
                video_path = f"{current_time}.mp4"
                batched_video_bytes = get_batched_video(frames)
                upload_video_to_firebase(batched_video_bytes, video_path)
                frame_idx, best_result = find_best_result(results)
                # visible_tools = []

                # Save the best result to the list
                if best_result:
                    # metadata = best_result[0].boxes.data
                    # Convert the tensor to a Python list and then to a set of unique class indices
                    # class_indices = set(metadata.tolist())
                    # visible_tools = [
                    #     class_names[int(cls)]
                    #     for cls in class_indices
                    #     if int(cls) in class_names
                    # ]
                    _, br_buffer = cv2.imencode(".jpg", frames[frame_idx])
                    img_b64 = base64.b64encode(br_buffer).decode("utf-8")

                mdata = []

                context = await get_context(img_b64)
                for data in context:
                    if data["status"] != "missing":
                        last_seen[data["tool"]] = video_path
                    data["last_seen"] = last_seen[data["tool"]]
                    mdata.append(data)

                mdata_str = json.dumps(mdata, indent=4)
                await ws.send(mdata_str)

                start_time = current_time
                results = []
                frames = []

    except Exception as e:
        print(e)


def get_batched_video(frames):
    fps = len(frames) / INTERVAL
    # Convert frames from BGR (OpenCV format) to RGB (MoviePy format)
    frames_rgb = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for frame in frames]
    clip = ImageSequenceClip(frames_rgb, fps=fps)

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        temp_video_path = f.name

    clip.write_videofile(
        temp_video_path, codec="libx264", audio=False, verbose=False, logger=None
    )

    with open(temp_video_path, "rb") as f:
        video_bytes = f.read()

    # Clean up the temporary file
    os.remove(temp_video_path)
    return video_bytes


def upload_video_to_firebase(video_bytes: bytes, destination_path: str):
    bucket = storage.bucket()
    blob = bucket.blob(destination_path)

    # Generate a UUID for the download token
    token = uuid.uuid4()

    # Set the metadata including the download token
    blob.metadata = {
        "firebaseStorageDownloadTokens": str(token),
    }

    # Upload the file with the specified content type
    blob.upload_from_string(video_bytes, content_type="video/mp4")


def find_best_result(results):
    total_results = len(results)
    class_counters = defaultdict(int)

    # Step 1: Count the classes detected in each result
    for result_obj in results:
        result_obj = result_obj[0]
        result_classes = set()
        boxes_data = result_obj.boxes.data
        for detection in boxes_data:
            confidence = detection[4]
            cls = int(detection[5])
            if confidence > 0.5 and cls not in result_classes:
                class_counters[cls] += 1
                result_classes.add(cls)

    # Step 2: Identify classes detected in more than half of the results
    required_classes = [
        cls for cls, count in class_counters.items() if count > total_results / 2
    ]

    # Step 3: Find the best result object
    best_result = None
    highest_total_confidence = 0
    frame_idx = None

    for i, result_obj in enumerate(results):
        detected_classes = set()
        confidences_per_class = defaultdict(float)
        boxes_data = result_obj[0].boxes.data
        for detection in boxes_data:
            confidence = detection[4]
            cls = int(detection[5])
            if cls in required_classes and confidence > 0.5:
                detected_classes.add(cls)
                confidences_per_class[cls] += confidence

        if set(required_classes).issubset(detected_classes):
            total_confidence = sum(confidences_per_class.values())
            if total_confidence > highest_total_confidence:
                highest_total_confidence = total_confidence
                best_result = result_obj
                frame_idx = i

    return frame_idx, best_result


async def start_server():
    server = await websockets.serve(
        handle_connection, "localhost", PORT, process_request=None
    )
    print(f"WebSocket server started on port {PORT}")
    await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(start_server())
