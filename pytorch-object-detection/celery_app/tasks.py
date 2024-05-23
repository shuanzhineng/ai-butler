import os
import sys
from ai_butler_sdk.celery_app import celery_app
from ai_butler_sdk.train import TrainBase

from ai_butler_sdk.utils import xml_to_txt
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)
from trainer import Trainer


class MyTrain(TrainBase):
    def pre_train(self):
        self.txt_dataset_dir = os.path.join(self.root_path, "new_datasets")
        os.makedirs(self.txt_dataset_dir, exist_ok=True)
        xml_to_txt(self.data_sets_local_path, self.txt_dataset_dir)

        self.coco_dir = os.path.join(self.root_path, f"coco_{self.train_task_id}")
        os.makedirs(self.coco_dir, exist_ok=True)

    def train(self):
        trainer = Trainer(
            task_id=self.train_task_id,
            raw_dataset=self.txt_dataset_dir,
            coco_dir=self.coco_dir,
            output_dir=self.root_path,
            train_params=self.train_params,
            model_name=self.network,
            second_train=bool(self.pretrain_model_weight_download_url),  # 是否有
            train_result_zip=self.result_local_path,  # result.zip
            train_log=self.log_local_path,  # train.log
        )

        trainer.train()
        trainer.delete()


@celery_app.task
def pytorch_object_detection_train(
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
