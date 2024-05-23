from common.exceptions.handler import CustomException


class JWTTokenError:
    class InvalidAccessTokenError(CustomException):
        status_code = 401
        default_detail = "无效的access token!"
        default_code = "10001"

    class InvalidRefreshTokenError(CustomException):
        status_code = 400
        default_detail = "无效的refresh token!"
        default_code = "10002"

    class InvalidUserError(CustomException):
        status_code = 400
        default_detail = "用户已被禁用!"
        default_code = "10003"

    class InvalidPasswordError(CustomException):
        status_code = 400
        default_detail = "密码输入有误!"
        default_code = "10004"

    class UserNegationError(CustomException):
        status_code = 400
        default_detail = "用户不存在!"
        default_code = "10005"


class CommonError:
    class ResourceDoesNotExistError(CustomException):
        status_code = 400
        default_detail = "输入的资源id不存在!"
        default_code = "20001"

    class InnerAuthenticationError(CustomException):
        status_code = 400
        default_detail = "内部接口认证失败!"
        default_code = "20002"

    class WorkerOnlineError(CustomException):
        status_code = 400
        default_detail = "worker上线失败!"
        default_code = "20003"
