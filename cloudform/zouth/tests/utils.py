def extract_response_error(response):
    return response.data if hasattr(response, "data") else response
