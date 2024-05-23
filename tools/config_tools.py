"""
-*- coding: utf-8 -*-
@Author  : EricZ
@Time    : 2022/3/3 17:02
@Software: PyCharm
@File    : config_tools.py
"""
import glob
import cv2
#from ppcls.utils import logger
from loguru import logger
import os
#import zipfile38 as zipfile
import zipfile
import shutil
import os.path as osp
import random
import chardet

sep = os.sep


def decompress_mix_file(dataset_path, network_file_path, pretrained=False):
    """
    将其汇总到一个文件夹：local_file_path ---images
                                      ---train_list.txt
                                      ---val_list.txt
                                      ---label_list.txt
    :param dataset_path: output/train/{train_task_id}/data_sets
    :param network_file_path: output/train/{train_task_id}/{network}
    :param pretrained: 是否需要预训练
    :return:
    """
    # 解压所有下载好的zip文件
    zip_decompress(dataset_path)
    # 整理文件
    eval_batch_size, class_num = mix_file(
        dataset_path, network_file_path, pretrained=pretrained)

    return eval_batch_size, class_num


def is_contain_chinese(check_str):
    """
    判断字符串中是否包含中文
    :param check_str: {str} 需要检测的字符串
    :return: {bool} 包含返回True， 不包含返回False
    """
    for ch in check_str:
        if u'\u4e00' <= ch <= u'\u9fff':
            return True
    return False


def support_gbk(zip_file: zipfile.ZipFile):
    """
    用于支持解码中文路径，避免乱码
    """
    name_to_info = zip_file.NameToInfo
    # copy map first
    img_end = ['jpg', 'png', 'jpeg', 'JPEG', 'JPG', 'bmp']
    label_end = ['txt', 'json', 'xml']
    for name, info in name_to_info.copy().items():
        name_list = name.replace('\\', '/').split('/')
        real_name = ''
        for n in name_list:
            try:
                encoding = chardet.detect(n.encode("cp437")).get("encoding")
            except UnicodeEncodeError:
                real_name = "/" + n
            else:
                if encoding:
                    real_name += "/" + n.encode("cp437").decode(encoding)
                else:
                    real_name += "/" + n

        if real_name != name:
            info.filename = real_name
            del name_to_info[name]
            name_to_info[real_name] = info
    return zip_file


def zip_decompress(dataset_path):
    logger.info("开始解压数据集")
    zip_list = osp.join(dataset_path, '*/*.zip')
    file_list = glob.glob(zip_list)
    if not file_list:
        logger.error("找不到zip压缩包")
    for file_name in file_list:
        un_zip(file_name, dataset_path)
    if osp.isdir(osp.join(dataset_path, 'tmp/__MACOSX')):
        shutil.rmtree(osp.join(dataset_path, 'tmp/__MACOSX'))
    wrong_file1 = glob.glob(osp.join(dataset_path, 'tmp/*/.DS_Store'))
    wrong_file2 = glob.glob(osp.join(dataset_path, 'tmp/*/*/.DS_Store'))
    for w in (wrong_file1 + wrong_file2):
        os.remove(w)


def un_zip(file_name, dataset_path):
    """unzip zip file"""
    # zip_file = zipfile.ZipFile(file_name)
    with support_gbk(zipfile.ZipFile(file_name)) as zip_file:
        zip_file.extractall(osp.join(dataset_path, 'tmp'))


def mix_file(dataset_path, network_file_path, pretrained=False):
    logger.info("开始整理合并图片，做成数据集")
    # 合并标签信息到 label_list.txt; train_list.txt; val_list.txt
    root_dir = ''
    img_info = os.walk(dataset_path + '/tmp')
    for root, dirs, files in img_info:
        if files:
            root_dir = '/'.join(root.replace('\\', '/').split('/')[:-1])
    img_paths = glob.glob(osp.join(root_dir, '*/*'))
    for i, img_path in enumerate(img_paths):
        suffix = img_path.split('.')[-1]
        img_path_wo_suffix = '/'.join(
            img_path.replace('\\', '/').split('/')[:-1])
        new_img_path = img_path_wo_suffix + f'/{i}.{suffix}'
        # img_path_wo_suffix = img_path[:-(len(suffix) + 1)]
        # new_img_path = img_path_wo_suffix + f'_{i}.{suffix}'
        new_img_path = new_img_path.replace(' ', '_')
        new_img_dir = '/'.join(new_img_path.replace('\\', '/').split('/')[:-1])
        os.makedirs(new_img_dir, exist_ok=True)
        os.rename(img_path, new_img_path)
    img_paths = glob.glob(osp.join(root_dir, '*/*'))

    os.makedirs(osp.join(dataset_path, 'images'), exist_ok=True)
    cls_list = []  # 存放标签名称
    tv_list = []  # 存放 '图像路径 cls_num'
    for i in img_paths:
        cls = osp.basename(osp.dirname(i)).encode("gbk").decode("utf-8")
        img = cv2.imread(i)
        if img is not None:
            if cls not in cls_list:
                cls_list.append(cls)
            suffix = i.split('.')[-1]
            new_path = i[:-len(suffix)] + 'jpg'
            img_name = new_path.replace('\\', '/').split('/')[-1]
            new_path = osp.join(dataset_path, 'images', img_name)
            cv2.imwrite(new_path, img)
            assert osp.isfile(new_path), logger.error(
                f"找不到{new_path}，请检查路径是否正确")
            if pretrained:
                with open(
                        osp.join(network_file_path,
                                 'pretrain/result/label_list.txt')) as f:
                    label_info = f.readlines()
                label_dict = {
                    l.split(' ')[-1].replace('\n', ''): int(l.split(' ')[0])
                    for l in label_info
                }
                cls_list = [
                    l.split(' ')[-1].replace('\n', '') for l in label_info
                ]
                cls_num = label_dict.get(cls, -1)
                assert cls_num != -1, logger.error(f'找不到类别：{cls}，请检查数据集')
            else:
                cls_num = cls_list.index(cls)

            tv_list.append(f'images/{img_name} {cls_num}\n')
            if suffix != 'jpg':
                os.remove(i)
        else:
            logger.error(f"{i}不是图片")

    tmp_tv_list = []  # 临时存放多个列表， 每个列表代表一类，便于后面按比例划分
    for j in range(len(cls_list)):
        tmp_list = []
        for k in tv_list:
            cls_num = int(k.split(' ')[-1][0])
            if cls_num == j:
                tmp_list.append(k)
        tmp_tv_list.append(tmp_list)

    train_list, val_list, label_list = [], [], []
    for t in tmp_tv_list:
        random.shuffle(t)
        train_list += t[:int(len(t) * 0.8)]
        val_list += t[int(len(t) * 0.8):]

    for i, c in enumerate(cls_list):
        label_list.append(f'{i} {c}\n')
    with open(
            osp.join(dataset_path, 'train_list.txt'), mode='w',
            encoding='gbk') as f:
        f.writelines(train_list)

    with open(
            osp.join(dataset_path, 'val_list.txt'), mode='w',
            encoding='gbk') as f:
        f.writelines(val_list)

    with open(osp.join(dataset_path, 'label_list.txt'), mode='w') as f:
        f.writelines(label_list)
    eval_batch_size = len(val_list)
    class_num = len(label_list)
    assert (eval_batch_size > 0 and isinstance(eval_batch_size, int)
            ), logger.error(f"验证的batch size不能是{eval_batch_size}，请核对数据集")
    assert (class_num > 1 and isinstance(
        class_num, int)), logger.error(f"种类数不能是{class_num}，请核对数据集")
    return eval_batch_size, class_num


def compress(dataset_path, network_file_path, result_file_path):
    """
    把 best_model.pdparams, label_list.txt, config.yaml 压缩到 output/train/{train_task_id}/{network}/result.zip

    Args:
        dataset_path: output/train/{train_task_id}/data_sets
        network_file_path: output/train/{train_task_id}/{network}
        network: MobileNetV1
        result_file_path: output/train/{train_task_id}/{network}/result.zip
    """
    logger.info("开始压缩训练结果文件")
    result_dir = osp.join(network_file_path, 'result')
    os.makedirs(result_dir, exist_ok=True)
    label_path = osp.join(dataset_path, 'label_list.txt')
    assert osp.isfile(label_path), logger.error(f"{label_path}不存在")
    params_path = osp.join(network_file_path, 'checkpoint',
                           'best_model.pdparams')
    assert osp.isfile(params_path), logger.error(f"{params_path}不存在")
    shutil.copy(label_path, result_dir)
    shutil.copy(params_path, result_dir)
    shutil.copy(osp.join("media", "Dockerfile.cpu"), result_dir)
    shutil.copy(osp.join("media", "Dockerfile.gpu"), result_dir)
    shutil.copy(osp.join("media", "使用说明.txt"), result_dir)
    z = zipfile.ZipFile(result_file_path, 'w', zipfile.ZIP_DEFLATED)
    for dirpath, dirnames, filenames in os.walk(result_dir):
        fpath = dirpath.replace(result_dir, '')
        fpath = fpath and fpath + os.sep or ''
        for filename in filenames:
            z.write(os.path.join(dirpath, filename), fpath + filename)
    z.close()


def train_result_decompress(file_dir, file_name):
    """
    解压缩预训练文件
    Args:
    file_dir: 结果文件压缩包存放路径。eg. './output/task_id'
    file_name: 压缩包的名称 result.zip
    """
    zip_file = zipfile.ZipFile(osp.join(file_dir, file_name))
    result_name = file_name.split('.')[0]
    for names in zip_file.namelist():
        zip_file.extract(names, osp.join(file_dir, result_name))
    zip_file.close()

