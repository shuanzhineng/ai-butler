
build-cpu:
	docker build -t ai_butler_pytorch_object_detection_gpu:v1 .

build-gpu:
	docker build -f Dockerfile.gpu -t ai_butler_pytorch_object_detection_gpu:v1 .
