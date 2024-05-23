import { useMemo, useCallback, useContext } from 'react';
import { v4 as uuid4 } from 'uuid';
import type { TableColumnType } from 'antd';
import { Popconfirm, Button, Table } from 'antd';
import _ from 'lodash-es';
import formatter from '@labelu/formatter';
import { FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/lib/upload/interface';
import { FlexLayout } from '@labelu/components-react';

import IconText from '@/components/IconText';
import type { StatusType } from '@/components/Status';
import Status from '@/components/Status';
import { ReactComponent as FileIcon } from '@/assets/svg/file.svg';
import commonController from '@/utils/common';
import NativeUpload from '@/components/NativeUpload';
import { deleteFile } from '@/api/services/task';
import { ReactComponent as UploadBg } from '@/assets/svg/upload-bg.svg';
import type { MediaType } from '@/api/types';
import { FileExtensionText, FileMimeType, MediaFileSize } from '@/constants/mediaType';
import type { TaskInLoader } from '@/loaders/task.loader';
import { useUploadFileMutation } from '@/api/mutations/attachment';

import { TaskCreationContext } from '../../taskCreation.context';
import { Bar, ButtonWrapper, Header, Left, Right, Spot, UploadArea, Wrapper } from './style';

export enum UploadStatus {
  Uploading = 'Uploading',
  Waiting = 'Waiting',
  Success = 'Success',
  Fail = 'Fail',
}

const statusTextMapping = {
  [UploadStatus.Uploading]: '上传中',
  [UploadStatus.Waiting]: '等待上传',
  [UploadStatus.Success]: '上传成功',
  [UploadStatus.Fail]: '上传失败',
};

export interface QueuedFile {
  id?: number;
  url?: string;
  uid: string;
  name: string;
  size: number;
  status: UploadStatus;
  path: string;
  file: File;
}

const isCorrectFiles = (files: File[], type: MediaType) => {
  let result = true;
  console.log(type)
  // if (files.length > 100) {
  //   commonController.notificationErrorMessage({ message: '单次上传文件数量超过上限100个，请分批上传' }, 3);
  //   return;
  // }
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const fileUnit = files[fileIndex];
    const isOverSize = commonController.isOverSize(fileUnit.size, type);
    if (isOverSize) {
      commonController.notificationErrorMessage({ message: `单个文件大小超过${MediaFileSize[type]}MB限制` }, 3);
      result = false;
      break;
    }
    const isCorrectFileType = commonController.isCorrectFileType(fileUnit.name, type);
    console.log(fileUnit.name)
    console.log(type)
    console.log(isCorrectFileType)


    if (!isCorrectFileType) {
      files.splice(fileIndex, 1)
      // commonController.notificationErrorMessage(
      //   { message: `请上传支持的文件类型，类型包括：${FileExtensionText[type]}` },
      //   3,
      // );

      // result = false;
      // break;
    }
  }
  return result;
};

const normalizeFiles = (files: File[]) => {
  return files.map((file) => {
    return {
      uid: uuid4(),
      name: file.name,
      size: file.size,
      status: UploadStatus.Waiting,
      path: file.webkitRelativePath === '' ? './' : file.webkitRelativePath,
      file,
    };
  });
};

const InputData = () => {
  // 上传队列，包括成功和失败的任务
  const {
    uploadFileList: fileQueue,
    setUploadFileList: setFileQueue,
    task = {} as NonNullable<TaskInLoader>,
  } = useContext(TaskCreationContext);
  let restask=task.details
  console.log(restask)
  console.log(task)
  console.log(useContext(TaskCreationContext))

  const uploadMutation = useUploadFileMutation();

  const taskId = restask?.id;

  const amountMapping = useMemo(() => {
    let succeeded = 0;
    let failed = 0;
    let uploading = 0;

    for (const file of fileQueue) {
      switch (file.status) {
        case UploadStatus.Success:
          succeeded++;
          break;
        case UploadStatus.Fail:
          failed++;
          break;
        case UploadStatus.Uploading:
          uploading++;
          break;
        default:
          break;
      }
    }
    return {
      succeeded,
      failed,
      uploading,
    };
  }, [fileQueue]);

  const processUpload = useCallback(
    async (files: QueuedFile[]) => {
      // 开始上传
      setFileQueue((pre) => _.uniqBy([...pre, ...files], 'uid'));
      let succeed = 0;
      let failed = 0;

      for (const file of files) {
        console.log(file)
        const isCorrectFileType = commonController.isCorrectFileType(file.name, 'IMAGE');
        console.log(isCorrectFileType)

        if (isCorrectFileType) {
          const { file: fileBlob } = file;

          if ([UploadStatus.Success, UploadStatus.Uploading].includes(file.status)) {
            continue;
          }
          // console.log(files)
          // console.log(file)
          // console.log(file.path)
          let path = ''
          if (file.path && file.path != './') {
            // console.log(file.path.slice(0, file.path.indexOf('/')))
            path = file.path.slice(0, file.path.indexOf('/'))
          }
          try {
            const res = await uploadMutation.mutateAsync({
              task_id: taskId!,
              file: fileBlob,
              path: path,
            });
            // console.log(res)
            succeed += 1;

            await setFileQueue((pre) =>
              pre.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    ...res,
                    status: UploadStatus.Success,
                  };
                }
                console.log(item)
                return item;
              }),
            );
          } catch (error) {
            failed += 1;
            await setFileQueue((pre) =>
              pre.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    status: UploadStatus.Fail,
                  };
                }
                return item;
              }),
            );
          }
        }


      }

      if (succeed > 0 && failed > 0) {
        commonController.notificationWarnMessage({ message: `${succeed} 个文件上传成功，${failed} 个文件上传失败` }, 3);
      } else if (succeed > 0 && failed === 0) {
        commonController.notificationSuccessMessage({ message: `${succeed} 个文件上传成功` }, 3);
      } else if (failed > 0 && succeed === 0) {
        commonController.notificationWarnMessage({ message: `${failed} 个文件上传失败` }, 3);
      }
    },
    [setFileQueue, taskId, uploadMutation],
  );
  // console.log(media_type)
  const handleFilesChange = (files: RcFile[]) => {
    const isCorrectCondition = isCorrectFiles(files, restask?.media_type!);
    if (!isCorrectCondition) {
      return;
    } else {
      commonController.notificationSuccessMessage({ message: '已添加' + files.length + '个文件至上传列表' }, 3);
    }

    processUpload(normalizeFiles(files));
  };

  const handleFileDelete = useCallback(
    async (file: QueuedFile) => {
      console.log(file)
      await deleteFile(
        { task_id: taskId! },
        {
          attachment_ids: [file.details.id!],
        },
      );
      setFileQueue((pre) => pre.filter((item) => item.uid !== file.uid));
      commonController.notificationSuccessMessage({ message: '已删除一个文件' }, 3);
    },
    [setFileQueue, taskId],
  );

  const tableColumns = useMemo(() => {
    return [
      {
        title: '文件名',
        dataIndex: 'name',
        align: 'left',
        responsive: ['md', 'lg', 'sm'],
        key: 'name',
        render: (text: string) => {
          return (
            <IconText icon={<FileIcon />}>
              {formatter.format('ellipsis', text, { maxWidth: 540, type: 'tooltip' })}
            </IconText>
          );
        },
      },
      {
        title: '地址',
        dataIndex: 'path',
        align: 'left',
        responsive: ['md', 'lg'],
        key: 'path',
        render: (text: string) => {
          return formatter.format('ellipsis', text, { maxWidth: 160, type: 'tooltip' });
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        align: 'left',
        responsive: ['md', 'lg', 'sm'],
        width: 160,
        key: 'status',
        render: (text: UploadStatus, record: QueuedFile) => {
          return (
            <Status type={_.lowerCase(record.status) as StatusType} icon={<Spot />}>
              {statusTextMapping[text]}
            </Status>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        align: 'left',
        responsive: ['md', 'lg'],
        width: 160,
        key: 'action',
        render: (text: string, record: QueuedFile) => {
          return (
            <>
              {record.status === UploadStatus.Fail && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    processUpload(fileQueue);
                  }}
                >
                  重新上传
                </Button>
              )}
              <Popconfirm
                title="确定删除此文件吗？"
                onConfirm={() => {
                  handleFileDelete(record);
                }}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          );
        },
      },
    ] as TableColumnType<QueuedFile>[];
  }, [fileQueue, handleFileDelete, processUpload]);

  return (
    <Wrapper flex="column" full>
      <Header flex items="center">
        <Bar />
        <h3>数据导入</h3>
      </Header>
      <FlexLayout.Content flex items="stretch" gap="1.5rem">
        <Left flex="column">
          <h4>本地上传</h4>
          <UploadArea flex="column" gap="1rem" items="center">
            <UploadBg />

            <FlexLayout gap="1rem">
              <Button type="primary" icon={<FileOutlined />}>
                <NativeUpload
                  onChange={handleFilesChange}
                  directory={false}
                  multiple={true}
                  accept={FileMimeType[restask?.media_type!]}
                >
                  上传文件
                </NativeUpload>
              </Button>
              <Button type="primary" ghost icon={<FolderOpenOutlined />}>
                <NativeUpload onChange={handleFilesChange} directory={true} accept={FileMimeType[restask?.media_type!]}>
                  上传文件夹
                </NativeUpload>
              </Button>
            </FlexLayout>
            <ButtonWrapper flex="column" items="center" gap="0.25rem">
              <div>支持文件类型包括：{FileExtensionText[restask?.media_type]}</div>
              {/* <div> 单次上传文件最大数量为100个，建议单个文件大小不超过{MediaFileSize[task.media_type!]}MB </div> */}
            </ButtonWrapper>
          </UploadArea>
        </Left>
        <Right flex="column" gap="1rem">
          {fileQueue.length > 0 && (
            <FlexLayout.Header items="center" gap="0.25rem" flex>
              <b>上传列表</b>
              <div>正在上传</div>
              <FlexLayout gap=".25rem">
                <span style={{ display: 'inline-block', color: 'var(--color-primary)' }}>
                  {amountMapping.uploading}
                </span>
                <b>个；</b>
              </FlexLayout>
              <FlexLayout gap=".25rem">
                <span>上传成功</span>
                <Status type="success" icon={null} style={{ display: 'inline-block' }}>
                  {amountMapping.succeeded}
                </Status>
                <span>个，</span>
              </FlexLayout>
              <FlexLayout gap=".25rem">
                <span>上传失败</span>
                <Status type="failed" icon={null} style={{ display: 'inline-block' }}>
                  {amountMapping.failed}
                </Status>
                <span>个。</span>
              </FlexLayout>
            </FlexLayout.Header>
          )}
          <FlexLayout.Content scroll>
            <Table columns={tableColumns} dataSource={fileQueue} rowKey={(record) => record.uid} />
          </FlexLayout.Content>
        </Right>
      </FlexLayout.Content>
    </Wrapper>
  );
};

export default InputData;
