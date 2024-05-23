from common.base_pydantic import CreatorOut, custom_base_model_config
from apps.ai_model.models.db import TrainTask
from pydantic import field_validator
from apps.ai_model.models.db import TrainTaskGroup
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from common.enums import AnnotationTypeEnum, TrainStatusEnum

# ---------------------标注任务model------------------------
_TrainTaskGroupOut = pydantic_model_creator(
    TrainTaskGroup, name="_TrainTaskGroupOut", model_config=custom_base_model_config
)

_TrainTaskOut = pydantic_model_creator(TrainTask, name="_TrainTaskOut", model_config=custom_base_model_config)
BaseTaskOut = pydantic_model_creator(TrainTask, include=("id", "version"), name="BaseTaskOut")


class TrainTaskGroupOut(_TrainTaskGroupOut):  # type: ignore
    creator: CreatorOut | None = None
    task_count_stat: dict = {}

    @field_validator(
        "ai_model_type",
    )
    @classmethod
    def change_ai_model_type(cls, v):
        if not isinstance(v, dict):
            return {"name": AnnotationTypeEnum.get_display(v), "value": v}
        return v


class TrainTaskOut(_TrainTaskOut):  # type: ignore
    creator: CreatorOut | None = None

    @field_validator(
        "status",
    )
    @classmethod
    def change_status(cls, v):
        if not isinstance(v, dict):
            return {"name": TrainStatusEnum.get_display(v), "value": v}
        return v

    @field_validator(
        "version",
    )
    @classmethod
    def change_version(cls, v):
        return f"V{v}"


class TrainTaskDetailOut(_TrainTaskOut):  # type: ignore
    creator: CreatorOut | None = None
    ai_model_type: str
    show_data_sets: list[dict]
    base_task: BaseTaskOut | None = None  # type: ignore

    @field_validator(
        "status",
    )
    @classmethod
    def change_status(cls, v):
        if not isinstance(v, dict):
            return {"name": TrainStatusEnum.get_display(v), "value": v}
        return v

    @field_validator(
        "version",
    )
    @classmethod
    def change_version(cls, v):
        return f"V{v}"
