import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class WebSocketConsumer(AsyncJsonWebsocketConsumer):

    groups = ("taskstatus",)

    async def connect(self):
        await self.accept()

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type", "")

        if msg_type == "ping":
            await self.send_json({"type": "pong"})

    async def taskstatus_complete(self, event):
        if isinstance(event["task"], str):
            event["task"] = json.loads(event["task"])
        await self.send_json(event)

    async def disconnect(self, closed_code):
        pass
