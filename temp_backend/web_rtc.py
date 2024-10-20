import asyncio
import json
import cv2
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer


async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state is:", pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    options = {
        "format": "avfoundation",
        "video_size": "1280x720",
        "framerate": "30",
        "pixel_format": "uyvy422",
    }
    player = MediaPlayer("default:none", format="avfoundation", options=options)

    await pc.setRemoteDescription(offer)
    for t in pc.getTransceivers():
        if t.kind == "video":
            pc.addTrack(player.video)

    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
    )


async def get_webcam_frame(request):
    # Initialize webcam capture
    cap = cv2.VideoCapture(0)  # 0 is usually the default webcam

    if not cap.isOpened():
        return web.Response(status=500, text="Failed to open webcam")

    # Capture a single frame
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return web.Response(status=500, text="Failed to capture frame")

    # Encode frame as JPEG
    _, img_encoded = cv2.imencode(".jpg", frame)

    # Create response with JPEG image
    response = web.Response(body=img_encoded.tobytes(), content_type="image/jpeg")
    return response


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


pcs = set()
app = web.Application()
app.on_shutdown.append(on_shutdown)
app.router.add_get("/test_webcam", get_webcam_frame)
app.router.add_post("/offer", offer)

if __name__ == "__main__":
    web.run_app(app, host="localhost", port=8080)
