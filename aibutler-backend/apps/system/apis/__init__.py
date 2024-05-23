from fastapi import APIRouter
from apps.system.apis.menus import router as menus_router
from apps.system.apis.roles import router as roles_router
from apps.system.apis.depts import router as depts_router
from apps.system.apis.users import router as users_router
from apps.system.apis.logs import router as logs_router
from apps.system.apis.celery_workers import router as celery_workers_router


router = APIRouter(
    prefix="/system",
    tags=["系统管理"],
    responses={404: {"description": "Not found"}},
)

router.include_router(menus_router)
router.include_router(roles_router)
router.include_router(depts_router)
router.include_router(users_router)
router.include_router(logs_router)
router.include_router(celery_workers_router)
