# -*- coding:UTF-8 -*-
from trainer import Trainer
import os
from config import opt


train_hyp_params = {
    "lr0": 0.01,  # initial learning rate (SGD=1E-2, Adam=1E-3)
    "lrf": 0.01,  # final OneCycleLR learning rate (lr0 * lrf)
    "momentum": 0.937,  # SGD momentum/Adam beta1
    "weight_decay": 0.0005,  # optimizer weight decay 5e-4
    "warmup_epochs": 3.0,  # warmup epochs (fractions ok)
    "warmup_momentum": 0.8,  # warmup initial momentum
    "warmup_bias_lr": 0.1,  # warmup initial bias lr
    "box": 0.05,  # box loss gain
    "cls": 0.5,  # cls loss gain
    "cls_pw": 1.0,  # cls BCELoss positive_weight
    "obj": 1.0,  # obj loss gain (scale with pixels)
    "obj_pw": 1.0,  # obj BCELoss positive_weight
    "iou_t": 0.20,  # IoU training threshold
    "anchor_t": 4.0,  # anchor-multiple threshold
    # anchors: 3  # anchors per output layer (0 to ignore)
    "fl_gamma": 0.0,  # focal loss gamma (efficientDet default gamma=1.5)
    "hsv_h": 0.015,  # image HSV-Hue augmentation (fraction)
    "hsv_s": 0.7,  # image HSV-Saturation augmentation (fraction)
    "hsv_v": 0.4,  # image HSV-Value augmentation (fraction)
    "degrees": 0.0,  # image rotation (+/- deg)
    "translate": 0.1,  # image translation (+/- fraction)
    "scale": 0.5,  # image scale (+/- gain)
    "shear": 0.0,  # image shear (+/- deg)
    "perspective": 0.0,  # image perspective (+/- fraction), range 0-0.001
    "flipud": 0.0,  # image flip up-down (probability)
    "fliplr": 0.5,  # image flip left-right (probability)
    "mosaic": 1.0,  # image mosaic (probability)
    "mixup": 0.0,  # image mixup (probability)
    "copy_paste": 0.0,  # segment copy-paste (probability)
}
train_params = {
    "train_hyp_params": train_hyp_params,  # 判断是否为空
    "train_data_ratio": 0.8,
    "epochs": 1,  # epochs: 训练多少epochs停止（带有早停机制）
    "batch_size": 16,  # batch size: 批次
    "imgsz": 224,  # 训练图片大小： 使用32的倍数，建议大于112, 常见值224,384,426, 640,1024
    "device": "0",  # 设备：0: 0号显卡   0,1,2: 0,1,2号显卡   cpu: 使用cpu
    "multi_scale": False,  # 多尺度训练: False 关闭多尺度, True 开启多尺度
    "optimizer": "SGD",  # 优化器： 高阶调参操作
    "workers": 0,  # 线程数：数据加载使用的线程数，linux环境下使用，建议不要太高，平常训练建议值2,4,8
    "cos_lr": False,  # 预先学习率: [使用默认值]调参操作,是否使用标签学习率，使用默认值
    "label_smoothing": 0.0,  # 标签平滑参数[使用默认值]：取值范围[0.0,1.0]    调参操作：是否使用标签平滑，使用默认值
    "freeze": [0],  # 冻结权重[使用默认值]:  是否选用冻结权重，高阶操作，使用默认值，不做修改
    "save_period": -1,  # 每多少轮保存权重[使用默认值]：这里可以不做修改，使用默认值；如果要修改，save_period < epochs
    "seed": 0,  # 随机种子[使用默认值]： 可以使用任务id，保证每次训练同样一批数据结果接近，也可以不做修改，使用默认值即可
}
task_id = "123456"
raw_dataset = "/data/home/lizhiyong/dataset/plateform/raw_dataset"
coco_dir = r"/data/home/lizhiyong/dataset/plateform/coco_closeye"
output_dir = "/data/home/lizhiyong/dataset/plateform/task_coco_closeye"
trainer = Trainer(
            task_id,
            raw_dataset,
            coco_dir,
            output_dir,
            train_params,
            model_name="yolov5n",  # 可以从TrainBase中获取
            second_train=False,
            train_result_zip = os.path.join(output_dir, "train_result.zip"),
            train_log = os.path.join(opt.root, "train.log")
)
trainer.train()
trainer.delete()