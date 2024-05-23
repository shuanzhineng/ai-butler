from common.exceptions.handler import CustomException


class CommonError:
    class InvalidTokenError(CustomException):
        status_code = 401
        default_detail = "无效的authentication token!"
        default_code = "10001"
