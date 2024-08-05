import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  TreeSelect,
  Card,
  Popconfirm,
  Switch
} from 'antd';
import React, { useEffect, useState } from 'react';

import { createDepts, deletedepts, getdepts, getdeptsDetail, getTreedepts, putdepts } from '@/api/aiButler/index';
import './index.scss';
const { confirm } = Modal;
interface DataType {
  id: number;
  create_time: string;
  name: string;
  code: string;
  owner: string;
  phone: string;
  email: string;
  sort: number;
  description: string;
  disabled: boolean;
  parent_id?: number | null;
}

const Dept: React.FC = () => {
  const [options, setOption] = useState<any[]>([]);
  const [deptTreeOptions, setDeptTreeOptions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增');
  const [editId, setEditid] = useState(Number);
  const [disabledFlag, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setcurrentPage] = useState(1)
  const [queryParams, setQueryparams] = useState({
    page: 1,
    size: 10
  })
  const [total, setTotal] = useState(10)
  const getData = async (params: any) => {
    setIsLoading(true);
    const res = await getdepts(params);
    setOption(res.details.items);
    setTotal(res.details.total)
    const tree = await getTreedepts();
    setDeptTreeOptions(tree.details);
    setIsLoading(false);
  };

  const addBtn = () => {
    form.resetFields();
    setModalTitle('新增');
    setDisabled(false);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const lookBtn = (value: any) => {
    setModalTitle('查看');
    getdeptsDetail(value.id).then((res) => {
      form.setFieldsValue(Object.assign(res.details, {
        disabled: !res.details.disabled
      }));
    });
    setDisabled(true);
    setIsModalOpen(true);
  };

  const editClick = (value: any) => {
    setModalTitle('编辑');
    setEditid(value.id);
    getdeptsDetail(value.id).then((res) => {
      form.setFieldsValue(Object.assign(res.details, {
        disabled: !res.details.disabled
      }));
    });
    setDeptTreeOptions(deptTreeOptions);
    setDisabled(false);
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const showDeleteConfirm = (value: any) => {
    deletedepts(value.id).then(() => {
      getData(queryParams);
    });
  };
  const onFinish = (values: any) => {
    if (modalTitle == '新增') {
      createDepts(Object.assign(values, {
        disabled: !values.disabled
      })).then(() => {
        setIsModalOpen(false);
        getData(queryParams);
      });
    }
    if (modalTitle == '编辑') {
      putdepts(editId, Object.assign(values, {
        disabled: !values.disabled
      })).then(() => {
        setIsModalOpen(false);
        getData(queryParams);
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };

  const onFinishsearch = (value: any) => {
    const params = {
      keyword: value.keyword ? value.keyword : '',
      name: value.name ? value.name : '',
      disabled: value.disabled ? value.disabled : null,
    };
    getData(
      Object.assign(params, { page: 1, size: 10 }),
    );
    setcurrentPage(1)

  };
  const [searchfrom] = Form.useForm();
  const resetbtn = () => {
    searchfrom.resetFields();
    setcurrentPage(1)
    getData(
      Object.assign({ page: 1, size: 10 }),
    );
  };
  const renderStatus = (text: any, record: DataType) => {
    const tag = !record.disabled ? <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} defaultChecked /> : <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} />;
    return tag;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '部门标识',
      dataIndex: 'code',
      key: 'code',
    },

    {
      title: '排序号',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
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
      width: 260,
      align: 'center',
      render: (x, record) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {
                  detailBtnFlag ? <Button icon={<EyeOutlined />} onClick={() => lookBtn(record)}></Button> : ''
                }
                {
                  editBtnFlag ? <Button type="primary" icon={<EditOutlined />} onClick={() => editClick(record)}></Button> : ''
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
                    ></Button>
                  </Popconfirm> : ''
                }
              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];

  const [detailBtnFlag, setdetailBtnFlag] = useState<Boolean>(false)
  const [editBtnFlag, seteditBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)
  const [searchBtnFlag, setsearchBtnFlag] = useState<Boolean>(false)
  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)

  useEffect(() => {
    getData(queryParams);
    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '系统管理') {
        item.children.forEach(ele => {
          if (ele.name == '部门管理') {
            ele.children.forEach(eles => {
              if (eles.name == '查询') {
                setsearchBtnFlag(true)
              }
              if (eles.name == '详情') {
                setdetailBtnFlag(true)
              }
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
    setcurrentPage(val)
  }
  const changData = (val: any) => {
    setQueryparams({ ...queryParams, page: val })
  }
  return (
    <div className="menu">
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card bordered={false}>
          <Form layout="inline" onFinish={onFinishsearch} form={searchfrom}>
            <Space wrap>
              <Form.Item label="关建词" name="keyword">
                <Input placeholder="请输入关键词" />
              </Form.Item>
              <Form.Item label="部门名称" name="name">
                <Input placeholder="请输入部门名称" />
              </Form.Item>
              <Form.Item label="状态" name="disabled">
                <Select
                  style={{ width: 100 }}
                  allowClear
                  options={[
                    { value: false, label: '启用' },
                    { value: true, label: '禁用' },
                  ]}
                />
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
          <Table loading={isLoading} columns={columns} dataSource={options} bordered
            pagination={{
              pageSize: 10,
              total: total,
              showSizeChanger: false,
              onChange: onChangePage,
              current: currentPage
            }}
            size='large'
          ></Table>
        </Card>
      </Space>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          form={form}
          initialValues={{
            disabled: true,
            sort: 10
          }}
        >
          <Row gutter={[24, 32]}>
            <Col className="gutter-row" span={12}>
              <Form.Item label="上级部门" name="parent_id" extra="默认留空为创建者的部门">
                <TreeSelect
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  placeholder="请选择"
                  allowClear
                  treeDefaultExpandAll
                  treeDataSimpleMode={false}
                  treeData={deptTreeOptions}
                  disabled={disabledFlag}
                  fieldNames={{
                    label: 'name',
                    value: 'id',
                    children: 'children',
                  }}
                />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '部门名称不能为空!' }]}>
                <Input placeholder="请输入部门名称" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}></Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="部门标识" name="code">
                <Input placeholder="请输入标识字符" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="负责人" name="owner" rules={[{ required: true, message: '负责人不能为空!' }]}>
                <Input placeholder="请输入负责人" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '电话不能为空!' }]}>
                <Input placeholder="请输入联系电话" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="请输入邮箱" disabled={disabledFlag} />
              </Form.Item>
            </Col>

            <Col className="gutter-row" span={12}>
              <Form.Item label="排序" name="sort" rules={[{ required: true, message: '排序不能为空!' }]}>
                <InputNumber min={1} disabled={disabledFlag} />
              </Form.Item>
            </Col>

            <Col className="gutter-row" span={12}>
              <Form.Item label="状态" name="disabled" valuePropName="checked">
                <Switch disabled={disabledFlag} checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="备注" name="description">
                <Input.TextArea placeholder="请输入内容" disabled={disabledFlag} showCount maxLength={200} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={24}>
              <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
                {!disabledFlag ? (
                  <Button type="primary" htmlType="submit">
                    确定
                  </Button>
                ) : (
                  ''
                )}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Dept;
