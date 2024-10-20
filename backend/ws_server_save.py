from collections import defaultdict
import json
import time
import cv2
import websockets
import base64
import asyncio
from ultralytics import YOLO

model = YOLO("./Experiments/runs/segment/train/weights/best.pt")

PORT = 8080

# Initialize video capture
cap = cv2.VideoCapture(0)  # CHANGE THIS TO THE INPUT STREAM FOR THE HARDWARE


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
        result = model(resized_frame, verbose=False)
        results.append(result)

        # Annotate the frame
        annotated_frame = result[0].plot()

        # cv2.imshow("frame", annotated_frame)

        _, buffer = cv2.imencode(".jpg", annotated_frame)
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")
        await ws.send(jpg_as_text)

        # Get the current time
        current_time = time.time()

        # Check if 5 seconds have passed
        if current_time - start_time >= 5:
            # Compute the best result from the last 5 seconds
            frame_idx, best_result = find_best_result(results)

            # Save the best result to the list
            if best_result is not None:
                # best_results.append((frame_idx, best_result))
                res = best_result
                # Assuming annotated_frame is the image you want to display
                annotated_frame = res[0].plot()
                metadata = res[0].boxes.cls
                tensor_string = json.dumps(metadata.tolist())
                print("Tensor String: ", tensor_string)
                await ws.send(tensor_string)

            # Reset the time and clear the results for the next 5 seconds
            start_time = current_time
            results = []  # Clear results for the next window

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # Release the video capture and destroy windows
    cap.release()
    # cv2.destroyAllWindows()


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
    server = await websockets.serve(handle_connection, "localhost", PORT)
    print(f"WebSocket server started on port {PORT}")
    await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(start_server())
