import { PlusOutlined, SearchOutlined, SyncOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Badge, Button, Col, Form, Input, Row, Space, Table, Card, Flex } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import './index.scss';

import { getmodeldetail, getmodellist, downweight, downlog } from '@/api/aiButler/index';

import TaskCard from './components/taskCard';

const TaskCardItem = styled(TaskCard)``;

interface DataType {
  id: number;
  description: string;
  create_time: string;
  start_datetime: string;
  end_datetime: string;
  version: number;
  status: { name: string; value: string };
  framework: string;
  network: string;
  creator: { id: number; name: string; username: string };
  params: {
    imgsz: number;
    device: string;
    epochs: number;
    save_period: number;
    train_data_ratio: number;
    batch_size: number;

    seed?: number;
    cos_lr?: boolean;
    freeze?: number[];
    workers?: number;
    optimizer?: string;
    multi_scale?: boolean;
    label_smoothing?: number;
    train_hyp_params?: any;
  };
}
interface QueryParamsType {
  page: string;
  size: string;
  keyword?: string;
  annotation_type?: string;
}

const ModelDetail: React.FC = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryparams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });
  const [options, setOption] = useState<DataType[]>([]);
  const searchParams = new URLSearchParams(location.search);
  const parent_id = searchParams.get('id');
  const [dataDetail, setDetail] = useState(Object);
  const [searchFrom] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [total, setTotal] = useState(10)
  const [currentPage, setcurrentPage] = useState(1)
  const fetchData = () => {
    setIsLoading(true);
    getmodellist(parent_id, { ...queryParams, ...searchFrom.getFieldsValue() }).then((res) => {
      setOption(res.details.items);
      setTotal(res.details.total)
      setIsLoading(false);
    });
  };

  const addBtn = () => {
    navigate(`/home/addmodel?id=${parent_id}&type=add`);
  };

  const onFinishsearch = () => {
    // fetchData();
    setcurrentPage(1)
    changData(1)
  };
  const resetbtn = () => {
    searchFrom.resetFields();
    // fetchData();
    setcurrentPage(1)
    changData(1)
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '框架',
      dataIndex: 'framework',
      key: 'framework',
    },
    {
      title: '模型网络',
      dataIndex: 'network',
      key: 'network',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text: any, record: any) => {
        if (record.status.value === 'WAITING') {
          return <Badge status="default" text={'等待训练'} />;
        } else if (record.status.value === 'TRAINING') {
          return <Badge status="processing" text={'训练中'} />;
        } else if (record.status.value === 'FINISH') {
          return <Badge status="success" text={'已完成'} />;
        } else if (record.status.value === 'FAILURE') {
          return <Badge status="error" text={'已失败'} />;
        }
      },
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      render: (text: any, record: any) => {
        return record.creator.name;
      },
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
      width: 300,
      align: 'center',
      render: (x, record) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                <Button icon={<EyeOutlined />} onClick={() => lookBtn(record)} />
                <Button type="primary" icon={<DownloadOutlined />} onClick={() => downWeight(record)} >
                  下载权重
                </Button>
                <Button type="primary" icon={<DownloadOutlined />} onClick={() => downLog(record)} >
                  下载日志
                </Button>
              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];

  const lookBtn = (val: any) => {
    navigate(`/home/addmodel?id=${parent_id}&type=look&childid=${val.id}`);
  }

  const [searchBtnFlag, setsearchBtnFlag] = useState<Boolean>(false)
  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)


  useEffect(() => {
    fetchData();
    getmodeldetail(parent_id).then((res) => {
      setDetail(res.details);
    });
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '模型管理') {
        item.children.forEach(ele => {
          if (ele.name == '在线训练') {
            ele.children.forEach(eles => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);
  const onChangePage = (val: any) => {
    changData(val)
    setcurrentPage(val)
  }
  const changData = (val: any) => {
    setQueryparams({ ...queryParams, page: val })
  };
  const dataSourceWithKeys = options.map((item) => ({ ...item, key: item.id }));
  const downWeight = (val: any) => {
    downweight(parent_id, val.id).then(res => {
      console.log(res.details.download_url)
      const elink = document.createElement('a');
      elink.href = res.details.download_url;
      elink.style.display = 'none';
      elink.click();
    })
  }
  const downLog = (val: any) => {
    downlog(parent_id, val.id).then(res => {
      console.log(res.details.download_url)
      const elink = document.createElement('a');
      elink.href = res.details.download_url;
      elink.style.display = 'none';
      elink.click();
    })
  }
  return (
    <div className="menu">
      <Row gutter={[8, 32]}>
        <Col span={24}>{dataDetail.name ? <TaskCardItem key={dataDetail.id} cardInfo={dataDetail} /> : ''}</Col>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Card bordered={false}>
              <Form layout="inline" onFinish={onFinishsearch} form={searchFrom}>
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
              <Table loading={isLoading} columns={columns} dataSource={dataSourceWithKeys} bordered
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
        </Col>
      </Row>
    </div>
  );
};

export default ModelDetail;
