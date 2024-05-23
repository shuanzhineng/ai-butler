import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { RadioChangeEvent, TableColumnsType } from 'antd';
import { Button, Col, Flex, Form, Input, InputNumber, Modal, Radio, Row, Select, Table, TreeSelect, Card, Popconfirm, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMenu, deleteTree, getTreeDetail, getTreeFull, putTree } from '@/api/aiButler';
import './menu.scss';

const { confirm } = Modal;

interface GenreType {
  name: string;
  value: string | number;
}
interface DataType {
  code?: string;
  disabled?: boolean;
  genre: GenreType;
  icon?: string;
  id?: number;
  is_link?: boolean;
  link_url?: string;
  name?: string;
  sort?: number;
  create_time?: string;
  update_time?: string;
  web_path?: string;
  children?: DataType[];
}

const Menu: React.FC = () => {
  const [options, setOption] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [disabledFlag, setDisabled] = useState(false);
  const [linkFlag, setLinkflag] = useState(false);
  const [editId, setEditid] = useState(Number);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //  form.setFieldsValue({parent_id: 1})
  //   "name": "系统管理1", //名称
  // "code": "xasdasd",
  // "icon": "xxx", //图标
  // "sort": 20000, //顺序号
  // "is_link": false, //是否外链
  // "link_url": "", //外链
  // "genre": "DIRECTORY", //类型
  // "web_path": "", //路由地址
  // "disabled": false, //是否禁用
  // "parent_id": null //父级id

  const removeEmptyEntries = (data: DataType[]): DataType[] => {
    return data.map((item) => ({
      ...item,
      children:
        Array.isArray(item.children) && item.children.length > 0 ? removeEmptyEntries(item.children) : undefined, // 对每个层级的children都进行检查
      key: item.id,
    }));
  };

  const getData = () => {
    setIsLoading(true);
    getTreeFull().then((res) => {
      const output = removeEmptyEntries(res.details);
      setOption(output);
      setTreeData(output);
      setIsLoading(false);
    });
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
    form.resetFields();
    setModalTitle('查看');
    // getTreeDetail
    getTreeDetail(value.id).then((res) => {
      form.setFieldsValue(res.details);
      form.setFieldsValue({
        ...form,
        parent_id: res.details.parent ? res.details.parent.id : null,
        disabled: !res.details.disabled
      });
      setLinkflag(!res.details.is_link);
    });
    setDisabled(true);
    setIsModalOpen(true);
  };
  const editClick = (value: any) => {
    form.resetFields();
    setModalTitle('编辑');
    setDisabled(false);
    setIsModalOpen(true);
    setEditid(value.id);
    getTreeDetail(value.id).then((res) => {

      form.setFieldsValue(res.details);
      form.setFieldsValue({
        ...form,
        parent_id: res.details.parent ? res.details.parent.id : res.details.parent,
        disabled: !res.details.disabled
      });
      setLinkflag(!res.details.is_link);
    });
  };
  const toMenuPage = (value: any) => {
    navigate(`/home/menubtnpage?parentid=${value.id}`);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const showDeleteConfirm = (value: any) => {
    deleteTree(value.id).then(() => {
      getData();
    });
  };
  const onChangeRadio = (e: RadioChangeEvent) => {
    setLinkflag(!e.target.value);
  };
  const onFinish = (values: any) => {
    if (modalTitle == '新增') {
      createMenu(
        Object.assign(
          values, {
          icon: '',
          web_path: '',
          disabled: !values.disabled
        },
        ),
      ).then(() => {
        getData();
      });
    }
    if (modalTitle == '编辑') {
      putTree(
        editId,
        Object.assign(
          values, {
          icon: '',
          web_path: '',
          disabled: !values.disabled
        },
        ),
      ).then(() => {
        getData();
      });
    }
    setIsModalOpen(false);
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };

  const renderStatus = (text: string, record: DataType) => {
    const tag = !record.disabled ? <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} defaultChecked /> : <Switch checkedChildren="启用" unCheckedChildren="禁用" disabled={true} />;
    return tag;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },

    {
      title: 'code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '外链接',
      dataIndex: 'is_link',
      key: 'is_link',
    },
    {
      title: '路由地址',
      dataIndex: 'web_path',
      key: 'web_path',
    },

    {
      title: '类型',
      dataIndex: 'genre',
      key: 'genre_name',
      render: (text: any, record: any) => {
        return record.genre.name;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
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
      render: (x, record: DataType) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {
                  detailBtnFlag ? <Button icon={<EyeOutlined />} onClick={() => lookBtn(record)} /> : ''
                }
                {
                  editBtnFlag ? <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      editClick(record);
                    }}
                  /> : ''
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
                    />
                  </Popconfirm> : ''
                }
                {record.genre.value == 'PAGE' && (
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#e29835' }}
                    onClick={() => {
                      toMenuPage(record);
                    }}
                  >
                    菜单按钮
                  </Button>
                )}
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
    // 首次加载数据
    getData();
    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '系统管理') {
        item.children.forEach(ele => {
          if (ele.name == '菜单管理') {
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
  }, []);
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
          dataSource={treeData}
          expandable={{ expandRowByClick: false }}
          bordered
          pagination={false}
        />
      </Card>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
        <Form layout="inline" onFinish={onFinish} onFinishFailed={onFinishFailed} form={form}
          initialValues={{
            disabled: true,
            sort: 10
          }}
        >
          <Row gutter={[24, 32]}>
            <Col className="gutter-row" span={12}>
              <Form.Item label="父级菜单" name="parent_id">
                <TreeSelect
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  allowClear
                  treeData={options}
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
              <Form.Item label="类型" name="genre" rules={[{ required: true, message: '类型不能为空!' }]}>
                <Select
                  style={{ width: 120 }}
                  options={[
                    { value: 'DIRECTORY', label: '目录' },
                    { value: 'PAGE', label: '页面' },
                    // { value: 'BUTTON', label: '按钮' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="菜单名称" name="name" rules={[{ required: true, message: '菜单名称不能为空!' }]}>
                <Input placeholder="请填写" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="code" name="code" rules={[{ required: true, message: 'code不能为空!' }]}>
                <Input placeholder="请填写" disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber min={1} disabled={disabledFlag} />
              </Form.Item>
            </Col>
            <Form.Item label="是否外链接" name="is_link">
              <Radio.Group onChange={onChangeRadio} defaultValue={true} disabled={disabledFlag}>
                <Radio value={true}>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </Form.Item>
            <Col className="gutter-row" span={12}>
              {linkFlag ? (
                <Form.Item label="路由地址" name="web_path" rules={[{ required: true, message: '请输入路由地址!' }]}>
                  <Input placeholder="请填写" disabled={disabledFlag} />
                </Form.Item>
              ) : (
                <Form.Item
                  label="外链接地址"
                  name="link_url"
                  rules={[{ required: true, message: '请输入外链接地址!' }]}
                >
                  <Input placeholder="请填写" disabled={disabledFlag} />
                </Form.Item>
              )}
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label="是否禁用" name="disabled" rules={[{ required: true }]} valuePropName="checked">
                <Switch disabled={disabledFlag} checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            {!disabledFlag ? (
              <Col className="gutter-row" span={24}>
                <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
                  <Button type="primary" htmlType="submit">
                    确定
                  </Button>
                </Form.Item>
              </Col>
            ) : (
              ''
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Menu;
