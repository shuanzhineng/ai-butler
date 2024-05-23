/* eslint-disable no-unused-vars */
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { RadioChangeEvent, TableColumnsType, TreeDataNode } from 'antd';
import {
  Button,
  Col,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
  Card,
  Popconfirm,
  Switch
} from 'antd';
import React, { useEffect, useState } from 'react';

import {
  create_role,
  delete_role,
  dept_tree,
  menu_tree,
  put_role_permission,
  retrieve_role,
  role_list,
  update_role,
} from '@/api/services/role';
import './index.scss';

export interface RoleItemDataRangeResponse {
  name: string;
  value: number | string;
}

interface DataType {
  id: string | number;
  name: string;
  code: string;
  disabled: boolean;
  sort: string | number;
  create_time: string;
  description: string;
  data_range: RoleItemDataRangeResponse;
  data_range_name?: string;
  status?: string;
}

interface CreateOrPutDataType {
  id?: string | number;
  name: string;
  code: string;
  disabled: boolean;
  sort: number;
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

const Role = () => {
  const { confirm } = Modal;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [disabledFlag, setDisabled] = useState<boolean>(false);
  const [showDeptTree, setShowDeptTree] = useState<boolean>(false);
  const [data, setData] = useState<DataType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [menuTreeData, setMenuTreeData] = useState<TreeDataNodeType[]>([]);
  const [deptTreeData, setDeptTreeData] = useState<SelectTreeDataNodeType[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [total, setTotal] = useState(10)
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });

  const [menuTreeCheckedKeys, setMenuTreeCheckedKeys] = useState<React.Key[]>([]);
  const [deptTreeSelectedKeys, setDeptTreeSelectedKeys] = useState<React.Key[]>([]);
  const [dataRangePermission, setDataRangePermission] = useState<number>(0);
  const [currentLineRoleId, setCurrentLineRoleId] = useState<string>('');

  const formInitialValues = {
    name: '',
    code: '',
    sort: 10,
    disabled: true,
    description: '',
  };
  // 修改权限菜单树字段名
  const treeFiledNames = { title: 'name', key: 'id', children: 'children' };
  const treeSelectFiledNames = { label: 'name', value: 'id', children: 'children' };
  const dataPermissionOption = [
    { value: 0, label: '仅自己' },
    { value: 1, label: '本部门' },
    { value: 2, label: '本部门及下级部门' },
    { value: 99, label: '全部' },
    { value: 3, label: '自定义' },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 创建并初始化URLSearchParams对象
      const params = new window.URLSearchParams(queryParams as unknown as Record<string, string>);
      // 获取URL查询参数字符串
      const urlQueryParamsString = params.toString();
      const result = await role_list(urlQueryParamsString);
      setData(result.details.items);
      setTotal(result.details.total)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuTree = async () => {
    try {
      const result = await menu_tree();
      // menuTreeData = result.details
      setMenuTreeData(result.details);
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

  const lookBtn = (record: DataType) => {
    setModalTitle('查看');
    setDisabled(true);
    setIsModalOpen(true);

    createUpdateForm.setFieldsValue(Object.assign(
      record, {
      disabled: !record.disabled
    },
    ));
  };

  const editBtn = (record: DataType) => {
    setModalTitle('编辑');
    setDisabled(false);
    setIsModalOpen(true);
    createUpdateForm.setFieldsValue(Object.assign(
      record, {
      disabled: !record.disabled
    },
    ));
  };

  const addBtn = () => {
    setModalTitle('新增');
    setDisabled(false);
    setIsModalOpen(true);
    createUpdateForm.setFieldsValue(formInitialValues);
  };
  const [tagData, setTagdata] = useState('')
  const showDrawer = async (record: DataType) => {
    setTagdata(record.name)
    const result = await retrieve_role(String(record.id));
    setDataRangePermission(result.details.data_range.value);
    setMenuTreeCheckedKeys(result.details.menu_ids);
    setDeptTreeSelectedKeys(result.details.dept_ids);
    setCurrentLineRoleId(String(record.id));
    setOpenDrawer(true);
    if (result.details.data_range.value == 3) {
      setShowDeptTree(true);
    } else {
      setShowDeptTree(false);
    }
  };

  const closeDrawer = () => {
    setMenuTreeCheckedKeys([]);
    setDeptTreeSelectedKeys([]);
    setOpenDrawer(false);
    setShowDeptTree(false);
  };

  const saveDrawer = async () => {
    const items = {
      menu_ids: menuTreeCheckedKeys,
      data_range: dataRangePermission,
      dept_ids: deptTreeSelectedKeys,
    };
    await put_role_permission(currentLineRoleId, items);
    await fetchData();
    setOpenDrawer(false);
    setShowDeptTree(false);
    setMenuTreeCheckedKeys([]);
    setDeptTreeSelectedKeys([]);
  };

  const onChangeDeptTree = (newKey: React.Key[]) => {
    setDeptTreeSelectedKeys(newKey);
    // setDeptTreeSelectedKeys(prevKeys => [...prevKeys, newKey]);
  };

  // const onSearchDeptTree = async (value: string) => {
  //   // 通过平铺数直接筛选
  //   const result = await unfold_dept_tree(value)
  //   const output = result.details.items.map((dept) => ({
  //     ...dept,
  //     children: [],
  //   }));
  //   setDeptTreeData(output)
  // };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onDataRangeRadioChange = (e: RadioChangeEvent) => {
    setDataRangePermission(e.target.value);
    // 数据范围为自定义时显示部门树形多选
    if (e.target.value == 3) {
      setShowDeptTree(true);
    } else {
      setShowDeptTree(false);
    }
  };

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
    delete_role(String(record.id)).then(res => {
      fetchData();
    })
  };

  const renderStatus = (text: any, record: DataType) => {
    const tag = !record.disabled ? <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} defaultChecked /> : <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} />;
    return tag;
  };

  const formOnFinish = async (values: CreateOrPutDataType) => {
    // setUpdateData(values)
    createUpdateForm.setFieldsValue(values);
    const allFieldValues = Object.assign(
      createUpdateForm.getFieldsValue(), {
      disabled: !createUpdateForm.getFieldsValue().disabled
    },
    )

    if (modalTitle == '编辑') {
      const role_id = allFieldValues.id;
      delete allFieldValues.id;
      await update_role(String(role_id), allFieldValues);
      setIsModalOpen(false);
    } else if (modalTitle == '新增') {
      delete allFieldValues.id;
      await create_role(allFieldValues);
      setIsModalOpen(false);
    }
    createUpdateForm.resetFields();
    await fetchData();
  };

  const formOnFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const onTreeNodeChecked = (checkedKeys: React.Key[] | any) => {
    setMenuTreeCheckedKeys(checkedKeys);
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权限标识',
      dataIndex: 'code',
      key: 'code',
    },

    {
      title: '排序号',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '权限范围',
      dataIndex: 'data_range',
      key: 'data_range_name',
      render: (text: any, record: any) => {
        return record.data_range.name;
      },
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
                    </Popconfirm>
                    : ''
                }
                <Button type="primary" style={{ backgroundColor: '#e29835' }} onClick={() => showDrawer(record)}>
                  权限管理
                </Button>
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
  const [createUpdateForm] = Form.useForm();


  useEffect(() => {
    // 首次加载数据

    fetchData();
    fetchMenuTree();
    fetchDeptTree();
    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '系统管理') {
        item.children.forEach(ele => {
          if (ele.name == '角色管理') {
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
              <Form.Item label="角色名称">
                <Input
                  placeholder="请输入角色名称"
                  value={queryParams.name}
                  onChange={(e) => handleQueryInputChange(e, 'name')}
                />
              </Form.Item>
              <Form.Item label="角色状态">
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
                searchBtnFlag ?
                  <Form.Item label="">
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


      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form
          form={createUpdateForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={formOnFinish}
          onFinishFailed={formOnFinishFailed}
          initialValues={{
            disabled: true,
            sort: 10
          }}
        >
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '角色名称不能为空!' }]}>
            <Input placeholder="请输入角色名称" disabled={disabledFlag} />
          </Form.Item>
          <Form.Item label="权限标识" name="code" rules={[{ required: true, message: '权限标识不能为空!' }]}>
            <Input placeholder="请输入标识字符" disabled={disabledFlag} />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={1} defaultValue={10} disabled={disabledFlag} />
          </Form.Item>
          <Form.Item label="状态" name="disabled" rules={[{ required: true }]} valuePropName="checked">
            <Switch disabled={disabledFlag} checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item label="备注" name="description">
            <Input.TextArea placeholder="请输入内容" disabled={disabledFlag} showCount maxLength={200} />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
            {
              !disabledFlag ? <Button type="primary" htmlType="submit">
                确定
            </Button> : ''
            }
          </Form.Item>
        </Form>
      </Modal>
      <Drawer
        title="当前角色"
        onClose={closeDrawer}
        open={openDrawer}
        width={1020}
        extra={
          <Space>
            <Tag color="#108ee9">{tagData}</Tag>
          </Space>
        }
        footer={
          <Space>
            <Button type="primary" onClick={saveDrawer}>
              保存
            </Button>
          </Space>
        }
      >
        <Row>
          <Col span={6}>
            <div className="colHeader">
              <div className="line" />
              <span>数据授权</span>
              <Tooltip placement="right" title={'授权用户可操作的数据范围'} arrow={true}>
                <QuestionCircleOutlined />
              </Tooltip>
            </div>
            <Radio.Group onChange={(e) => onDataRangeRadioChange(e)} value={dataRangePermission}>
              <Space direction="vertical">
                {dataPermissionOption.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            {showDeptTree && (
              <div className="deptTree">
                <TreeSelect
                  // showSearch
                  // onSearch={onSearchDeptTree}
                  style={{ width: '160px' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  placeholder="请选择部门"
                  allowClear
                  multiple
                  treeDefaultExpandAll
                  treeData={deptTreeData}
                  fieldNames={treeSelectFiledNames}
                  value={deptTreeSelectedKeys}
                  onChange={(e) => onChangeDeptTree(e)}
                />
              </div>
            )}
          </Col>
          <Col span={18}>
            <div className="colHeader">
              <div className="line" />
              <span>菜单授权</span>
              <Tooltip placement="right" title={'授权用户在菜单中可操作的范围'} arrow={true}>
                <QuestionCircleOutlined />
              </Tooltip>
            </div>
            <Tree
              checkable
              multiple
              treeData={menuTreeData}
              fieldNames={treeFiledNames}
              onCheck={onTreeNodeChecked}
              checkedKeys={menuTreeCheckedKeys}
            />
          </Col>
        </Row>
      </Drawer>
    </div>
  );
};
export default Role;
