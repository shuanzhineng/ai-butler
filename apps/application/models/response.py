from common.base_pydantic import CreatorOut, custom_base_model_config
from apps.application.models.db import DeployOnlineInfer
from pydantic import field_validator
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from common.enums import DeployOnlineInferStatusEnum
from common.base_pydantic import CustomBaseModel

# ---------------------标注任务model------------------------
_DeployOnlineInferOut = pydantic_model_creator(
    DeployOnlineInfer, name="_DeployOnlineInferOut", model_config=custom_base_model_config
)


class TrainTaskOut(CustomBaseModel):
    id: int
    ai_model_type: dict


class DeployOnlineInferOut(_DeployOnlineInferOut):  # type: ignore
    creator: CreatorOut | None = None
    train_task_id: int | None = None
    train_task_out: TrainTaskOut | None = None

    @field_validator(
        "status",
    )
    @classmethod
    def change_status(cls, v):
        if not isinstance(v, dict):
            return {"name": DeployOnlineInferStatusEnum.get_display(v), "value": v}
        return v
