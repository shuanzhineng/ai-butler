#!/bin/sh

# 设置 MinIO 别名
mc alias set myminio http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# 创建存储桶
mc mb myminio/aibutler
