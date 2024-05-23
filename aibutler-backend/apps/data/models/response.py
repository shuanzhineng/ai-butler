from common.base_pydantic import CreatorOut, custom_base_model_config, CustomBaseModel
from pydantic import field_validator
from apps.data.models.db import LabelTask, LabelTaskSample, DataSet, DataSetGroup
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from common.enums import AnnotationTypeEnum, MediaTypeEnum

# ---------------------标注任务model------------------------
_LabelTaskOut = pydantic_model_creator(LabelTask, name="_LabelTaskOut", model_config=custom_base_model_config)
_LabelTaskSampleOut = pydantic_model_creator(
    LabelTaskSample, name="_LabelTaskSampleOut", model_config=custom_base_model_config
)


class LabelTaskOut(_LabelTaskOut):  # type: ignore
    creator: CreatorOut | None = None
    stats: dict = {}


class LabelTaskSampleOut(_LabelTaskSampleOut):  # type: ignore
    # @field_validator(
    #     "data",
    # )
    # @classmethod
    # def change_genre(cls, v):
    #     return json.dumps(v, ensure_ascii=False)
    pass


# ---------------------数据集组model------------------------


_DataSetGroupOut = pydantic_model_creator(DataSetGroup, name="_DataSetGroupOut", model_config=custom_base_model_config)


class DataSetGroupOut(_DataSetGroupOut):  # type: ignore
    creator: CreatorOut | None = None
    data_set_count: int = 0

    @field_validator(
        "data_type",
    )
    @classmethod
    def change_data_type(cls, v):
        if not isinstance(v, dict):
            return {"name": MediaTypeEnum.get_display(v), "value": v}
        return v

    @field_validator(
        "annotation_type",
    )
    @classmethod
    def change_annotation_type(cls, v):
        if not isinstance(v, dict):
            return {"name": AnnotationTypeEnum.get_display(v), "value": v}
        return v


_DataSetOut = pydantic_model_creator(
    DataSet, name="_DataSetOut", model_config=custom_base_model_config, exclude=("file", "data_set_group")
)


class OssFile(CustomBaseModel):
    id: int
    filename: str


class DataSetOut(_DataSetOut):  # type: ignore
    file: OssFile | None = None

    @field_validator(
        "version",
    )
    @classmethod
    def change_version(cls, v):
        return f"V{v}"
