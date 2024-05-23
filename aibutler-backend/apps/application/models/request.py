from common.base_pydantic import CustomBaseModel
from pydantic import Field
from common.enums import DeployOnlineInferStatusEnum


class CreateDeployOnlineInferIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=0, max_length=200, default="")
    train_task_id: int
    is_gpu: bool = False


class PutDeployOnlineInferIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=0, max_length=200, default="")


class PutDeployOnlineInferByWorkerIn(CustomBaseModel):
    status: DeployOnlineInferStatusEnum
    reason: str = ""
    infer_address: str = ""
