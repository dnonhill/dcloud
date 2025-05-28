from rest_framework.exceptions import ErrorDetail
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        if hasattr(exc, "detail") and isinstance(exc.detail, ErrorDetail):
            response.data = {
                "status_code": response.status_code,
                "code": exc.detail.code,
                "message": str(exc.detail),
            }
        elif hasattr(exc, "detail") and isinstance(exc.detail, (dict, list)):
            response.data = {
                "status_code": response.status_code,
                "code": exc.default_code,
                "message": exc.default_detail,
                "details": exc.detail,
            }
        elif "detail" in response.data:
            response.data = {
                "status_code": response.status_code,
                "message": response.data["detail"],
            }

    return response
