import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Card, Popconfirm, Switch } from 'antd';
import React, { useEffect, useState } from 'react';

import { createBtn, deletebtn, getBtnlist, putmenu } from '@/api/aiButler/index';
import './menu.scss';
const { confirm } = Modal;

interface ApisType {
  api: string;
  method: string;
}

interface DataType {
  id: number;
  name: string;
  sort: number;
  disabled: boolean;
  apis: ApisType[];
}
interface QueryParamsType {
  page: string;
  size: string;
}


const MenuButton: React.FC = () => {
  const searchParams = new URLSearchParams(location.search);
  const [form] = Form.useForm();
  const parent_id = searchParams.get('parentid');
  const renderStatus = (text: string, record: DataType) => {
    const tag = !record.disabled ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>;
    return tag;
  };
  const [total, setTotal] = useState(10)
  const [options, setOption] = useState<any[]>([]);
  const [editbtn, setEditid] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });
  const getData = () => {
    setIsLoading(true);
    getBtnlist(parent_id, queryParams).then((res) => {
      setOption(res.details.items);
      setTotal(res.details.total)
      setIsLoading(false);
    });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增');
  const addBtn = () => {
    form.resetFields();
    setModalTitle('新增');
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const editClick = (value: any) => {
    form.resetFields();
    setModalTitle('编辑');
    setEditid(value.id);
    form.setFieldsValue(Object.assign(value, {
      disabled: !value.disabled
    }));
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showDeleteConfirm = (value: any) => {
    deletebtn(value.id).then(() => {
      getData();
    });
  };
  const onFinish = (values: any) => {
    if (modalTitle == '新增') {
      createBtn(Object.assign(values,
        {
          parent_id: parent_id,
          disabled: !values.disabled
        })).then(() => {
          getData();
        });
    }
    if (modalTitle == '编辑') {
      putmenu(editbtn, Object.assign(values,
        {
          disabled: !values.disabled
        })).then(() => {
          getData();
        });
    }
    setIsModalOpen(false);
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.error('Failed:', errorInfo);
  };

  const expandedRowRender = (record: DataType) => {
    const expandColumns: TableColumnsType<ApisType> = [
      { title: '请求方法', dataIndex: 'method', key: 'method' },
      { title: '请求地址', dataIndex: 'api', key: 'api' },
    ];
    const data = record.apis;
    return <Table columns={expandColumns} dataSource={data} bordered />;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'disabled',
      key: 'status',
      render: (value, record) => renderStatus(value, record),
    },
    {
      title: '操作',
      dataIndex: 'option',
      key: 'option',
      width: 200,
      align: 'center',
      render: (x, record) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {
                  editBtnFlag ? <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      editClick(record);
                    }}
                  >
                    编辑
                </Button> : ''
                }
                {
                  deleteBtnFlag ? <Popconfirm
                    title="删除"
                    description="确定删除吗？"
                    onConfirm={() => showDeleteConfirm(record)}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm> : ''
                }
              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];
  const [editBtnFlag, seteditBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)
  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)
  const toggleSwitch = () => {

  };
  useEffect(() => {
    getData();
    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '系统管理') {
        item.children.forEach(ele => {
          if (ele.name == '菜单管理') {
            ele.children.forEach(eles => {
              if (eles.name == '新增') {
                setaddBtnFlag(true)
              }
              if (eles.name == '编辑') {
                seteditBtnFlag(true)
              }
              if (eles.name == '删除') {
                setdeleteBtnFlag(true)
              }
            })
          }
        })
      }
    })
  }, [queryParams]);
  const onChangePage = (val: any) => {
    changData(val)
  }
  const changData = (val: any) => {
    setQueryParams({ ...queryParams, page: val })
  }
  // const [form] = Form.useForm();
  const dataSourceWithKeys = options.map((item) => ({ ...item, key: item.id as keyof DataType }));
  return (
    <div className="menu">
      <Card bordered={false}>
        <div className="addbtn">
          {
            addBtnFlag ? <Button type="primary" icon={<PlusOutlined />} onClick={addBtn} size="large">
              新增
        </Button> : ''
          }
        </div>
        <Table
          loading={isLoading}
          columns={columns}
          dataSource={dataSourceWithKeys}
          expandable={{ expandedRowRender }}
          bordered
          pagination={{
            pageSize: 10,
            total: total,
            showSizeChanger: false,
            onChange: onChangePage,
            size: "default",
          }}
        />
      </Card>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form layout="inline" onFinish={onFinish} onFinishFailed={onFinishFailed} form={form}
          initialValues={{
            disabled: true
          }}>
          <Row gutter={[24, 32]}>
            <Col className="gutter-row" span={12}>
              <Form.Item label="权限名称" name="name" rules={[{ required: true, message: '权限名称不能为空!' }]}>
                <Input placeholder="输入权限名称" />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="code" name="code" rules={[{ required: true, message: '必填项!' }]}>
                <Input placeholder="输入code" />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber min={1} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="是否禁用" name="disabled" rules={[{ required: true }]} valuePropName="checked" >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={24}>
              <Form.List name="apis" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'method']}
                          label="请求方式"
                          rules={[{ required: true, message: '必填项!' }]}
                        >
                          <Select
                            style={{ width: 120 }}
                            options={[
                              { value: 'GET', label: 'GET' },
                              { value: 'POST', label: 'POST' },
                              { value: 'PUT', label: 'PUT' },
                              { value: 'DELETE', label: 'DELETE' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'api']}
                          label="接口地址"
                          rules={[{ required: true, message: '必填项!' }]}
                        >
                          <Input placeholder="接口地址" />
                        </Form.Item>
                        {fields.length > 1 ? <MinusCircleOutlined onClick={() => remove(name)} /> : ''}
                      </Space>
                    ))}
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 4 }}>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        新增
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
            <Col className="gutter-row" span={24}>
              <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuButton;
