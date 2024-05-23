from fastapi import APIRouter
from apps.application.apis.deploy_online_infers import router as deploy_online_infers_router

router = APIRouter(
    prefix="/applications",
    tags=["应用管理"],
    responses={404: {"description": "Not found"}},
)

router.include_router(deploy_online_infers_router)
