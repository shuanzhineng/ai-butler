import os
import zipfile
import shutil
from utils.general import LOGGER


def zip_folder(folder_path: str, output_filename: str):
    """
    压缩文件夹到zip文件
    :param folder_path: 文件夹路径
    :param output_filename: 输出zip文件名（不包含.zip后缀）
    """
    # 创建ZipFile对象，使用'w'模式表示写入
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 遍历文件夹中的所有文件和子文件夹
        for root, dirs, files in os.walk(folder_path):
            # 遍历当前目录下的所有文件
            for file in files:
                # 构造文件的完整路径
                file_path = os.path.join(root, file)
                # 构造文件在zip包中的相对路径
                arcname = os.path.relpath(file_path, folder_path)
                # 将文件添加到zip包中
                zipf.write(file_path, arcname)
    LOGGER.info(f"zip finished, output to {output_filename}")


def move_zipfile(zip_filepath: str, destination_dir: str):
    """
    移动zip文件到指定目录
    :param zip_filepath: zip文件路径
    :param destination_dir: 目标目录路径
    """
    # 如果目标目录不存在，则创建它
    os.makedirs(destination_dir, exist_ok=True)

    # 构造目标路径下的zip文件名
    dest_zip_filepath = os.path.join(destination_dir, os.path.basename(zip_filepath))
    # 移动zip文件
    shutil.move(zip_filepath, dest_zip_filepath)
    LOGGER.info(f"move to {dest_zip_filepath}")
