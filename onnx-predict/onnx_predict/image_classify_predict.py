import cv2
import numpy as np
import onnxruntime

# 初始化
# model='model.onnx'
# image_path = 'image_05091.jpg'
# label_path='label_list.txt'
# crop_size=224
# resize_size=256


class PredictModel:
    def __init__(self, model_path, label_path, crop_size=224, resize_size=256, use_gpu=False):
        self.model_path = model_path
        self.label_path = label_path
        self.crop_size = crop_size
        self.resize_size = resize_size
        self.use_gpu = use_gpu

        # 加载模型
        self.session_options = onnxruntime.SessionOptions()
        if self.use_gpu:
            self.session_options.graph_optimization_level = onnxruntime.GraphOptimizationLevel.ORT_ENABLE_ALL
            self.providers = ["CUDAExecutionProvider"]
        else:
            self.providers = ["CPUExecutionProvider"]

        self.session = onnxruntime.InferenceSession(
            self.model_path, providers=self.providers, sess_options=self.session_options
        )

        # 加载标签
        self.label_map = self.load_label_map()

    def load_label_map(self):
        label_map = {}
        with open(self.label_path) as f:
            for line in f:
                parts = line.strip().split()
                label_map[int(parts[0])] = parts[1]
        return label_map

    def preprocess(self, image_data):
        """Preprocess input image file
        Args:
            image_path(str): Path of input image file


        Returns:
            preprocessed data(np.ndarray): Shape of [N, C, H, W]
        """

        def resize_by_short(im, resize_size):
            short_size = min(im.shape[0], im.shape[1])
            scale = resize_size / short_size
            new_w = int(round(im.shape[1] * scale))
            new_h = int(round(im.shape[0] * scale))
            return cv2.resize(im, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        def center_crop(im, crop_size):
            h, w, c = im.shape
            w_start = (w - crop_size) // 2
            h_start = (h - crop_size) // 2
            w_end = w_start + crop_size
            h_end = h_start + crop_size
            return im[h_start:h_end, w_start:w_end, :]

        def normalize(im, mean, std):
            im = im.astype("float32") / 255.0
            # to rgb
            im = im[:, :, ::-1]
            mean = np.array(mean).reshape((1, 1, 3)).astype("float32")
            std = np.array(std).reshape((1, 1, 3)).astype("float32")
            return (im - mean) / std

        # resize the short edge to `resize_size`
        # im = cv2.imread(image_path)
        im = image_data
        resized_im = resize_by_short(im, self.resize_size)

        # crop from center
        croped_im = center_crop(resized_im, self.crop_size)

        # normalize
        normalized_im = normalize(croped_im, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225])

        # transpose to NCHW
        data = np.expand_dims(normalized_im, axis=0)
        data = np.transpose(data, (0, 3, 1, 2))

        return data

    def postprocess(self, result, topk=5):
        # choose topk index and score
        label_map = self.label_map
        scores = result.flatten()
        topk_indices = np.argsort(-1 * scores)[:topk]
        topk_scores = scores[topk_indices]
        topk_labels = [label_map[i] for i in topk_indices]
        # print("TopK Indices: ", topk_indices)
        # print("TopK Scores: ", topk_scores)
        # print("TopK Labels: ", topk_labels)
        output = []

        # 添加每个类别的得分到 JSON 输出中
        for label, score in zip(topk_labels, topk_scores):
            output.append({"label": label, "confidence": round(score.item(), 4)})
        # 将输出转换为 JSON 格式并打印
        return output

    def onnx_predict(self, image_data):
        data = self.preprocess(image_data)
        (result,) = self.session.run(None, {"x": data})
        return self.postprocess(result)


if __name__ == "__main__":
    # onnx_predict(model, image_path,use_GPU)
    # 示例用法
    model_path = "model.onnx"
    label_path = "label_list.txt"
    image_path = "image_05091.jpg"
    use_gpu = False  # Whether to use GPU

    onnx_infer = PredictModel(model_path, label_path, use_gpu=use_gpu)

    # 进行推理

    image_data = cv2.imread(image_path)
    json_output = onnx_infer.onnx_predict(image_data)
    print(json_output)
