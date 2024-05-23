# # -*- coding:UTF-8 -*-
import os
from pathlib import Path


def increment_path(path, exist_ok=False, sep='', mkdir=False):
    # Increment file or directory path, i.e. runs/exp --> runs/exp{sep}2, runs/exp{sep}3, ... etc.
    path = Path(path)  # os-agnostic
    print(path.exists())
    print( not exist_ok)
    if path.exists() and not exist_ok:
        print(path.exists() and not exist_ok)
        path, suffix = (path.with_suffix(''), path.suffix) if path.is_file() else (path, '')
        print(path,suffix)
        # Method 1
        for n in range(2, 9999):
            p = f'{path}{sep}{n}{suffix}'  # increment path
            print(p)
            if not os.path.exists(p):  #
                break
        path = Path(p)

        # Method 2 (deprecated)
        # dirs = glob.glob(f"{path}{sep}*")  # similar paths
        # matches = [re.search(rf"{path.stem}{sep}(\d+)", d) for d in dirs]
        # i = [int(m.groups()[0]) for m in matches if m]  # indices
        # n = max(i) + 1 if i else 2  # increment number
        # path = Path(f"{path}{sep}{n}{suffix}")  # increment path
    print(path)
    if mkdir:
        path.mkdir(parents=True, exist_ok=True)  # make directory

    return path


if __name__ == '__main__':
    # project = "runs/train"
    # name = "exp"
    # print(Path(project) / name)
    # increment_path(Path(project) / name, exist_ok=False,mkdir=True)
    import shutil
    import os

    # 指定要删除的文件夹路径
    dir_path = r"F:\company-project-2023\yolov5-6.2-mod\runs\train\exp3"

    # 使用shutil.rmtree()删除文件夹及其内容
    try:
        shutil.rmtree(dir_path)
        print(f"文件夹 {dir_path} 及其内容已被成功删除")
    except OSError as e:
        print(f"删除文件夹时发生错误: {dir_path} : {e.strerror}")
import logging
#
#
# def set_logging(name=None, verbose=True, write_file=True):
#     # Sets level and returns logger
#     level = logging.INFO if verbose else logging.ERROR
#     log = logging.getLogger(name)
#     log.setLevel(level)
#     handler = logging.StreamHandler()
#     handler.setFormatter(logging.Formatter("%(message)s"))
#     handler.setLevel(level)
#     log.addHandler(handler)
#     # -----------------------------------------------------
#     if write_file:
#         file_handler = logging.FileHandler("train_log.log", encoding="utf-8")
#         log.setLevel(level)
#         file_handler.setFormatter(logging.Formatter("%(message)s"))
#         file_handler.setLevel(level)
#         log.addHandler(file_handler)
#     # -----------------------------------------------------
#
#
# set_logging()
# LOGGER = logging.getLogger("yolov5")
#
# LOGGER.info("1234tt")
# from utils.yamlconfig import HypScratch
#
# train_params = {
#     "lr0": 0.01,  # initial learning rate (SGD=1E-2, Adam=1E-3)
#     "lrf": 0.01,  # final OneCycleLR learning rate (lr0 * lrf)
#     "momentum": 1023,  # SGD momentum/Adam beta1
#     "weight_decay": 0.0005,  # optimizer weight decay 5e-4
#     "warmup_epochs": 3.0,  # warmup epochs (fractions ok)
#     "warmup_momentum": 0.8,  # warmup initial momentum
#     "warmup_bias_lr": 0.1,  # warmup initial bias lr
#     "box": 0.05,  # box loss gain
#     "cls": 0.5,  # cls loss gain
#     "cls_pw": 1.0,  # cls BCELoss positive_weight
#     "obj": 1.0,  # obj loss gain (scale with pixels)
#     "obj_pw": 1.0,  # obj BCELoss positive_weight
#     "iou_t": 0.20,  # IoU training threshold
#     "anchor_t": 4.0,  # anchor-multiple threshold
#     # anchors: 3  # anchors per output layer (0 to ignore)
#     "fl_gamma": 0.0,  # focal loss gamma (efficientDet default gamma=1.5)
#     "hsv_h": 0.015,  # image HSV-Hue augmentation (fraction)
#     "hsv_s": 0.7,  # image HSV-Saturation augmentation (fraction)
#     "hsv_v": 0.4,  # image HSV-Value augmentation (fraction)
#     "degrees": 0.0,  # image rotation (+/- deg)
#     "translate": 0.1,  # image translation (+/- fraction)
#     "scale": 0.5,  # image scale (+/- gain)
#     "shear": 0.0,  # image shear (+/- deg)
#     "perspective": 0.0,  # image perspective (+/- fraction), range 0-0.001
#     "flipud": 0.0,  # image flip up-down (probability)
#     "fliplr": 0.5,  # image flip left-right (probability)
#     "mosaic": 1.0,  # image mosaic (probability)
#     "mixup": 0.0,  # image mixup (probability)
#     "copy_paste": 0.0,  # segment copy-paste (probability)
# }
# hyp = HypScratch(**train_params)
# print(hyp)
#
# # coco128.nc = train_params.get("nc")
# # b = None
# # print(train_params.get("mixup"))
# # for k, v in train_params.items():
# #     if train_params.get(k) is not None:
# #         b = train_params.get(k)
# #         print(k, b)
