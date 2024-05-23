from datetime import timedelta
from io import BytesIO

from conf.settings import settings

from minio import Minio
from loguru import logger


class MyMinio:
    def __init__(
        self,
        server_address=f"{settings.MINIO_SERVER_HOST}:{settings.MINIO_SERVER_PORT}",
    ):
        self.server_address = server_address
        self.client = Minio(
            self.server_address,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False,  # False时使用HTTP, True时使用HTTPS
        )

    def _create_bucket(self, bucket: str):
        """创建数据桶"""
        found = self.client.bucket_exists(bucket)
        if not found:
            self.client.make_bucket(bucket)

    def upload_file(
        self,
        path: str,
        file: BytesIO,
        length: int,
        bucket: str = settings.MINIO_DEFAULT_BUCKET,
    ):
        """上传文件"""
        self._create_bucket(bucket)
        logger.info(f"{bucket}/{path} 文件正在上传中...")
        self.client.put_object(bucket, path, file, length, num_parallel_uploads=10)
        logger.info(f"{bucket}/{path} 文件上传完成")

    def fupload_file(
        self,
        object_name: str,
        file_path: str,
        bucket: str = settings.MINIO_DEFAULT_BUCKET,
    ):
        """上传文件"""
        self._create_bucket(bucket)
        logger.info(f"{bucket}/{object_name} 文件正在上传中...")
        self.client.fput_object(bucket, object_name, file_path, num_parallel_uploads=10)
        logger.info(f"{bucket}/{object_name} 文件上传完成")

    def download_file(self, path: str, bucket: str = settings.MINIO_DEFAULT_BUCKET):
        """下载文件"""
        resp = self.client.get_object(bucket, path)
        return resp

    def download_and_save_file(self, object_path: str, file_path: str, bucket: str = settings.MINIO_DEFAULT_BUCKET):
        """下载并保存文件"""
        logger.info(f"{bucket}/{object_path} 文件正在下载中...")
        resp = self.client.fget_object(bucket, object_path, file_path)
        logger.info(f"{bucket}/{object_path} 文件下载完成, 保存至{file_path}")
        return resp

    def presigned_download_file(
        self, path: str, bucket: str = settings.MINIO_DEFAULT_BUCKET, expires=timedelta(days=7)
    ):
        """预签名下载文件"""
        return self.client.presigned_get_object(bucket, path, expires)

    def presigned_upload_file(self, path: str, bucket: str = settings.MINIO_DEFAULT_BUCKET, expires=timedelta(days=7)):
        """预签名上传文件文件"""
        return self.client.presigned_put_object(bucket, path, expires)


minio_client = MyMinio()
