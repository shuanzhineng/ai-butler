pull-backend:
	@echo "Pulling aibutler-backend from Gitee..."
	git subtree pull --prefix=aibutler-backend git@gitee.com:whentechs/aibutler-backend.git main
	@echo "Done."

pull-frontend:
	@echo "Pulling aibutler-frontend to Gitee..."
	git subtree pull --prefix=aibutler-frontend git@gitee.com:whentechs/aibutler-frontend.git master
	@echo "Done."

pull-deploy-predict:
	@echo "Pulling deploy-predict from Gitee..."
	git subtree pull --prefix=deploy-predict git@gitee.com:whentechs/deploy-predict.git master
	@echo "Done."

pull-onnx-predict:
	@echo "Pulling onnx-predict from Gitee..."
	git subtree pull --prefix=onnx-predict git@gitee.com:whentechs/onnx-predict.git master
	@echo "Done."

pull-paddle-image-classify:
	@echo "Pulling paddle-image-classify from Gitee..."
	git subtree pull --prefix=paddle-image-classify git@gitee.com:whentechs/paddle-image-classify.git master
	@echo "Done."

pull-pytorch-object-detection:
	@echo "Pulling pytorch-object-detection from Gitee..."
	git subtree pull --prefix=pytorch-object-detection git@gitee.com:whentechs/pytorch-object-detection.git main
	@echo "Done."

push-backend:
	@echo "Pushing aibutler-backend to Gitee..."
	git subtree push --prefix=aibutler-backend git@gitee.com:whentechs/aibutler-backend.git main
	@echo "Done."

push-frontend:
	@echo "Pushing aibutler-frontend to Gitee..."
	git subtree push --prefix=aibutler-frontend git@gitee.com:whentechs/aibutler-frontend.git master
	@echo "Done."

push-deploy-predict:
	@echo "Pushing deploy-predict to Gitee..."
	git subtree push --prefix=deploy-predict git@gitee.com:whentechs/deploy-predict.git master
	@echo "Done."

push-onnx-predict:
	@echo "Pushing onnx-predict to Gitee..."
	git subtree push --prefix=onnx-predict git@gitee.com:whentechs/onnx-predict.git master
	@echo "Done."

push-paddle-image-classify:
	@echo "Pushing paddle-image-classify to Gitee..."
	git subtree push --prefix=paddle-image-classify git@gitee.com:whentechs/paddle-image-classify.git master
	@echo "Done."

push-pytorch-object-detection:
	@echo "Pushing pytorch-object-detection to Gitee..."
	git subtree push --prefix=pytorch-object-detection git@gitee.com:whentechs/pytorch-object-detection.git main
	@echo "Done."

# Default target
.PHONY: push-backend push-frontend push-deploy-predict push-onnx-predict push-paddle-image-classify push-pytorch-object-detection
