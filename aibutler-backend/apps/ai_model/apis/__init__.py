from fastapi import APIRouter
from apps.ai_model.apis.train_tasks import router as train_tasks_router


router = APIRouter(
    prefix="/ai-models",
    tags=["模型管理"],
    responses={404: {"description": "Not found"}},
)

router.include_router(train_tasks_router)
