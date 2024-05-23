/* eslint-disable no-unused-vars */
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { message, TableColumnsType, TreeDataNode } from 'antd';
import { Button, Col, Flex, Form, Input, Modal, Radio, Row, Select, Space, Table, Tag, TreeSelect, Card, Popconfirm, Switch } from 'antd';
import React, { useEffect, useState } from 'react';

import { create_user, delete_user, dept_tree, role_list, update_user, user_list } from '@/api/services/role';
import { putpassw } from '@/api/aiButler/index'
import './index.scss';

interface DataType {
  id?: number;
  key?: number;
  create_time: string;
  update_time: string;
  is_superuser: boolean;
  name: string;
  username: string;
  phone: string;
  email: string;
  disabled: boolean;
  description: string;
  roles: { id: number; name: string }[];
  depts: { id: number; name: string }[];
  role_ids?: number[];
  dept_ids?: number[];
}

interface CreateOrPutDataType {
  id?: string | number;
  name: string;
  username: string;
  password: string;
  phone: string;
  email: string;
  disabled: boolean;
  role_ids: number[];
  dept_ids: any;
  description: string;
}

interface QueryParamsType {
  page: string;
  size: string;
  keyword?: string;
  name?: string;
  disabled?: boolean;
}

interface TreeDataNodeType extends Omit<TreeDataNode, 'key' | 'title' | 'children'> {
  id: number;
  name: string;
  children?: TreeDataNodeType[];
}

interface SelectTreeDataNodeType extends Omit<TreeDataNode, 'key' | 'value' | 'label' | 'children'> {
  id: number;
  name: string;
  children?: TreeDataNodeType[];
}

const User = () => {
  const { confirm } = Modal;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ismodifOpen, setIsmodifOpen] = useState<boolean>(false);

  const [modalTitle, setModalTitle] = useState<string>('');
  const [disabledFlag, setDisabled] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roleData, setRoleData] = useState<any>([]);
  const [modifId, setModeifif] = useState('')
  const [deptTreeData, setDeptTreeData] = useState<SelectTreeDataNodeType[]>([]);
  const [total, setTotal] = useState(10)
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });
  const [createUpdateForm] = Form.useForm();
  const [formModif] = Form.useForm()
  const formInitialValues = {
    name: '',
    username: '',
    disabled: true,
    password: '',
    dept_ids: [],
    role_ids: [],
  };
  // 修改权限菜单树字段名
  // const treeFiledNames = { title: 'name', key: 'id', children: 'children' };
  // const treeSelectFiledNames = { label: 'name', value: 'id', children: 'children' };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 创建并初始化URLSearchParams对象
      const params = new window.URLSearchParams(queryParams as unknown as Record<string, string>);
      // 获取URL查询参数字符串
      const urlQueryParamsString = params.toString();
      const result = await user_list(urlQueryParamsString);
      setData(result.details.items);
      setTotal(result.details.total)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRole = async () => {
    try {
      const result = await role_list();
      // menuTreeData = result.details
      setRoleData(result.details.items);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    }
  };

  const fetchDeptTree = async () => {
    try {
      const result = await dept_tree();
      setDeptTreeData(result.details);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    }
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handlemodifOk = () => {
    setIsmodifOpen(false)
  }

  const lookBtn = (record: DataType) => {
    const dept_ids = record.depts.map((item) => {
      return item.id;
    });
    const role_ids = record.roles.map((item) => {
      return item.id;
    });
    record.dept_ids = dept_ids;
    record.role_ids = role_ids;
    createUpdateForm.setFieldsValue(Object.assign(
      record, {
      disabled: !record.disabled
    },
    ));

    setModalTitle('查看');
    setDisabled(true);
    setIsModalOpen(true);
  };

  const editBtn = (record: DataType) => {
    const dept_ids = record.depts.map((item) => {
      return item.id;
    });
    const role_ids = record.roles.map((item) => {
      return item.id;
    });
    record.dept_ids = dept_ids;
    record.role_ids = role_ids;
    createUpdateForm.setFieldsValue(Object.assign(
      record, {
      disabled: !record.disabled
    },
    ));
    setModalTitle('编辑');
    setDisabled(false);
    setIsModalOpen(true);
  };

  const addBtn = () => {
    createUpdateForm.setFieldsValue(formInitialValues);
    setModalTitle('新增');
    setDisabled(false);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handlemodifCancel = () => {
    setIsmodifOpen(false)
  }

  const removeParam = (key: keyof QueryParamsType) => {
    setQueryParams((prevState) => {
      const newParams = { ...prevState };
      delete newParams[key];

      return newParams;
    });
  };

  const handleQueryInputChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof QueryParamsType) => {
    event.preventDefault(); // 阻止表单默认提交行为
    setQueryParams((prevState) => ({ ...prevState, [field]: event.target.value }));
  };

  const handleQuerySelectChange = (value: boolean, field: keyof QueryParamsType) => {
    if (value == undefined) {
      removeParam(field);
      return;
    }
    setQueryParams((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSubmit = async () => {
    await fetchData();
  };

  const handleReset = () => {
    setQueryParams({
      page: '1',
      size: '10',
    });
    removeParam('keyword');
    removeParam('disabled');
    removeParam('name');
  };

  const showDeleteConfirm = (record: DataType) => {
    // confirm({
    //   title: '删除',
    //   icon: <CloseCircleOutlined style={{ color: 'red' }} />,
    //   content: '确定删除吗？',
    //   okText: '确定',
    //   okType: 'danger',
    //   cancelText: '取消',
    //   async onOk() {
    delete_user(String(record.id)).then(res => {
      fetchData();
    })
    //   },
    // });
  };

  const renderStatus = (text: any, record: DataType) => {
    const tag = !record.disabled ? <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} defaultChecked /> : <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} />;

    return tag;
  };

  const renderTag = (value: { id: number; name: string }[]) => {
    return value.map((item) => {
      return (
        <Tag color="blue" key={item.id}>
          {item.name}
        </Tag>
      );
    });
  };
  const modifOnFinish = (val: any) => {
    putpassw(modifId, val).then(res => {
      setIsmodifOpen(false)
      message.success('修改成功')
    })
  }

  const formOnFinish = async (values: CreateOrPutDataType) => {
    // setUpdateData(values)
    createUpdateForm.setFieldsValue(values);
    const allFieldValues = Object.assign(
      createUpdateForm.getFieldsValue(), {
      disabled: !createUpdateForm.getFieldsValue().disabled
    })
    if (modalTitle == '编辑') {
      const user_id = allFieldValues.id;
      delete allFieldValues.id;
      allFieldValues.dept_ids = [values.dept_ids];
      await update_user(String(user_id), allFieldValues);
      setIsModalOpen(false);
    } else if (modalTitle == '新增') {
      delete allFieldValues.id;
      allFieldValues.dept_ids = [values.dept_ids];
      await create_user(allFieldValues);
      setIsModalOpen(false);
    }
    createUpdateForm.resetFields();
    await fetchData();
  };
  const modifOnFinishFailed = (err: any) => {
    console.log(err)
  }
  const formOnFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };

  const columns: TableColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '账号',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },

    {
      title: '部门',
      dataIndex: 'depts',
      key: 'dept_name',
      render: (value) => renderTag(value),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'role',
      render: (value) => renderTag(value),
    },
    {
      title: '手机号',
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
      dataIndex: 'status',
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
                  detailBtnFlag ? <Button icon={<EyeOutlined />} onClick={() => lookBtn(record)} /> : ''
                }
                {
                  editBtnFlag ? <Button type="primary" icon={<EditOutlined />} onClick={() => editBtn(record)} /> : ''
                }
                {
                  deleteBtnFlag ?
                    <Popconfirm
                      title="删除"
                      description="确定删除吗？"
                      onConfirm={() => showDeleteConfirm(record)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="primary" danger icon={<DeleteOutlined />} />
                    </Popconfirm> : ""
                }
                {
                  modifFlag ? <Button type="primary" danger onClick={() => modifBtn(record)} >修改密码</Button> : ''
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
  const [modifFlag, setmodifFlag] = useState<Boolean>(false)
  useEffect(() => {
    // 首次加载数据
    fetchData();
    fetchRole();
    fetchDeptTree();
    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '系统管理') {
        item.children.forEach(ele => {
          if (ele.name == '用户管理') {
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
              if (eles.name == '修改密码') {
                setmodifFlag(true)
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

  // 与原始数据中的key冲突
  const dataSourceWithKeys = data.map((item) => ({ ...item, key: item.id }));

  const onChangePage = (val: any) => {
    changData(val)
  }
  const changData = (val: any) => {
    setQueryParams({ ...queryParams, page: val })
  }
  const modifBtn = (val: any) => {
    setIsmodifOpen(true)
    setModeifif(val.id)
    formModif.setFieldsValue({
      password: '',
      password2: '',
    })
  }
  return (
    <div className="entry_log">
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card bordered={false}>
          <Form layout="inline">
            <Space size={[8, 16]} wrap>
              <Form.Item label="关键词">
                <Input
                  placeholder="请输入关键词"
                  value={queryParams.keyword}
                  onChange={(e) => handleQueryInputChange(e, 'keyword')}
                />
              </Form.Item>
              <Form.Item label="账号">
                <Input
                  placeholder="请输入账号"
                  value={queryParams.name}
                  onChange={(e) => handleQueryInputChange(e, 'name')}
                />
              </Form.Item>
              <Form.Item label="用户状态">
                <Select
                  defaultValue={undefined}
                  value={queryParams.disabled}
                  style={{ width: 100 }}
                  allowClear
                  options={[
                    { value: true, label: '禁用' },
                    { value: false, label: '启用' },
                  ]}
                  onChange={(e) => handleQuerySelectChange(e, 'disabled')}
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
              onChange: onChangePage
            }}
            size='large'
          />
        </Card>
      </Space>
      <Modal title='修改密码' open={ismodifOpen} onOk={handlemodifOk} onCancel={handlemodifCancel} width={600} footer={null}>
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={modifOnFinish}
          onFinishFailed={modifOnFinishFailed}
          form={formModif}
        >
          <Form.Item label="新密码" name="password" rules={[{ required: true, message: '密码不能为空!' }]}>
            <Input placeholder="请输入密码" disabled={disabledFlag} type="password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="再次输入新密码" name="password2" rules={[{ required: true, message: '密码不能为空!' }]}>
            <Input placeholder="请输入密码" disabled={disabledFlag} type="password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={formOnFinish}
          onFinishFailed={formOnFinishFailed}
          form={createUpdateForm}
          initialValues={{
            disabled: true
          }}
        >
          <Row gutter={[24, 32]}>
            <Form.Item label="用户id" name="id" hidden></Form.Item>
            <Col className="gutter-row" span={12}>
              <Form.Item label="部门" name="dept_ids" rules={[{ required: true, message: '部门不能为空!' }]}>
                <TreeSelect
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  placeholder="请选择部门"
                  allowClear
                  treeDefaultExpandAll
                  treeDataSimpleMode={false}
                  treeData={deptTreeData}
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
              <Form.Item label="角色" name="role_ids" rules={[{ required: true, message: '角色不能为空!' }]}>
                <Select
                  disabled={disabledFlag}
                  mode="multiple"
                  placeholder="请选择角色"
                  style={{ flex: 1 }}
                  options={roleData}
                  fieldNames={{ value: 'id', label: 'name' }}
                />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="账号" name="username" rules={[{ required: true, message: '账号不能为空!' }]}>
                <Input placeholder="请输入账号" disabled={disabledFlag} autoComplete="off" />
              </Form.Item>
            </Col>
            {modalTitle == '新增' ? (
              <Col className="gutter-row" span={12}>
                <Form.Item label="密码" name="password" rules={[{ required: true, message: '密码不能为空!' }]}>
                  <Input placeholder="请输入密码" disabled={disabledFlag} type="password" autoComplete="new-password" />
                </Form.Item>
              </Col>
            ) : (
              ''
            )}
            <Col className="gutter-row" span={12}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '姓名不能为空!' }]}>
                <Input placeholder="请输入姓名" disabled={disabledFlag} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '手机号不能为空!' }]}>
                <Input placeholder="请输入手机号" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="请输入邮箱" disabled={disabledFlag} />
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
export default User;
