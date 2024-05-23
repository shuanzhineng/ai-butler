# -*- coding = utf-8 -*-
import numpy as np
import shutil
import os
from sklearn.model_selection import train_test_split
from tqdm import tqdm
import xml.etree.cElementTree as ET
from PIL import Image

np.random.seed(20230712)


# ----------------------------------------------------------------------------------------------------------------------
# yolo将训练数据分为train和val  此时标签是xml文件，对xml划分成yolo的格式, 将xml转换成txt
# ----------------------------------------------------------------------------------------------------------------------
def create_dir(target_dir_list):
    for target_dir in target_dir_list:
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)


def delete_directory(path):
    try:
        shutil.rmtree(path)
        print(f"目录 {path} 已被成功删除")
    except OSError as e:
        print(f"删除目录 {path} 时出错: {e.strerror}")


def gen_class_names(xmls_dir: str):
    class_names = []
    for xml_file in os.listdir(xmls_dir):
        xml_path = os.path.join(xmls_dir, xml_file)
        tree = ET.parse(xml_path)
        # 对于每一个目标都获得它的宽高
        for obj in tree.iter('object'):
            cls_name = obj.findtext('name')
            class_names.append(cls_name)
    class_names = list(set(class_names))
    with open("labellist.txt", "w", encoding="utf-8") as f:
        for cls_name in class_names:
            f.write(f"{cls_name}\n")
            f.flush()
    return class_names


def split_dataset_train_val(
        img_dir: str = '/data/yolo_eyes_COCO_format/images',
        xml_dir: str = '/data/yolo_eyes_COCO_format/xmls',
        coco_dir: str = '/data/yolo_eyes_COCO_format/coco_dir',
        img_type: str = "jpg",
        is_move: bool = False,
        train_ratio: float = 0.8
):
    assert train_ratio >= 0.1, "train_ratio must be more than 0.3"
    assert os.path.exists(img_dir), "img_dir not exists"
    assert os.path.exists(xml_dir), "xml_dir not exists"
    img_list_dict = dict()
    # 2. 数据收集
    img_list = []
    not_exists_file = []
    for i in os.listdir(img_dir):
        name, img_type = os.path.splitext(i)
        img_list_dict[name] = img_type
        img_list.append(name)
    img_list = np.array(img_list)
    print(f"img_list length: {len(img_list)}")
    print(f"img_list_dict: {img_list_dict}")

    # 3. 数据划分预处理
    train_list, val_list = train_test_split(img_list, train_size=train_ratio, test_size=1 - train_ratio)
    print(f"tra_list_length: {len(train_list)}")
    print(f"val_list_length: {len(val_list)}")

    # 4. 执行数据划分
    train_img_dir = os.path.join(coco_dir, "images", "train")
    train_label_dir = os.path.join(coco_dir, "labels", "train_xml")
    train_label_final_dir = os.path.join(coco_dir, "labels", "train")
    val_img_dir = os.path.join(coco_dir, "images", "val")
    val_label_dir = os.path.join(coco_dir, "labels", "val_xml")
    val_label_final_dir = os.path.join(coco_dir, "labels", "val")
    create_dir([train_img_dir, train_label_dir, train_label_final_dir, val_img_dir, val_label_dir, val_label_final_dir])

    def remove_copy_train_val_list(train_val_list: list, train_val_img_dir: str, train_val_label_dir: str):
        for i in tqdm(train_val_list, desc="dataset is splitting"):
            img_name, xml_name = str(i) + f"{img_list_dict[i]}", str(i) + ".xml"
            img_path, xml_path = os.path.join(img_dir, img_name), os.path.join(xml_dir, xml_name)
            if not os.path.exists(img_path):
                not_exists_file.append(img_path)
                continue
            if not os.path.exists(xml_path):
                not_exists_file.append(img_path)
                continue
            if not is_move:
                shutil.copy(img_path, train_val_img_dir)
                shutil.copy(xml_path, train_val_label_dir)
            else:
                shutil.move(img_path, train_val_img_dir)
                shutil.move(xml_path, train_val_label_dir)

    remove_copy_train_val_list(train_list, train_img_dir, train_label_dir)
    remove_copy_train_val_list(val_list, val_img_dir, val_label_dir)

    print(f"not exist file list: {not_exists_file}")
    print("finished!")


def xml_convert_txt(
        class_names: tuple = ("close_eyes", "close_mouth", "open_eyes", "open_mouth"),
        coco_dir: str = "/data/yolo_eyes_COCO_format/coco_dir",
):
    assert len(class_names) > 0, "class_names must be not empty"
    class_names_dict = {name: i for i, name in enumerate(class_names)}
    print(class_names_dict)
    img_type = "jpg" or "png" or "jpeg" or "webp"
    convert_error_list = []

    img_dir_train_val = os.path.join(coco_dir, "images")
    # 保留图片的文件名和后缀
    img_type_dict = dict()
    for tra_val in os.listdir(img_dir_train_val):
        tra_val_dir = os.path.join(img_dir_train_val, tra_val)
        for i in os.listdir(tra_val_dir):
            name, img_type = os.path.splitext(i)
            img_type_dict[name] = img_type

    def load_data(full_file, file, xml_pre_name, image_dir, save_txt):
        with open(f'{save_txt}/{file[:-3]}txt', 'w') as f:
            tree = ET.parse(full_file)
            height = int(tree.findtext('./size/height'))
            width = int(tree.findtext('./size/width'))
            if (width <= 0) or (height <= 0):
                width, height = Image.open(
                    os.path.join(image_dir, str(xml_pre_name) + f"{img_type_dict[xml_pre_name]}")).size
            # 对于每一个目标都获得它的宽高
            for obj in tree.iter('object'):
                cls_name = obj.findtext('name')
                cls = int(class_names_dict[cls_name])
                xmin = float(obj.findtext('bndbox/xmin'))
                ymin = float(obj.findtext('bndbox/ymin'))
                xmax = float(obj.findtext('bndbox/xmax'))
                ymax = float(obj.findtext('bndbox/ymax'))
                w = xmax - xmin
                h = ymax - ymin
                cx = xmin + w / 2
                cy = ymin + h / 2
                off_cx, off_cy = cx / width, cy / height
                off_w, off_h = w / width, h / height
                f.write("{} {} {} {} {} \n".format(cls, off_cx, off_cy, off_w, off_h))
            f.flush()

    # 载入数据集，可以使用VOC的xml
    for data_type in ["train", "val"]:
        xml_path = os.path.join(coco_dir, "labels", f'{data_type}_xml')
        txt_path = os.path.join(coco_dir, "labels", str(data_type))
        img_dir = os.path.join(coco_dir, "images", str(data_type))
        for xml_file in tqdm(os.listdir(xml_path), desc="xml convert txt..."):
            xml_pre_name = os.path.splitext(xml_file)[0]  # 图片的格式[.jpg, .png]
            xml_full_name = os.path.join(xml_path, xml_file)
            try:
                load_data(xml_full_name, xml_file, xml_pre_name, img_dir, txt_path)
            except:
                convert_error_list.append(xml_file)

        print(f"{data_type} finished!")
    print(f"convert_error_list: {convert_error_list}")


# ----------------------------------------------------------------------------------------------------------------------
#                                              ENDING.
# ----------------------------------------------------------------------------------------------------------------------
if __name__ == '__main__':
    # img_dir = '/data/home/lizhiyong/dataset/huoti_b_z_eyes/yolo_eyes_COCO_format/images'
    xml_dir = '/data/home/lizhiyong/dataset/huoti_b_z_eyes/yolo_eyes_COCO_format/xmls'
    # coco_dir = '/data/home/lizhiyong/dataset/huoti_b_z_eyes/yolo_eyes_COCO_format/coco_dir'
    # img_type = "jpg"
    # is_move = False
    # train_ratio = 0.8
    # class_names = ("close_eyes", "close_mouth", "open_eyes", "open_mouth")
    # split_dataset_train_val(img_dir, xml_dir, coco_dir, img_type, is_move, train_ratio)
    # xml_convert_txt(class_names, coco_dir)
    class_names = gen_class_names(r"E:\Dataset\闭眼检测\closeye_dataset\xmls")
    print(class_names)
