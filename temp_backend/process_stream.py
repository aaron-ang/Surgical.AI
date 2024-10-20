import cv2
import time
import websockets
import asyncio

frame_count = 0
last_metadata_sent = 0

input_stream = "rtmp://localhost/live/stream"
output_stream = "rtmp://localhost/live/processed_stream"

cap = cv2.VideoCapture(input_stream)

fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

fourcc = cv2.VideoWriter_fourcc(*"flv1")
out = cv2.VideoWriter(output_stream, fourcc, fps, (width, height), isColor=False)


async def send_metadata(metadata):
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        await websocket.send(metadata)
        print(f"Sent metadata: {metadata}")


while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    out.write(gray_frame)

    # # Write the processed frame to the output stream
    # ffmpeg_out.stdin.write(
    #     processed_frame
    #     .tobytes()
    # )

    frame_count += 1

    current_time = time.time()
    if current_time - last_metadata_sent >= 1:  # 5 seconds interval
        metadata = f"Frame {frame_count}, Size: {width}x{height}, Timestamp: {cv2.getTickCount()}"
        asyncio.run(send_metadata(metadata))  # Send metadata asynchronously
        last_metadata_sent = current_time  # Update the time when metadata was last sent
