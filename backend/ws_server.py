from collections import defaultdict
import json
import time
import cv2
import websockets
import base64
import asyncio
from ultralytics import YOLO

model = YOLO("./best.pt")

PORT = 8080

# # Initialize video capture
cap = cv2.VideoCapture(0)  # CHANGE THIS TO THE INPUT STREAM FOR THE HARDWARE
class_names = {0: 'forceps', 1: 'gauze', 2: 'scissors'}
colors = [(255, 42, 4), (235, 219, 11), (243, 243, 243)]

async def handle_connection(ws: websockets.WebSocketClientProtocol):
    print("Client connected")
    results = []
    start_time = time.time()

    # Start the video capturing loop
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        resized_frame = cv2.resize(frame, (640, 480))

        # Get detection result
        result = model(resized_frame, verbose=False, conf = 0.4)
        results.append(result)
        # Annotate the frame
        annotated_frame = result[0].plot(boxes = False)
        
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

        _, buffer = cv2.imencode(".jpg", annotated_frame)
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")
        await ws.send(jpg_as_text)

        # Get the current time
        current_time = time.time()

        # Check if 5 seconds have passed
        if current_time - start_time >= 5:
            # Compute the best result from the last 5 seconds
            frame_idx, best_result = find_best_result(results)

            mdata = '[]'
            # Save the best result to the list
            if best_result is not None:
                # best_results.append((frame_idx, best_result))
                res = best_result
                # Assuming annotated_frame is the image you want to display
                metadata = res[0].boxes.cls

                # Convert the tensor to a Python list and then to a set of unique class indices
                class_indices = set(metadata.tolist())

                # Map the class indices to their corresponding class names
                present_classes = [class_names[int(cls)] for cls in class_indices if int(cls) in class_names]
                mdata = json.dumps(present_classes)
                                   
            await ws.send(mdata)

            # Reset the time and clear the results for the next 5 seconds
            start_time = current_time
            results = []  # Clear results for the next window

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
    server = await websockets.serve(handle_connection, "localhost", PORT, process_request=None)
    print(f"WebSocket server started on port {PORT}")
    await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(start_server())
