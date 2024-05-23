import numpy as np
import onnxruntime  # >=1.9 API 有些许变化
import cv2
from onnx_predict.utils import Colors


class PredictModel:
    def __init__(
        self,
        onnx_path,
        # conf_thres=0.6,
        # iou_thres=0.45,
        conf_thres=0.1,
        iou_thres=0.1,
        cls_name=None,
        hide_labels=False,
        hide_conf=False,
        is_gpu=False,
    ):
        if cls_name is None:
            cls_name = list()
        self.onnx_path = onnx_path
        if is_gpu:
            self.ort_session = onnxruntime.InferenceSession(
                onnx_path, providers=["CUDAExecutionProvider"]
            )  # 'TensorrtExecutionProvider'
        else:
            self.ort_session = onnxruntime.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
        # print(self.ort_session.get_inputs()[0])
        # print(self.ort_session.get_outputs()[0])
        self.new_shape = self.ort_session.get_inputs()[0].shape[2:]
        self.conf_thres = conf_thres
        self.iou_thres = iou_thres
        self.names = cls_name
        self.hide_labels = hide_labels
        self.hide_conf = hide_conf
        self.line_thickness = 3
        self.colors = Colors()

    def detect(self, image, frame=False, have_label=False):
        """

        :param image: cv2图片
        :param frame: 是否画框
        :param have_label: 画框带标签
        :return:
        """
        img, pad, scale = self.letterbox(image, self.new_shape)  # 填充黑边
        img = img[:, :, ::-1].transpose(2, 0, 1)  # BGR to RGB
        img = np.ascontiguousarray(img).astype(np.float32)
        img /= 255.0  # 0 - 255 to 0.0 - 1.0
        if img.ndim == 3:  # 如果维度为3,就进行升维
            img = img[None]
        # Inference
        ort_inputs = {self.ort_session.get_inputs()[0].name: img}
        pred = self.ort_session.run(None, ort_inputs)[0]
        # Apply NMS
        pred = self.non_max_suppression(pred, self.conf_thres, self.iou_thres, None)  # [x1,y1,x2,y2,conf,cls]
        out_label = []
        for i, det in enumerate(pred):
            s = ""
            s += "%gx%g " % img.shape[2:]  # noqa
            if len(det):
                # 现在的坐标是在640*640的图像上，需要反算到原图上去
                det[:, :4] = self.scale_coords(det[:, 0:4], pad, scale, image.shape)
                height, width, _ = image.shape
                for *xyxy, conf, cls in reversed(det):
                    # out_label.append([*xyxy, float(conf), cls])
                    c = int(cls)
                    xyxy = [float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])]
                    normalized_x1 = float(xyxy[0]) / width
                    normalized_y1 = float(xyxy[1]) / height
                    normalized_x2 = float(xyxy[2]) / width
                    normalized_y2 = float(xyxy[3]) / height
                    out_label.append([normalized_x1, normalized_y1, normalized_x2, normalized_y2, conf, c])
                    if frame:
                        c = int(cls)  # integer class
                        label = (
                            None
                            if self.hide_labels
                            else (self.names[c] if self.hide_conf else f"{self.names[c]} {conf:.2f}")
                        )
                        color = self.colors(c, True)
                        c1, c2 = (int(xyxy[0]), int(xyxy[1])), (int(xyxy[2]), int(xyxy[3]))
                        # out_label.append([*xyxy, round(conf, 4), self.names[c]])
                        cv2.rectangle(image, c1, c2, color, thickness=1, lineType=cv2.LINE_AA)
                        if have_label:
                            tf = 1  # font thickness
                            t_size = cv2.getTextSize(label, 0, fontScale=1, thickness=tf)[0]
                            c2 = c1[0] + t_size[0], c1[1] - t_size[1] - 3
                            cv2.rectangle(image, c1, c2, color, -1, cv2.LINE_AA)  # filled
                            cv2.putText(
                                image,
                                label,
                                (c1[0], c1[1] - 2),
                                0,
                                1,
                                [225, 255, 255],
                                thickness=tf,
                                lineType=cv2.LINE_AA,
                            )
        return image, out_label

    def letterbox(self, image, onnx_hw):
        h, w = image.shape[:2]
        r = max(h / onnx_hw[0], w / onnx_hw[1])
        new_shape = int(w / r), int(h / r)
        img_border = cv2.resize(image, new_shape)
        dh, dw = onnx_hw[0] - new_shape[1], onnx_hw[1] - new_shape[0]
        left, top = dw // 2, dh // 2
        right, bottom = dw - left, dh - top
        img_border = cv2.copyMakeBorder(
            img_border, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114)
        )
        return img_border, [left, top], r

    def nms(self, dets, iou_thresh):
        boxes_area = (dets[:, 2] - dets[:, 0]) * (dets[:, 3] - dets[:, 1])
        index = (-dets[:, -1]).argsort()
        keep = []

        def iou(box, boxes, box_area, boxes_area):
            xx1 = np.maximum(box[0], boxes[:, 0])
            yy1 = np.maximum(box[1], boxes[:, 1])
            xx2 = np.minimum(box[2], boxes[:, 2])
            yy2 = np.minimum(box[3], boxes[:, 3])

            w = np.maximum(0, xx2 - xx1)
            h = np.maximum(0, yy2 - yy1)

            inter = w * h  # 交集
            ovr = inter / (box_area + boxes_area - inter)  # 交并比

            return ovr

        while index.size > 0:
            i = index[0]
            keep.append(i)
            idx = np.where(
                iou(dets[index[0]], dets[index[1:]], boxes_area[index[0]], boxes_area[index[1:]]) <= iou_thresh
            )[0]
            index = index[idx + 1]

        keep = np.array(keep)

        return keep

    # prediction: (1, 36288, 9)  cx,cy,w,h,conf,clas
    def non_max_suppression(self, prediction, conf_thres=0.25, iou_thres=0.45, classes=None):
        xc = prediction[..., 4] > conf_thres
        _, max_wh = 2, 4096

        output = [np.zeros((0, 6))] * prediction.shape[0]
        for xi, x in enumerate(prediction):
            x = x[xc[xi]]

            if not x.shape[0]:
                continue

            x[:, 5:] *= x[:, 4:5]

            box = self.xywh2xyxy(x[:, :4])

            conf = np.expand_dims(x[:, 5:].max(1), 1)
            j = np.expand_dims(x[:, 5:].argmax(1), 1)

            # [x1,y1,x2,y2  置信度  类别索引]
            x = np.concatenate((box, conf, j.astype(float)), 1)[conf.reshape(-1) > conf_thres]

            if classes is not None:
                x = x[(x[:, 5:6] == np.array(classes)).any(1)]

            if not x.shape[0]:
                continue

            c = x[:, 5:6] * max_wh
            boxes, scores = x[:, :4] + c, x[:, 4:5]
            dets = np.concatenate((boxes, scores), 1)

            i = self.nms(dets, iou_thres)

            output[xi] = x[i]

        return output

    def xywh2xyxy(self, x):
        y = np.copy(x)
        y[:, 0] = x[:, 0] - x[:, 2] / 2  # top left x
        y[:, 1] = x[:, 1] - x[:, 3] / 2  # top left y
        y[:, 2] = x[:, 0] + x[:, 2] / 2  # bottom right x
        y[:, 3] = x[:, 1] + x[:, 3] / 2  # bottom right y
        return y

    def scale_coords(self, boxes, pad, scale, image_shape):  # pad: [top, left]
        boxes[:, [0, 2]] -= pad[0]
        boxes[:, [1, 3]] -= pad[1]

        boxes[:, :4] *= scale

        def clip_coords(boxes, img_shape):
            # Clip bounding xyxy bounding boxes to image shape (height, width)
            boxes[:, 0] = boxes[:, 0].clip(0, img_shape[1])  # x1
            boxes[:, 1] = boxes[:, 1].clip(0, img_shape[0])  # y1
            boxes[:, 2] = boxes[:, 2].clip(0, img_shape[1])  # x2
            boxes[:, 3] = boxes[:, 3].clip(0, img_shape[0])  # y2

        clip_coords(boxes, image_shape)

        return boxes
