import {
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { TableColumnsType, UploadProps } from 'antd';
import { Button, Col, Flex, Form, Input, message, Modal, Row, Space, Table, Upload, Card, Popconfirm } from 'antd';
import axios from 'axios';
import type { RcFile, UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { useEffect, useState } from 'react';

import {
  createDataSet,
  deleteDataSet,
  getdatagroupDetail,
  getDataSetDownloadUrl,
  getDataSetList,
  getfile,
} from '@/api/aiButler/index';
import './index.scss';

import TaskCard from './components/taskCard';

const { confirm } = Modal;

interface QueryParamsType {
  page: string;
  size: string;
  keyword?: string;
  annotation_type?: string;
}
interface DataType {
  id: number;
  version: string;
  description: string;
  file: { filename: string };
}

const { Dragger } = Upload;


const TrainTaskDetail = () => {
  const [options, setOption] = useState<DataType[]>([]);
  const [form] = Form.useForm();
  const searchParams = new URLSearchParams(location.search);
  const parent_id = searchParams.get('parent_id');
  const [dataDetail, setDetail] = useState(Object);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增');
  const [fileId, setFileId] = useState<number>();
  const [searchfrom] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [total, setTotal] = useState(10)
  const [currentPage, setcurrentPage] = useState(1)

  const [queryParams, setQueryparams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });

  const fetchData = () => {
    setIsLoading(true);
    getDataSetList(parent_id, { ...queryParams, ...searchfrom.getFieldsValue() }).then((res) => {
      setOption(res.details.items);
      setTotal(res.details.total)
      setIsLoading(false);
    });
  };

  const addBtn = () => {
    setModalTitle('新增');
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const uploadClick = (value: any) => {
    getDataSetDownloadUrl(parent_id, value.id).then((res) => {
      const elink = document.createElement('a');
      elink.href = res.details.presigned_download_url;
      elink.style.display = 'none';
      elink.click();
    });
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const showDeleteConfirm = (value: any) => {
    deleteDataSet(parent_id, value.id).then(() => {
      fetchData();
    });
  };
  const onFinish = (values: any) => {
    if (modalTitle == '新增') {
      if (!fileId) {
        message.error(`请上传文件!`);
        return;
      }
      const params = {
        description: values.description ? values.description : '',
        file_id: fileId,
      };
      createDataSet(parent_id, params).then(() => {
        fetchData();
        setIsModalOpen(false);
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };

  const onFinishsearch = () => {
    setcurrentPage(1)
    changData(1)
  };

  const resetbtn = () => {
    searchfrom.resetFields();
    setcurrentPage(1)
    changData(1)
  };

  const uploadProps: UploadProps = {
    multiple: false,
    accept: '.zip',
    maxCount: 1,
    customRequest: async (uploadOptions: RcCustomRequestOptions) => {
      const file_obj = uploadOptions.file as RcFile;
      const filename = file_obj.name;
      const result = await getfile({ filename: filename });
      setFileId(result.details.file_id);
      const preSignedPutUrl = result.details.presigned_upload_url;
      const fileContent = await file_obj.arrayBuffer();
      const resp = await axios.put(preSignedPutUrl, fileContent, {
        headers: {
          'Content-Type': file_obj.type || 'application/octet-stream',
          Authorization: '',
        },
        onUploadProgress: ({ total, loaded }) => {
          if (!total) {
            return;
          }
          const percent = Math.round((loaded / total) * 100);
          if (uploadOptions.onProgress) {
            uploadOptions.onProgress({ percent });
          }
        },
      });
      if (uploadOptions.onSuccess) {
        uploadOptions.onSuccess(resp);
      }
    },
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '文件名',
      dataIndex: 'file',
      key: 'filename',
      render: (text: any, record: any) => {
        return record.file.filename;
      },
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '操作',
      dataIndex: 'option',
      key: 'option',
      width: 260,
      align: 'center',
      render: (x, record) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {
                  deleteBtnFlag ?
                    <Popconfirm
                      title="删除任务"
                      description="确定删除该任务吗？"
                      onConfirm={() => showDeleteConfirm(record)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="primary" danger icon={<DeleteOutlined />} />
                    </Popconfirm> : ''
                }
                {
                  downBtnFlag ? <Button type="primary" icon={<DownloadOutlined />} onClick={() => uploadClick(record)}>
                    下载
                </Button> : ''
                }
              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];


  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)
  const [searchBtnFlag, setsearchBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)
  const [downBtnFlag, setdownBtnFlag] = useState<Boolean>(false)



  useEffect(() => {
    fetchData();
    getdatagroupDetail(parent_id).then((res) => {
      setDetail(res.details);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据集') {
            ele.children.forEach(eles => {
              if (eles.name == '下载') {
                setdownBtnFlag(true)
              }
              if (eles.name == '删除') {
                setdeleteBtnFlag(true)
              }
              if (eles.name == '查询') {
                setsearchBtnFlag(true)
              }
              if (eles.name == '新增') {
                setaddBtnFlag(true)
              }
            })
          }
        })
      }
    })
  }, [queryParams])
  const onChangePage = (val: any) => {
    changData(val)
    setcurrentPage(val)
  }
  const changData = (val: any) => {
    setQueryparams({ ...queryParams, page: val })
  };
  const dataSourceWithKeys = options.map((item: DataType) => ({ ...item, key: item.id }));
  return (
    <div className="menu">
      <Row gutter={[8, 32]}>
        <Col span={24}>
          {dataDetail.name ? <TaskCard key={dataDetail.id} cardInfo={dataDetail} /> : ''}
        </Col>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Card bordered={false}>
              <Form layout="inline" onFinish={onFinishsearch} form={searchfrom}>
                <Space wrap>
                  <Form.Item label="关建词" name="keyword">
                    <Input placeholder="请输入关键词" />
                  </Form.Item>
                  {
                    searchBtnFlag ? <Form.Item label="">
                      <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
                        查询
                </Button>
                    </Form.Item> : ''
                  }
                  {
                    searchBtnFlag ? <Form.Item label="">
                      <Button icon={<SyncOutlined />} onClick={resetbtn}>
                        重置
                </Button>
                    </Form.Item> : ''
                  }
                </Space>
              </Form>
            </Card>
            <Card bordered={false}>
              <div className="addbtn">
                {
                  addBtnFlag ? <Button type="primary" icon={<PlusOutlined />} onClick={addBtn} size="large">
                    新增
            </Button> : ''
                }
              </div>
              <Table columns={columns} dataSource={dataSourceWithKeys} bordered loading={isLoading}
                pagination={{
                  pageSize: 10,
                  total: total,
                  showSizeChanger: false,
                  onChange: onChangePage,
                  current: currentPage,
                  size: 'default'
                }}
              />
            </Card>
          </Space>
          <Modal
            title={modalTitle}
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            width={700}
            footer={null}
          >
            <Form
              form={form}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              layout="horizontal"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
            >
              <Form.Item label="备注" name="description">
                <Input.TextArea placeholder="请备注本次版本主要做的修改，限制50字以内" showCount maxLength={50} />
              </Form.Item>
              <Form.Item label="上传文件" name="file" rules={[{ required: true, message: '请上传文件!' }]}>
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-hint">上传文件</p>
                </Dragger>
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Col>
      </Row>
    </div>
  );
};

export default TrainTaskDetail;
