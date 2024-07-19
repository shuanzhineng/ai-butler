# 数安智能AI生产管理平台 

🚀 **数安智能** 致力于构建下一代AI解决方案，为学术界、产业界和个人开发者提供强大的数据处理、算法研发、模型训练、算力调度和推理应用平台。我们的平台集合了一站式算法开发环境、高性能分布式学习框架、丰富的算法模型库、智能化的数据可视化分析工具和模型优化套件，致力于简化AI研发流程，加速创新步伐。 

## 📈 平台优势
- **全方位AI生态**：覆盖从数据到应用的完整AI生命周期。 
- **灵活的算力管理**：支持CPU和GPU混合计算，优化资源利用。
- **多框架兼容性**：兼容主流深度学习框架，如PyTorch、PaddlePaddle等。 
- **高扩展性**：模块化设计，便于定制和集成。 

![AI生产管理平台功能架构](static/AI1.jpg) 

## 🌐 页面预览
![页面预览](static/img.png)

## 🗂 目录结构 
```text 
├── aibutler-backend # 后端API服务 
├── aibutler-frontend # 前端UI界面 
├── deploy-predict # 模型部署与推理服务 
├── onnx-predict # ONNX格式模型推理 
├── paddle-image-classify # PaddlePaddle图像分类任务 
├── pytorch-object-detection# PyTorch目标检测任务 
```

## 🛠️ 技术栈 

- **前端**: React.js
- **后端**: FastAPI
- **数据库**: MySQL 
- **对象存储**: Minio 
- **缓存**: Redis 
- **部署**: Docker + Docker Compose 

![AI生产管理平台技术栈](static/AI2.jpg) 

## 🎯 功能亮点 
- **数据管理**: 便捷上传与处理数据集，支持数据标注及数据存储。 
- **模型训练**: 高效训练模型，支持参数调优与迭代。 
- **模型部署**: 快速部署模型至生产环境，实现在线推理。 

## 💻 GPU服务器单机部署指南 

### 1.环境准备
- 确保已安装Docker和Docker Compose。 
- 克隆或下载本仓库代码。
### 配置修改 

#### 2.后端服务 
```bash 
cd aibutler-backend 
vi envionment.py 
# 设置ENV_FLAG为local、dev或prod 
cp .envs/.dev.example .envs/.dev 
vi .envs/.dev # 更新MINIO_SERVER_HOST为你服务器的IP 
```
#### 应用部署服务 
```bash
 cd deploy-predict 
 cp .envs.example .envs 
 ```
#### 图像分类与物体检测服务 
```bash
cd paddle-image-classify
cp .envs.example .envs 
cd ../pytorch-object-detection 
cp .envs.example .envs 
```

### 3.前端资源下载 
```bash
cd aibutler-frontend/apps/frontend
wget https://gitee.com/shuanzhineng/aibutler-frontend/releases/download/v1.0.0/dist.zip 
unzip dist.zip 
``` 
### 4.构建与启动 `
```bash
docker-compose build 
docker-compose up -d 
``` 

### 5.项目初始化 

```bash
# 进入后端容器
docker exec -it ai_butler_fastapi /bin/bash 
# 初始化菜单 
poetry run python manage.py init-menu 
# 创建超级管理员账户 poetry run python manage.py create-superuser admin 
``` 