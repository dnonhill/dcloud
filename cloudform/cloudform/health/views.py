from asgiref.sync import async_to_sync
from channels_redis.core import RedisChannelLayer
from django.conf import settings
from django.db import connections
from django.db.utils import DatabaseError

# Create your views here.
from rest_framework.response import Response
from rest_framework.views import APIView

STATUS_OK = "ok"
STATUS_ERROR = "error"
STATUS_DISABLED = "disabled"


async def check_channel_redis():
    result = {"status": STATUS_DISABLED}
    channel_layers_setting = settings.CHANNEL_LAYERS.get("default")

    if not channel_layers_setting:
        return result

    try:
        backend = channel_layers_setting.get("BACKEND")
        result["backend"] = backend
        hosts = channel_layers_setting.get("CONFIG", {}).get("hosts")
        result["hosts"] = hosts
        if hosts is None:
            raise LookupError(
                "no hosts in settings.CHANNEL_LAYERS['default']['CONFIG']"
            )

        channel_layer = RedisChannelLayer(hosts=hosts, capacity=10)
        await channel_layer.send("test-channel-1", {"type": "test.message"})
        message = await channel_layer.receive("test-channel-1")
        assert message["type"] == "test.message", "fail to assert received message"
        result["status"] = STATUS_OK
    except Exception as err:
        result["status"] = STATUS_ERROR
        result["exception"] = str(err)

    return result


def check_database():
    db_conn = connections["default"]
    try:
        c = db_conn.cursor()
        c.execute("select 1;")
        c.fetchone()
        return {"status": STATUS_OK}
    except DatabaseError as err:
        return {"status": STATUS_ERROR, "exception": str(err)}


class HealthCheck(APIView):
    permission_classes = ()

    def get(self, request, *args, **kwargs):
        components = {
            "database": check_database(),
            "channel_redis": async_to_sync(check_channel_redis)(),
        }
        status = all(
            [
                component.get("status") == STATUS_OK
                for _, component in components.items()
            ]
        )
        result = {
            "status": STATUS_OK if status else STATUS_ERROR,
            "version": settings.DCLOUD_VERSION,
            "git_hash": settings.DCLOUD_GIT_HASH,
            "deploy_date": settings.DCLOUD_DEPLOY_DATE,
            "components": components,
        }

        return Response(result)
