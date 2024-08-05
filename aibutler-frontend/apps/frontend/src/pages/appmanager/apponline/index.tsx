import {
  CloseCircleOutlined,
  PlusOutlined,
  DesktopOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Cascader,
  message,
  Card,
  Badge,
  Collapse,
  Select
} from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { deletedepts, getdeptsDetail, getTrainlist, getmodellist, createapponline, getonlinelist } from '@/api/aiButler/index';
import './index.scss';
import { any } from 'lodash/fp';
import { jsonParse } from '@/utils';
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
  status: object,
  is_gpu: Boolean
}
interface Option {
  value?: string | number | null;
  label: React.ReactNode;
  children?: Option[];
  isLeaf?: boolean;
}

interface QueryParamsType {
  page: string;
  size: string;
}

const { Panel } = Collapse;
const Dept: React.FC = () => {
  const [options, setOption] = useState<any[]>([]);
  const [deptTreeOptions, setDeptTreeOptions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [searchFrom] = Form.useForm();
  const [modalTitle, setModalTitle] = useState('新增');
  const [editId, setEditid] = useState(Number);
  const [disabledFlag, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [trainOptions, setOptions] = useState<any[]>([]);
  const [total, setTotal] = useState(10)
  const [currentPage, setcurrentPage] = useState(1)
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });
  const getData = async (params: any) => {
    setIsLoading(true);
    // { ...params, ...searchFrom.getFieldsValue() }
    const res = await getonlinelist({ ...params, ...searchFrom.getFieldsValue() });
    setOption(res.details.items);
    setTotal(res.details.total)
    setIsLoading(false);
  };

  const addBtn = () => {
    setModalTitle('新增');
    setDisabled(false);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  const lookBtn = (value: any) => {
    setModalTitle('查看');
    getdeptsDetail(value.id).then((res) => {
      form.setFieldsValue(res.details);
    });
    setDisabled(true);
    setIsModalOpen(true);
  };

  const editClick = (value: any) => {
    setModalTitle('编辑');
    setEditid(value.id);
    getdeptsDetail(value.id).then((res) => {
      form.setFieldsValue(res.details);
    });
    setDeptTreeOptions(deptTreeOptions);
    setDisabled(false);
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const demoCancel = () => {
    setIsDemoOpen(false)
    setRecordData({})
  }
  const showDeleteConfirm = (value: any) => {
    confirm({
      title: '删除',
      icon: <CloseCircleOutlined style={{ color: 'red' }} />,
      content: '确定删除吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        deletedepts(value.id).then(() => {
          getData({
            page: 1,
            size: 10,
          });
        });
      },
      onCancel() { },
    });
  };
  const onFinish = (values: any) => {
    console.log(values)
    let params = {
      description: values.description,
      name: values.name,
      is_gpu: values.is_gpu,
      train_task_id: values.train_task_id[1],
    }
    createapponline(params).then(res => {
      message.success(`新增成功`);
      setIsModalOpen(false);
      getData({
        page: 1,
        size: 10,
      });
    })
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
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
  const renderStatus = (text: any, record: DataType) => {
    let tag
    if (record.status.value == 'FINISH') {
      tag = <Badge status="success" text={'已完成'} />
    }
    if (record.status.value == 'FAILURE') {
      tag = <Badge status="error" text={'已失败'} />
    }
    if (record.status.value == 'DEPLOYING') {
      tag = <Badge status="processing" text={'部署中'} />
    }
    if (record.status.value == 'WAITING') {
      tag = <Badge status="default" text={'等待部署'} />
    }
    return tag;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    }, {
      title: '部署方式',
      dataIndex: 'is_gpu',
      key: 'is_gpu',
      render: (value, record) => record.is_gpu ? 'gpu' : 'cpu',
      width: 100,
    }, {
      title: '数据类型',
      dataIndex: 'train_task_out',
      key: 'train_task_out',
      render: (value, record) => record.train_task_out.ai_model_type.name,
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value, record) => renderStatus(value, record),
    }, {
      title: '接口地址',
      dataIndex: 'infer_address',
      key: 'infer_address',
      width: 400,
    }, {
      title: '访问令牌',
      dataIndex: 'token',
      key: 'token',
      width: 400,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 200,
    }, {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      width: 200,
    }, {
      title: '操作',
      dataIndex: 'option',
      key: 'option',
      align: 'center',
      fixed: 'right',
      width: 130,
      render: (x, record: DataType) => {
        return (
          <>
            <Flex gap="small" align="flex-start" vertical>
              <Flex gap="small" wrap="wrap">
                {/* {record.genre.value == 'PAGE' && (
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#e29835' }}
                    onClick={() => {
                      toMenuPage(record);
                    }}
                  >
                    菜单按钮
                  </Button>
                )} */}
                {
                  record.status.value == 'FINISH' ? <Button
                    type="primary"
                    icon={<DesktopOutlined />}
                    onClick={() => {
                      demoDetail(record);
                    }}
                  >
                    演示
                  </Button> : ''
                }

              </Flex>
            </Flex>
          </>
        );
      },
    },
  ];
  const [ai_model_type, setai_model_type] = useState('')
  const demoDetail = (val: any) => {
    setRecordData(val)
    setIsDemoOpen(true)
    setitemary([])
    setresultData([])
    setdataurl('')
    setimgUrl('')
    setai_model_type(val.train_task_out.ai_model_type.name)
    setresponseJson('')
  }
  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)
  useEffect(() => {
    getData(queryParams);
    getTrainlist({
      page: 1,
      size: 100,
    }).then(res => {
      res.details.items.forEach(item => {
        if (item.task_count_stat.FINISH && item.task_count_stat.FINISH > 0) {
          item['isLeaf'] = false
        } else {
          item['isLeaf'] = true
          item['disabled'] = true
        }
        // item['isLeaf'] = false
      })
      setOptions(res.details.items)
    })

    const menus = JSON.parse(localStorage.getItem('Menu'))
    menus.forEach(item => {
      if (item.name == '应用管理') {
        item.children.forEach(ele => {
          if (ele.name == '在线推理') {
            ele.children.forEach(eles => {
              if (eles.name == '新增') {
                setaddBtnFlag(true)
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
    setQueryParams({ ...queryParams, page: val })
  }
  const onChange = (value: (string | number)[], selectedOptions: Option[]) => {
  };

  const loadData = (selectedOptions: Option[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];

    getmodellist(targetOption.id, {
      page: 1,
      size: 100,
      status: "FINISH"
    }).then(res => {
      res.details.items.forEach(item => {
        item['name'] = item.version
      })
      targetOption.children = [...res.details.items];
      setOptions([...trainOptions]);
    })
  };
  const [imgLoading, setimgLoading] = useState(false)
  const [recordData, setRecordData] = useState(Object)
  const [itemary, setitemary] = useState([])
  // const imgUrl = 'http://115.239.218.68:5120/images/detection/helmet/a1.jpg'
  const [imgUrl, setimgUrl] = useState('')
  const [resultData, setresultData] = useState([])
  const [dataurl, setdataurl] = useState('')
  const [responseJson, setresponseJson] = useState('')
  const detectionClick = () => {
    if (!dataurl) {
      message.error('请输入url!')
      return
    }

    setimgLoading(true)
    setitemary([])
    setresultData([])
    let axiosUrl = ''
    if (ai_model_type == '物体检测') {
      axiosUrl = recordData.infer_address + '/object-detectors/to-xyxy/from-url'
    } else {
      axiosUrl = recordData.infer_address + '/image-classifiers/to-classes/from-url'
    }
    axios.post(axiosUrl, {
      image_url: dataurl
    }, {
      headers: {
        Authorization: 'Bearer ' + recordData.token,
      },
    }).then(res => {
      setresponseJson(res.data)
      setimgUrl(dataurl)
      if (res.data.details) {
        let ary = res.data.details
        setimgLoading(false)
        if (ai_model_type == '物体检测') {
          setTimeout(() => {
            let width = document.getElementById("img").offsetWidth;
            let height = document.getElementById("img").offsetHeight;
            let arys = [];
            ary.forEach((item) => {
              arys.push({
                label: item.label,
                confidence: item.confidence,
                top: height * item.xyxy[1],
                left: width * item.xyxy[0],
                width: width * item.xyxy[2] - width * item.xyxy[0],
                height: height * item.xyxy[3] - height * item.xyxy[1],
              });
            });
            setitemary(arys)
            setresultData(arys)
          }, 1000);
        } else {
          setTimeout(() => {
            let arys = [];
            ary.forEach((item) => {
              arys.push({
                label: item.label,
                confidence: item.confidence,
              });
            });
            setitemary([])
            setresultData(arys)
          }, 1000);
        }
      } else {
        setimgLoading(false)
      }
    }).catch(err => {
      setimgLoading(false)
      setitemary([])
      setresultData([])
    })
  }
  const syntaxHighlight = (json: any) => {
    if (typeof json !== "string") {
      json = JSON.stringify(json, undefined, 2);
    } else {
      json = JSON.stringify(jsonParse(json), undefined, 2);
    }
    json = json.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      function (match: any) {
        let cls = "json-number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "json-key";
          } else {
            cls = "json-string";
          }
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return '<span class="' + cls + '">' + match + "</span>";
      }
    );
  };
  const changeFile = (event) => {
    setimgLoading(true)
    setitemary([])
    setresultData([])
    setresponseJson('')
    let imgData = [];
    var file = event.nativeEvent.srcElement.files[0]
    // if (file.size / 1024 / 1024 > 4) {
    //   message.error("图片上传不能大于4m");
    //   setimgLoading(false)
    //   return;
    // }
    var reader = new FileReader();
    let dataBase64
    reader.onload = function (e) {
      dataBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
    // console.log(file)
    let params = {
      file: file,
    };

    let axiosUrl = ''
    if (ai_model_type == '物体检测') {
      axiosUrl = recordData.infer_address + '/object-detectors/to-xyxy/from-file'
    } else {
      axiosUrl = recordData.infer_address + '/image-classifiers/to-classes/from-file'
    }
    axios.post(axiosUrl, params, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer ' + recordData.token,
      },
    }).then(res => {
      setresponseJson(res.data)
      setimgUrl(dataBase64)
      if (res.data.details) {
        // let ary = [{
        //   xyxy: [
        //     0.40218109350938064,
        //     0.1000813704270583,
        //     0.7679935235243578,
        //     0.390746336716872
        //   ],
        //   confidence: 0.22,
        //   label: "cat",
        // }, {
        //   xyxy: [
        //     0.41218109350938064,
        //     0.1200813704270583,
        //     0.7879935235243578,
        //     0.400746336716872],
        //   confidence: 0.42,
        //   label: "cat1",
        // }]
        let ary = res.data.details
        setimgLoading(false)

        if (ai_model_type == '物体检测') {
          setTimeout(() => {
            let width = document.getElementById("img").offsetWidth;
            let height = document.getElementById("img").offsetHeight;
            let arys = [];
            ary.forEach((item) => {
              arys.push({
                label: item.label,
                confidence: item.confidence,
                top: height * item.xyxy[1],
                left: width * item.xyxy[0],
                width: width * item.xyxy[2] - width * item.xyxy[0],
                height: height * item.xyxy[3] - height * item.xyxy[1],
              });
            });
            setitemary(arys)
            setresultData(arys)
          }, 1000);
        } else {
          setTimeout(() => {
            let arys = [];
            ary.forEach((item) => {
              arys.push({
                label: item.label,
                confidence: item.confidence,
              });
            });
            setitemary(arys)
            setresultData(arys)
          }, 1000);
        }
      } else {
        setimgLoading(false)
      }

    }).catch(err => {
      setimgLoading(false)
      setitemary([])
      setresultData([])

    })
    event.target.value = "";
  }
  return (
    <div className="menu">
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card bordered={false}>
          <Form layout="inline" onFinish={onFinishsearch} form={searchFrom}>
            <Space wrap>
              <Form.Item label="关建词" name="keyword">
                <Input placeholder="请输入关键词" />
              </Form.Item>

              <Form.Item label="状态" name="status">
                <Select
                  defaultValue=""
                  style={{ width: 100 }}
                  allowClear
                  options={[
                    { value: 'WAITING', label: '等待部署' },
                    { value: 'DEPLOYING', label: '部署中' },
                    { value: 'FAILURE', label: '已失败' },
                    { value: 'FINISH', label: '已完成' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="">
                <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
                  查询
                      </Button>
              </Form.Item>
              <Form.Item label="">
                <Button icon={<SyncOutlined />} onClick={resetbtn}>
                  重置
                      </Button>
              </Form.Item>
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
              onChange: onChangePage
            }}
            scroll={{ x: 1300 }}
            size='large'
          ></Table>
        </Card>
      </Space>
      <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={500} footer={null}>
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          form={form}
          initialValues={{
            is_gpu: true
          }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '名称不能为空!' }]}>
            <Input placeholder="请输入名称" disabled={disabledFlag} />
          </Form.Item>
          <Form.Item label="模型任务" name="train_task_id" rules={[{ required: true, message: '必填项!' }]}>
            <Cascader options={trainOptions} loadData={loadData} onChange={onChange}
              fieldNames={{
                label: 'name',
                value: 'id',
                children: 'children'
              }}
            />
          </Form.Item>
          <Form.Item label="部署方式" name="is_gpu" rules={[{ required: true, message: '必填项!' }]}>
            <Radio.Group defaultValue={true}>
              <Radio value={true}>gpu</Radio>
              <Radio value={false}>cpu</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="备注" name="description">
            <Input.TextArea placeholder="请输入内容" disabled={disabledFlag} showCount maxLength={200} />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title='演示' open={isDemoOpen} width={1000} footer={null} onCancel={demoCancel} >
        <div className="detectionBox">
          <div className="detectionLeft">
            <div className="detectionUpdata">
              {
                imgLoading ? <div className="loading">
                  <div className="loadimg">
                    <img src="../../../public/src/img/loadingimg.png" alt="" />
                    <span>图片解析中...</span>
                  </div>
                  <div className="line"></div>
                </div>
                  :
                  <div className="img">
                    <div className="imgss">
                      {
                        imgUrl ? <img
                          className="img2"
                          id="img"
                          src={imgUrl}
                          alt=""
                        /> : ''
                      }
                      {/* <div className="masking2">
                        <div className="masktxt">
                          测试名称
                          </div>
                      </div> */}
                      {
                        itemary.length > 0 && itemary[0].top ?
                          itemary.map((item, index) => {
                            return <div className="masking2" key={index}
                              style={{
                                width: item.width + 'px',
                                height: item.height + 'px',
                                left: item.left + 'px',
                                top: item.top + 'px',
                              }}
                            >
                              <div className="masktxt">
                                {item.label}&nbsp;{item.confidence.toFixed(2)}
                              </div>
                            </div>
                          })
                          : ''
                      }
                    </div>
                  </div>
              }
              {
                resultData.length > 0 ? <div className="discernResult">
                  <div className="name">识别结果</div>
                  <table>
                    {
                      itemary.map((item, index) => {
                        return <tr >
                          <td>{item.label} </td>
                          <td>
                            <div
                              className="tdLine"
                              style={{ width: item.confidence * 100 + '%' }}
                            ></div>
                          </td>
                          <td>{item.confidence}</td>
                        </tr>
                      })
                    }

                  </table>
                </div> : ''
              }
              <div className="maskUpdata">
                <div className="maskInput">
                  <Input
                    placeholder="请输入网络图片URL"
                    className="inputFile"
                    value={dataurl}
                    onChange={(e) => {
                      setdataurl(e.target.value)
                    }}
                  />
                  <div className="inputBtn" onClick={() => detectionClick()}>检测</div>
                  <div className="txt">或</div>
                  <label className="image-local">
                    <input
                      type="file"
                      accept="image/png, image/bmp, image/jpg, image/jpeg"
                      className="image-local-input"
                      onChange={(e) => changeFile(e)}
                    />
                    本地上传
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="detectionRight">
            {/* <Collapse
              collapsible="header"
              defaultActiveKey={['1']}
              items={[
                {
                  key: '1',
                  label: 'Response',
                  children: <pre>
                    <code>{responseJson}</code>
                  </pre>,
                },
              ]}
            /> */}
            <Collapse
              collapsible="header"
              defaultActiveKey={['1']}
            >
              <Panel header="Response" key="1">
                {
                  responseJson ? <pre dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(responseJson)
                  }} /> : ''
                }
              </Panel>
              {/* <p dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(responseJson)
                  }} />  */}
            </Collapse>

          </div>
        </div>
      </Modal>
    </div >
  );
};

export default Dept;
