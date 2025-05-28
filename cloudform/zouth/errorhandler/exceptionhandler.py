import os
from rest_framework.response import Response
from rest_framework.validators import ValidationError
from rest_framework.views import exception_handler

# TODO Implement this class and include lookup method
_error_messages = {}
with open(os.path.join(os.path.dirname(__file__), "./messages.properties")) as f:
    lines = f.readlines()
    for line in lines:
        cols = [col.strip() for col in line.split("=")]
        key, val = cols[0], str(cols[1].strip('"'))
        _error_messages[key] = val


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    error = {"code": error_code(exc, context), "message": error_messasge(exc, context)}
    detail = error_detail(exc, response)
    if detail:
        error["detail"] = detail
    return Response(error, status=response.status_code)


def error_code(exc, context):
    if hasattr(exc, "code"):
        return exc.code
    if isinstance(exc, ValidationError):
        return "validation"
    return "error"


def lookup_errmsg(code, exc, context):
    return _error_messages.get(code.lower())


def error_messasge(exc, context):
    if hasattr(exc, "message"):
        return exc.message
    code = error_code(exc, context)
    message = lookup_errmsg(code, exc, context)
    return message if message is not None else "error"


def error_detail(exc, response):
    detail = None
    if isinstance(exc, ValidationError):
        detail = validatioin_exc_detail(response)
    return detail


def validatioin_exc_detail(response):
    detail = {"fields": response.data}
    if "non_field_errors" in detail["fields"]:
        detail["non_field_errors"] = detail["fields"]["non_field_errors"]
        del detail["fields"]["non_field_errors"]
    return detail
