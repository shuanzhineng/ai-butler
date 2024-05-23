from common.base_pydantic import CustomBaseModel
from pydantic import Field, field_validator

from typing import Any
from common.enums import MediaTypeEnum, LabelTaskSampleStateEnum, AnnotationTypeEnum


class LabelTaskIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    media_type: MediaTypeEnum
    description: str = Field(min_length=0, max_length=200, default="")
    tips: str = ""
    config: str = ""


class PatchLabelTaskIn(CustomBaseModel):
    name: str | None = Field(min_length=1, max_length=50, default=None)
    media_type: MediaTypeEnum | None = None
    description: str | None = Field(min_length=0, max_length=200, default="")
    tips: str | None = None
    config: str | None = None


class _LabelTaskSampleIn(CustomBaseModel):
    attachement_ids: list[int]
    data: dict[str, Any]


class LabelTaskSampleIn(CustomBaseModel):
    items: list[_LabelTaskSampleIn]


class PatchLabelTaskSampleIn(CustomBaseModel):
    data: dict[str, Any] | None = None
    annotated_count: int | None = None
    urls: dict[str, Any] | None = None
    state: LabelTaskSampleStateEnum | None = None


class DataSetGroupIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=0, max_length=200, default="")
    disabled: bool = False
    data_type: MediaTypeEnum = MediaTypeEnum.IMAGE
    annotation_type: AnnotationTypeEnum


class DataSetIn(CustomBaseModel):
    description: str = Field(min_length=0, max_length=200, default="")
    file_id: int


class LabeluExportDataSetsIn(CustomBaseModel):
    sample_ids: list = []
    dataset_group_name: str = ""
    dataset_group_id: str = ""
    dataset_group_note: str = ""

    @field_validator("dataset_group_id")
    @classmethod
    def validate_password(cls, v, values):
        dataset_group_name = values.data["dataset_group_name"]
        if not dataset_group_name and not v:
            raise ValueError("dataset_group_name 和 dataset_group_id不能同时为空")
        return v
