from fastapi import APIRouter
from apps.data.apis.label_tasks import router as label_tasks_router
from apps.data.apis.data_sets import router as data_sets_router


router = APIRouter(
    prefix="/data",
    tags=["数据管理"],
    responses={404: {"description": "Not found"}},
)

router.include_router(label_tasks_router)
router.include_router(data_sets_router)
