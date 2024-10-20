import asyncio
import websockets

connected_clients: set[websockets.WebSocketClientProtocol] = set()


async def handle_connection(ws: websockets.WebSocketClientProtocol, path):
    connected_clients.add(ws)
    try:
        async for message in ws:
            tasks = [
                asyncio.create_task(client.send(message))
                for client in connected_clients
                if client != ws
            ]
            if tasks:
                await asyncio.wait(tasks)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

    finally:
        connected_clients.remove(ws)


async def start_server():
    server = await websockets.serve(handle_connection, "0.0.0.0", 8765)
    print("WebSocket server started on port 8765")
    await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(start_server())
