# -*- coding:UTF-8 -*-
import os.path
import shutil
from train_company import main
from config import opt, TrainParams, MODEL_NAME_TRAIN_DICT
from utils.general import LOGGER, increment_path, set_logging
from utils.yamlconfig import HypScratch, COCO128
from utils.zipfolder import zip_folder
from utils.dataset_split import dataset_split_tra_val
from loguru import logger
import yaml
import pandas as pd
from pathlib import Path
from exporter import run_onnx_exporter


class Trainer:

    def __init__(
            self,
            task_id: str,
            raw_dataset: str,
            coco_dir: str,
            output_dir: str,
            train_params: dict,
            model_name: str = "yolov5n",  # 可以从TrainBase中获取
            second_train: bool = False,
            train_result_zip: str = "train_result.zip",
            train_log: str = "train.log"

    ):

        # opt.train_log_path = os.path.join(opt.train_log_dir, train_log)
        opt.train_log_path = train_log
        set_logging(train_log_path=train_log)

        self.task_id = task_id
        self.raw_dataset = raw_dataset
        self.coco_dir = coco_dir
        self.output_dir = output_dir
        self.model_name = model_name
        self.second_train = second_train
        self.output_filename = train_result_zip

        self.class_names = None
        self.coco128_name = None
        self.coco128 = None

        

        # 1训练参数和超参
        self.imgsz = train_params.get("imgsz")
        self.train_hyp_params = train_params.get("train_hyp_params")
        train_params.pop("train_hyp_params")
        # 1.1配置训练超参数
        if len(self.train_hyp_params.keys()) != 0:  # 高阶用法，用户自己选用超参数
            self.hyp_scratch = HypScratch(**self.train_hyp_params)
        else:
            # 根据model_name 选用默认的超参
            self.hyp_scratch = None
        self.train_ratio = train_params.get("train_data_ratio")
        # print(self.train_ratio)
        train_params.pop("train_data_ratio")
        # 数据集划分
        self.prepare()
        # 1.2配置训练参数
        self.train_params = TrainParams(**train_params)


        # onnx 导出
        self.exporter = None

    def prepare(self):
        dataset_split_tra_val(
            dataset_raw_dir=self.raw_dataset,
            coco_dir=self.coco_dir,
            train_ratio=self.train_ratio)
        # 根据参数生成coco128.yaml
        self.coco128 = COCO128()
        self.class_names = self.get_class_names()

    def get_class_names(self):
        df = pd.read_csv(os.path.join(self.raw_dataset, "classes.txt"), header=None)
        class_names = df.loc[:, 0].tolist()
        return class_names

    @staticmethod
    def read_yaml(yaml_file: str = "data/coco128.yaml"):
        with open(yaml_file, encoding="ascii", errors="ignore") as f:
            yaml_result = yaml.safe_load(f)
        return yaml_result

    def write_yaml(self, yaml_file: str = "data/coco128_2.yaml"):
        with open(yaml_file, "w") as f:
            yaml.safe_dump(self.coco128.dict(), f, default_flow_style=False)

    @staticmethod
    def copy_file(file_full_path: str, destination):
        # 压缩训练后的文件到指定的目录
        os.makedirs(destination, exist_ok=True)
        shutil.copy(file_full_path, destination)

    @staticmethod
    def remove_file(file_full_path):
        try:
            os.remove(file_full_path)
            LOGGER.info(f"文件 {file_full_path} 已被成功删除")
        except OSError as e:
            LOGGER.error(f"删除文件时发生错误: {file_full_path} : {e.strerror}")

    @staticmethod
    def rmtree_dir(dir_path):
        # 使用shutil.rmtree()删除文件夹及其内容

        try:
            shutil.rmtree(dir_path)
            LOGGER.info(f"文件夹 {dir_path} 及其内容已被成功删除")
        except OSError as e:
            LOGGER.error(f"删除文件夹时发生错误: {dir_path} : {e.strerror}")

    def prepare_coco128(self):
        self.coco128.train =  "images/train"
        logger.info(self.coco128.train)
        self.coco128.val =  "images/val"
        self.coco128.nc = len(self.get_class_names())
        self.coco128.path = self.coco_dir
        self.coco128.names = self.class_names
        # 生成coco128.yaml文件
        self.coco128_name = os.path.join(self.coco_dir, f"coco128_{self.task_id}.yaml")
        self.write_yaml(yaml_file=self.coco128_name)
        LOGGER.info(f"prepare_coco128 finished.")
        return self.coco128_name

    def prepare_train_params(self):
        # 解析训练参数,写出yaml，并且给训练赋值
        # todo 生成图片名字
        # 1. 假设只输入模型名称,不用生成yaml
        model_get = MODEL_NAME_TRAIN_DICT.get(self.model_name)
        self.train_params.weights = model_get.get("weights")
        self.train_params.cfg = model_get.get("cfg")
        self.train_params.hyp = model_get.get("hyp")
        self.train_params.save_dir = increment_path(
            Path(os.path.join(opt.root, self.train_params.project)) / self.train_params.name,
            exist_ok=False,
            mkdir=True
        )
        # todo 根据用户输入，生成超参数, 并返回文件全路径

        # 生成coco128.yaml
        self.prepare_coco128()
        self.train_params.data = self.coco128_name
        LOGGER.info(f"prepare_train_params finished.")

    def export_onnx(self, log_dir):
        weight_path = os.path.join(log_dir, "weights", "best.pt")
        onnx_path = run_onnx_exporter(
            weights=weight_path,  # weights path
            imgsz=(self.imgsz, self.imgsz),  # image (height, width)
            batch_size=1,  # batch size
            device='cpu',  # cuda device, i.e. 0 or 0,1,2,3 or cpu
            is_onnx_export=True,
            half=False,  # FP16 half-precision export
            inplace=False,  # set YOLOv5 Detect() inplace=True
            train=False,  # model.train() mode
            optimize=False,  # TorchScript: optimize for mobile
            dynamic=False,  # ONNX/TF/TensorRT: dynamic axes
            simplify=False,  # ONNX: simplify model
            opset=12,  # ONNX: opset version
        )
        return onnx_path

    def train(self):
        # 生成coco128.yaml
        self.prepare_coco128()
        # todo 生成超参数

        # 生成训练参数
        self.prepare_train_params()

        # 开启训练
        main(self.train_params)
        log_dir = self.train_params.save_dir
        # 压缩日志路径
        # 把trian_log.log移动到runs/train/expx中，然后压缩runs/train/expx
        LOGGER.info(f"logdir: {log_dir}")
        # todo 导出onnx
        self.export_onnx(log_dir)
        # self.copy_file(onnx_path, os.path.join(opt.root, log_dir, "weights"))
        
        self.copy_file(opt.train_log_path, os.path.join(opt.root, log_dir))
        self.copy_file(self.train_params.data, os.path.join(opt.root, log_dir))
        # self.copy_file(os.path.join(opt.root, "label_list.txt"), os.path.join(opt.root, log_dir))
        with open(os.path.join(opt.root, log_dir, "classes.txt"), "w", encoding="utf-8") as f:
            for cls in self.class_names:
                f.write(f"{cls}\n")
                f.flush()
        output_path = self.output_filename
        zip_folder(log_dir, output_filename=self.output_filename)

        LOGGER.info(f"zip_folder saved to {output_path}")

        return log_dir

    def delete(self):
        # self.rmtree_dir(opt.train_log_dir)
        self.remove_file(self.train_params.data)
        self.rmtree_dir(self.train_params.save_dir)
        logger.info("ENDING........................................................................")


if __name__ == '__main__':
    pass
