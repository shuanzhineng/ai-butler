# -*- coding:UTF-8 -*-
import numpy as np
import shutil
import os
from sklearn.model_selection import train_test_split
from typing import List
from utils.general import LOGGER
from tqdm import tqdm
from loguru import logger
np.random.seed(20230712)


def __create_dir(target_dir_list: List[str]) -> None:
    for target_dir in target_dir_list:
        os.makedirs(target_dir, exist_ok=True)


# dataset_dir
#           - images
#               - 1.jpg
#               - 2.jpg
#           - labels
#               - 1.txt
#               - 2.txt

def dataset_split_tra_val(
        dataset_raw_dir=r"C:\Users\chooc\Desktop\测试数据集\new_datasets",  # 需要再TrainBase 的pre_train中创建一个目录
        coco_dir=r"C:\Users\chooc\Desktop\测试数据集\new_datasets/coco_dir",
        train_ratio=0.8
):
    
    # df = pd.read_csv(os.path.join(dataset_raw_dir, "classes.txt"), header=None)
    # class_names = df.loc[:, 0].tolist()
    images_dir = os.path.join(dataset_raw_dir, "images")
    labels_dir = os.path.join(dataset_raw_dir, "labels")
    images_list = os.listdir(images_dir)
    # labels_list = os.listdir(labels_dir)
    tra_img_dir = os.path.join(coco_dir, "images", "train")
    val_img_dir = os.path.join(coco_dir, "images", "val")
    tra_label_dir = os.path.join(coco_dir, "labels", "train")
    val_label_dir = os.path.join(coco_dir, "labels", "val")

    __create_dir([tra_img_dir, val_img_dir, tra_label_dir, val_label_dir])
    train_list, val_list = train_test_split(
        images_list, train_size=train_ratio, test_size=1 - train_ratio)
    LOGGER.info(f"split train_data len(train_list): {len(train_list)}")
    LOGGER.info(f"split val_data     len(val_list): {len(val_list)}")
    for name in tqdm(train_list, desc="split train_data"):
        # if not os.path.isfile(name): continue
        pre_name, suffix = os.path.splitext(name)
        logger.info( os.path.join(labels_dir, pre_name + ".txt"))
        xml_name = os.path.join(labels_dir, pre_name + ".txt")
        
        shutil.copy(os.path.join(images_dir, name), tra_img_dir)
        shutil.copy(xml_name, tra_label_dir)
    for name in tqdm(val_list, desc="split val_data"):
        # if not os.path.isfile(name): continue
        pre_name, suffix = os.path.splitext(name)
        xml_name = os.path.join(labels_dir, pre_name + ".txt")
        shutil.copy(os.path.join(images_dir, name), val_img_dir)
        shutil.copy(xml_name, val_label_dir)
    LOGGER.info(f"dataset_split_tra_val has done. output to {coco_dir}")


# if __name__ == '__main__':
#     dataset_split_tra_val()
