FROM python:3.10.6-slim

ENV TZ Asia/Shanghai
ENV PIP_DEFAULT_TIMEOUT 3600
# pip安装源
ENV PIP_INDEX_URL https://pypi.mirrors.ustc.edu.cn/simple

ENV APP_HOME /srv/app

WORKDIR ${APP_HOME}

RUN set -ex \
    # 替换 apt 源
    && sed -i "s/deb.debian.org/mirrors.ustc.edu.cn/g" /etc/apt/sources.list \
    && sed -i "s/security.debian.org/mirrors.ustc.edu.cn/g" /etc/apt/sources.list \
    # 安装相关包
    && apt-get update \
    # && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
        gcc \
        default-libmysqlclient-dev \
        ffmpeg  \
        libsm6  \
        libxext6  \
    # 设置时区
    && ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone \
    # 清理缓存
    && apt-get clean autoclean \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/* $HOME/.cache /var/lib/apt/lists/* /var/lib/{apt,dpkg,cache,log}/

COPY . ${APP_HOME}

RUN set -ex \
    # 设置 pip 源
    && pip config set global.index-url ${PIP_INDEX_URL} \
    # 安装 Python 相关依赖
    && pip install --upgrade pip \
    && pip install --no-cache-dir -U "setuptools < 58.0.0" \
    && pip install --no-cache-dir -U wheel \
    && pip install --upgrade poetry \
    && poetry config installer.max-workers 5 \
    && poetry install
