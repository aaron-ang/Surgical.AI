import asyncio
import websockets


async def receive_metadata():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket server")
        while True:
            metadata = await websocket.recv()
            print(f"Received metadata: {metadata}")


if __name__ == "__main__":
    asyncio.run(receive_metadata())
