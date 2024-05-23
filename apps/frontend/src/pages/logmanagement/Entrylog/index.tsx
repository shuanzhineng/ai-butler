/* eslint-disable no-unused-vars */
import { EyeOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Col, Flex, Form, Input, Modal, Row, Select, Space, Table, Tag, Card } from 'antd';
import React, { useEffect, useState } from 'react';

import { login_log_list } from '@/api/services/logmanagement';
import './index.scss';
interface DataType {
  id: string | number;
  is_success: boolean;
  username: string;
  ip_address: string;
  os?: string;
  browser?: string;
  user_agent?: string;
  create_time: string;
  login_status?: string;
}

interface QueryParamsType {
  page: string;
  size: string;
  username?: string;
  ip_address?: string;
  is_success?: boolean;
}

const EntryLog = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [disabledFlag, setDisabled] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [total, setTotal] = useState(10)
  const [currentPage, setcurrentPage] = useState(1)
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 创建并初始化URLSearchParams对象
      const params = new window.URLSearchParams(queryParams as unknown as Record<string, string>);
      // 获取URL查询参数字符串
      const urlQueryParamsString = params.toString();
      const result = await login_log_list(urlQueryParamsString);

      setData(result.details.items);
      setTotal(result.details.total)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const lookBtn = (record: DataType) => {
    setModalTitle('查看');
    setDisabled(true);
    setIsModalOpen(true);
    // 这里列表数据中已包含详情中的所有数据, 无需请求详情接口
    setSelectedRecord(record);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const removeParam = (key: keyof QueryParamsType) => {
    setQueryParams((prevState) => {
      const newParams = { ...prevState };
      delete newParams[key];

      return newParams;
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof QueryParamsType) => {
    event.preventDefault(); // 阻止表单默认提交行为
    setQueryParams((prevState) => ({ ...prevState, [field]: event.target.value }));
  };

  const handleSelectChange = (value: boolean, field: keyof QueryParamsType) => {
    if (value == undefined) {
      removeParam(field);
      return;
    }
    setQueryParams((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = () => {
    setcurrentPage(1)
    changData(1)
    // fetchData();
  };

  const handleReset = () => {
    setcurrentPage(1)
    setQueryParams({
      page: '1',
      size: '10',
    });
    removeParam('is_success');
    removeParam('username');
    removeParam('ip_address');
  };

  const renderStatus = (text: any, record: DataType) => {
    const tag = record.is_success ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>;
    return tag;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '登录用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '登录状态',
      dataIndex: 'is_success',
      key: 'login_status',
      render: (value, record) => renderStatus(value, record),
    },
    {
      title: 'ip地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
    },
    {
      title: '浏览器名',
      dataIndex: 'browser',
      key: 'browser',
    },
    {
      title: '登录时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '操作',
      dataIndex: 'option',
      key: 'option',
      width: 50,
      align: 'center',
      render: (x, record) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {
                  detailBtnFlag ? <Button icon={<EyeOutlined />} onClick={() => lookBtn(record)} /> : ''
                }

              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];

  const [detailBtnFlag, setdetailBtnFlag] = useState<Boolean>(false)
  const [searchBtnFlag, setsearchBtnFlag] = useState<Boolean>(false)


  useEffect(() => {
    // 首次加载数据
    fetchData();
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '日志管理') {
        item.children.forEach(ele => {
          if (ele.name == '登录日志') {
            ele.children.forEach(eles => {
              if (eles.name == '查询') {
                setsearchBtnFlag(true)
              }
              if (eles.name == '详情') {
                setdetailBtnFlag(true)
              }
            })
          }
        })
      }
    })
    // 清理函数可以留空，因为在这里没有需要清理的资源
    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const dataSourceWithKeys = data.map((item) => ({ ...item, key: item.id as keyof DataType }));
  const onChangePage = (val: any) => {
    changData(val)
    setcurrentPage(val)
  }
  const changData = (val: any) => {
    setQueryParams({ ...queryParams, page: val })
  }
  return (
    <div className="entry_log">
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card bordered={false}>
          <Form layout="inline">
            <Space size={[8, 16]} wrap>
              <Form.Item label="登录用户名">
                <Input
                  placeholder="请输入登录用户名"
                  value={queryParams.username}
                  onChange={(e) => handleInputChange(e, 'username')}
                />
              </Form.Item>
              <Form.Item label="ip地址">
                <Input
                  placeholder="请输入ip地址"
                  value={queryParams.ip_address}
                  onChange={(e) => handleInputChange(e, 'ip_address')}
                />
              </Form.Item>

              <Form.Item label="登录状态">
                <Select
                  defaultValue={undefined}
                  value={queryParams.is_success}
                  style={{ width: 100 }}
                  allowClear
                  options={[
                    { value: true, label: '成功' },
                    { value: false, label: '失败' },
                  ]}
                  onChange={(e) => handleSelectChange(e, 'is_success')}
                />
              </Form.Item>
              {
                searchBtnFlag ? <Form.Item label="">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSubmit}>
                    查询
            </Button>
                </Form.Item> : ''
              }
              {
                searchBtnFlag ? <Form.Item label="">
                  <Button icon={<SyncOutlined />} onClick={handleReset}>
                    重置
            </Button>
                </Form.Item> : ''
              }
            </Space>
          </Form>
        </Card>
        <Card bordered={false}>
          <div className="addbtn" />
          <Table columns={columns} dataSource={dataSourceWithKeys} bordered loading={isLoading}
            pagination={{
              pageSize: 10,
              total: total,
              showSizeChanger: false,
              onChange: onChangePage,
              current: currentPage
            }}
            size='large'
          />
        </Card>
      </Space>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} layout="horizontal">
          <Row gutter={[24, 32]}>
            <Col className="gutter-row" span={12}>
              <Form.Item label="ID">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.id || ''} />
              </Form.Item>
            </Col>

            <Col className="gutter-row" span={12}>
              <Form.Item label="登录用户名">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.username || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="登录状态">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.login_status || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="登录ip">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.ip_address || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="操作系统">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.os || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="浏览器名">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.browser || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="UA">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.user_agent || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="登录时间">
                <Input placeholder="" disabled={disabledFlag} value={selectedRecord?.create_time || ''} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={24} />
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
export default EntryLog;
