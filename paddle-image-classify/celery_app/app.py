from ai_butler_sdk.celery_app import celery_app


celery_app.autodiscover_tasks(["celery_app"])