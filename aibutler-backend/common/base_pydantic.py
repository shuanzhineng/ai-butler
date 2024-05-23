"""
自定义的pydantic.BaseModel
"""
from datetime import date, datetime

from pydantic import BaseModel

from conf.settings import settings
from tortoise.contrib.pydantic.creator import pydantic_model_creator
from apps.system.models.db import User

CreatorOut = pydantic_model_creator(User, include=("id", "name", "username"), name="CreatorOut")


class CustomBaseModel(BaseModel):
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.strftime(settings.DATETIME_FORMAT),
            date: lambda dt: dt.strftime(settings.DATE_FORMAT),
        }


custom_base_model_config = {
    "json_encoders": {
        datetime: lambda dt: dt.strftime(settings.DATETIME_FORMAT),
        date: lambda dt: dt.strftime(settings.DATE_FORMAT),
    }
}
