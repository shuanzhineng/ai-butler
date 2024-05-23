from ai_butler_sdk.celery_app import create_celery_app

celery_app = create_celery_app()
celery_app.autodiscover_tasks(["celery_app"])
