import os
import shutil
import sys
from ai_butler_sdk.celery_app import celery_app
from ai_butler_sdk.train import TrainBase
import zipfile

from loguru import logger
import httpx
import time
from ai_butler_sdk.utils import unzip_file


project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)


class MyTrain(TrainBase):

    def zip_files(self, folder_path, file_paths, zip_name):
        # 创建一个新的 zip 文件
        with zipfile.ZipFile(zip_name, 'w') as zipf:
            # 将指定的文件添加到 zip 压缩包中
            for file in file_paths:
                zipf.write(file, os.path.basename(file))  # 将文件添加到压缩包中，并保留原始文件名

        logger.info(f'成功创建压缩包 {zip_name}')

    def download_data_sets(self):
        """下载数据集到本地目录"""
        logger.info("---------------------------------开始下载数据集---------------------------------")
        for data_set_url in self.data_set_urls:
            timestamp = str(int(time.time() * 1000))
            with httpx.stream("GET", url=data_set_url) as resp:
                # 打开本地文件以二进制写模式
                target_path = os.path.join(self.data_sets_local_path, f"{timestamp}.zip")
                with open(target_path, "wb") as f:
                    for chunk in resp.iter_bytes():
                        f.write(chunk)
                        # 可选地在这里调用flush来确保数据及时写入磁盘
                        f.flush()
                # 解压文件
                unzip_file(target_path, self.data_sets_local_path + '/tmp')
            os.remove(target_path)  # 删除压缩包
        logger.info("---------------------------------数据集下载完成---------------------------------")

    def download_base_task(self):
        """现在追加训练的基础任务结果文件"""
        if download_url := self.pretrain_model_weight_download_url:
            logger.info("---------------------------------开始下载预训练文件---------------------------------")
            timestamp = str(int(time.time() * 1000))
            with httpx.stream("GET", url=download_url) as resp:
                # 打开本地文件以二进制写模式
                target_path = os.path.join(self.pretrain_local_path, f"{timestamp}.zip")
                with open(target_path, "wb") as f:
                    for chunk in resp.iter_bytes():
                        f.write(chunk)
                        # 可选地在这里调用flush来确保数据及时写入磁盘
                        f.flush()
                # 解压文件
                unzip_file(target_path, self.pretrain_local_path)
            os.remove(target_path)  # 删除压缩包
            logger.info("---------------------------------预训练文件下载完成---------------------------------")

    def pre_train(self):
        pass

    def train(self):
        from ppcls.utils import config
        from ppcls.engine.engine import Engine
        from tools.config_tools import mix_file

        # 数据集转换
        dataset_path = self.data_sets_local_path
        network_file_path = self.pretrain_local_path
        eval_batch_size, class_num = mix_file(
            dataset_path, network_file_path, pretrained=False)
        device = self.train_params.get("device", "gpu")
        epochs = self.train_params.get("epochs", 100)
        # train_data_ratio = self.train_params.get("train_data_ratio", 0.8)
        # batch_size = self.train_params.get("epochs", 16)
        # imgsz = self.train_params.get("imgsz", 224)
        # 与pytorch worker保持一致
        if device == "0":
            device = "gpu"

        # 训练  参数修改
        if self.pretrain_model_weight_download_url is None:
            logger.info("新的训练")
            config1 = config.get_config(f"./ppcls/configs/quick_start/{self.network}.yaml", overrides=[
                f"Global.output_dir={self.root_path}/output/",
                f"Global.device={device}",
                f"Arch.class_num={class_num}",
                f"Global.epochs={epochs}",
                f"DataLoader.Train.dataset.image_root={dataset_path}",
                f"DataLoader.Train.dataset.cls_label_path={dataset_path}/train_list.txt",
                f"DataLoader.Eval.dataset.image_root={dataset_path}",
                f"DataLoader.Eval.dataset.cls_label_path={dataset_path}/val_list.txt",
                f"Infer.PostProcess.class_id_map_file={dataset_path}/label_list.txt"],
                                        show=False)
        else:
            logger.info("再次训练")
            config1 = config.get_config(f"./ppcls/configs/quick_start/{self.network}.yaml", overrides=[
                f"Global.output_dir={self.root_path}/output/",
                f"Global.pretrained_model={self.pretrain_local_path}/best_model",
                f"Arch.class_num={class_num}",
                f"Global.epochs={epochs}",
                f"DataLoader.Train.dataset.image_root={dataset_path}",
                f"DataLoader.Train.dataset.cls_label_path={dataset_path}/train_list.txt",
                f"DataLoader.Eval.dataset.image_root={dataset_path}",
                f"DataLoader.Eval.dataset.cls_label_path={dataset_path}/val_list.txt",
                f"Infer.PostProcess.class_id_map_file={dataset_path}/label_list.txt"],
                                        show=False)
        config1.profiler_options = None
        engine = Engine(config1, mode="train")
        engine.train()

        # 转换模型
        config2 = config.get_config(f"./ppcls/configs/quick_start/{self.network}.yaml", overrides=[
            f"Arch.class_num={class_num}",
            f"DataLoader.Train.dataset.image_root={dataset_path}",
            f"DataLoader.Train.dataset.cls_label_path={dataset_path}/train_list.txt",
            f"DataLoader.Eval.dataset.image_root={dataset_path}",
            f"DataLoader.Eval.dataset.cls_label_path={dataset_path}/val_list.txt",
            f"Infer.PostProcess.class_id_map_file={dataset_path}/label_list.txt",
            f"Global.pretrained_model={self.root_path}/output/{self.network}/best_model",
            f"Global.save_inference_dir={self.root_path}/output/inference/"], show=False)
        if config2["Arch"].get("use_sync_bn", False):
            config2["Arch"]["use_sync_bn"] = False
        engine = Engine(config2, mode="export")
        engine.export()
        os.system(
            f"paddle2onnx --model_dir={self.root_path}/output/inference/ --model_filename=inference.pdmodel --params_filename=inference.pdiparams  --save_file={self.root_path}/output/model.onnx --enable_onnx_checker=True")

        # 做压缩包
        # 要打包的文件夹路径
        folder_path = f"{self.root_path}/output/{self.network}/best_model"
        shutil.copy(f"{dataset_path}/label_list.txt", f"{dataset_path}/classes.txt")
        # 要打包的文件列表
        file_paths = [f"{self.root_path}/output/model.onnx",
                      f"{dataset_path}/label_list.txt",
                      f"{dataset_path}/classes.txt",  # 推理接口需要读取该文件
                      f"{self.root_path}/output/{self.network}/best_model.pdopt",
                      f"{self.root_path}/output/{self.network}/best_model.pdparams",
                      f"{self.root_path}/output/{self.network}/best_model.pdstates"]
        # 压缩包的名称
        zip_name = self.result_local_path

        self.zip_files(folder_path, file_paths, zip_name)


@celery_app.task
def paddle_image_classify_train(
    train_task_id: str,
    network: str,
    data_set_urls: list[str],
    train_params: dict,
    log_upload_url: str,
    model_weight_upload_url: str,
    pretrain_model_weight_download_url: str | None = None,
):
    """训练"""
    my_train = MyTrain(
        train_task_id,
        network,
        data_set_urls,
        train_params,
        log_upload_url,
        model_weight_upload_url,
        pretrain_model_weight_download_url,
    )
    my_train()
