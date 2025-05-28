from channels.auth import AuthMiddlewareStack
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path, re_path

from . import consumers
from . import webhooks

application = ProtocolTypeRouter(
    {
        "websocket": AuthMiddlewareStack(
            URLRouter([path("ws/", consumers.WebSocketConsumer)])
        ),
        "http": AuthMiddlewareStack(
            URLRouter(
                [
                    path("webhooks/taskstatus/", webhooks.TaskStatusConsumer),
                    re_path("", AsgiHandler),
                ]
            )
        ),
    }
)
