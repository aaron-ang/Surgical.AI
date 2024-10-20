from collections import defaultdict
import json
import time
import cv2
import websockets
import base64
import asyncio
import numpy as np
import tempfile
import uuid
import firebase_admin
from firebase_admin import credentials, storage
from ultralytics import YOLO
import os
from moviepy.editor import ImageSequenceClip

from gemini_agent import get_context

model = YOLO("./best.pt")

lower_hsv = np.array([64, 70, 51])
upper_hsv = np.array([102, 255, 255])


PORT = 8080
INTERVAL = 5
SMALL_INTERVAL = 4
CONFIDENCE = 0.4

# Initialize video capture
cap = cv2.VideoCapture(1)  # CHANGE THIS TO THE INPUT STREAM FOR THE HARDWARE
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
            result = model(resized_frame, verbose=False, conf=CONFIDENCE)
            results.append(result)
            # Annotate the frame
            annotated_frame = result[0].plot(boxes=False)
            segmented_frame = result[0].plot(boxes=False)

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
            await ws.send("image:" + img_b64)

            context = {}

            mdata = []
            # mdata_str = json.dumps(mdata, indent=4)
            

            # Get the current time
            current_time = time.time()

            if current_time - start_time >= SMALL_INTERVAL:
                frame_idx, best_result = find_best_result(results)
                if best_result:
                    seen = set()
                    # Save the best result to the list
                    
                    metadata = best_result[0].boxes.data
                    # Convert the tensor to a Python list and then to a set of unique class indices
                    hsv_image = cv2.cvtColor(segmented_frame, cv2.COLOR_BGR2HSV)
                    mask = cv2.inRange(hsv_image, lower_hsv, upper_hsv)

                    for x1, y1, x2, y2, conf, cls in metadata:
                        cls = int(cls)
                        if conf > CONFIDENCE and cls not in seen:
                            seen.add(cls)
                            # Check if the two points are in the mask
                            x1, y1, x2, y2 = min(int(x1), 639), min(int(y1), 479) , min(int(x2), 639), min(int(y2), 479)
                            if mask[y1, x1] != 0 and mask[y2, x2] != 0:
                                context[class_names[cls]] = "in place"
                            else:
                                context[class_names[cls]] = "out of place"   

                
                for tool in last_seen:
                    status = "missing"
                    if tool in context:
                        status = context[tool]
                    mdata.append(
                        {
                            "tool": tool,
                            "status": status,
                            "last_seen": last_seen[tool],
                        }
                    )

                results = []
                mdata_str = json.dumps(mdata, indent=4)
                await ws.send(mdata_str)

            if current_time - start_time >= INTERVAL:
                video_path = f"{current_time}.mp4"
                batched_video_bytes = get_batched_video(frames)
                upload_video_to_firebase(batched_video_bytes, video_path)
                frame_idx, best_result = find_best_result(results)
            

                for md in mdata:
                    if md["tool"] in context:
                        last_seen[md["tool"]] = video_path
                        md["last_seen"] = last_seen[md["tool"]]


                start_time = current_time
                frames = []


                mdata_str = json.dumps(mdata, indent=4)
                await ws.send(mdata_str)

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
