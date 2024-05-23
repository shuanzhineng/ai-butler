from ai_butler_sdk.train import TrainBase

import os
import zipfile
import shutil

from loguru import logger
import httpx
import time
from ai_butler_sdk.utils import unzip_file


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

        # 训练  参数修改
        if self.pretrain_model_weight_download_url is None:
            logger.info("新的训练")
            config1 = config.get_config(f"./ppcls/configs/quick_start/{self.network}.yaml", overrides=[
                f"Global.output_dir={self.root_path}/output/",
                f"Arch.class_num={class_num}",
                f"Global.epochs={self.train_params['epochs']}",
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
                f"Global.epochs={self.train_params['epochs']}",
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
        # 要打包的文件列表
        file_paths = [f"{self.root_path}/output/model.onnx",
                      f"{dataset_path}/label_list.txt"]
        # 压缩包的名称
        zip_name = self.result_local_path

        self.zip_files(folder_path, file_paths, zip_name)

        # 日志
        shutil.copy(f"{self.root_path}/output/{self.network}/train.log",
                    f"{self.log_local_path}")


data = {'train_task_id': '32', 'network': 'MobileNetV3_large_x1_0', 'data_set_urls': [
    'http://test-ai.shuanzhineng.com:9000/aibutler/admin/datasets/2024-03/flower.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20240329%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240329T032123Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=626b02a058dc989d275f515cad5bda26b99a55940de5b81b54b7aaa09fdf8848'],
        'pretrain_model_weight_download_url': None,
        'train_params': {'train_data_ratio': 0.8, 'epochs': 5, 'batch_size': 32},
        'model_weight_upload_url': 'http://test-ai.shuanzhineng.com:9000/aibutler/admin/train/2024-03/32/result.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20240329%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240329T032123Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=a402067fc77158935a86a9a0ef02f5ecc076719d7ca6a25bd8ac5d5d04a3e4b3',
        'log_upload_url': 'http://test-ai.shuanzhineng.com:9000/aibutler/admin/train/2024-03/32/train.log?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20240329%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240329T032123Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=cca27d34346a3f5e690466dfb48638682e4c4dd5825fcf56e7711bff7981faee'}

trainer = MyTrain(**data)

trainer()
