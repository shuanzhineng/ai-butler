import React, { useState } from 'react';
import { useEffect } from 'react';
import { Button, theme, Form, Upload, Input, Card, InputNumber, Slider, message, Modal, Tree, Col, Row, Radio, Select, Space, Switch } from 'antd';

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import type { TableColumnsType, TableProps, TransferProps, TreeDataNode } from 'antd';
import type { UploadProps, GetProp } from 'antd';
import './index.scss'
import { getmodellist, getmodeldetail, getDataSetList, getDatagrouop, createmodeltasks, getmodelDetail } from '@/api/aiButler/index'
import axios from 'axios';
import request from '@/api/request'
type TableRowSelection<T> = TableProps<T>['rowSelection'];
import Transfer from 'antd/es/transfer';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/lib/upload';
const { confirm } = Modal;
interface DataType {
  key: React.ReactNode;
  num: string;
  ID: number;
  menus: string;
  children?: DataType[];
}
interface Option {
  value: string | number;
  label: string;
  children?: Option[];
  disableCheckbox?: boolean;
}
type TransferItem = GetProp<TransferProps, 'dataSource'>[number];
interface TreeTransferProps {
  dataSource: TreeDataNode[];
  targetKeys: string[];
  onChange: TransferProps['onChange'];
}
const { Dragger } = Upload;
interface DataNode {
  name: string;
  key: string;
  id: string;
  isLeaf?: boolean;
  children?: DataNode[];
}
const menu: React.FC = () => {
  const [loadedKeys, setLoadedKeys] = useState([]);
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(false);
  const [value, setValue] = useState(1);
  const [TreeValue, setTreeValue] = useState('');
  const [options, setOption] = useState<any[]>([])
  const [form] = Form.useForm();
  const searchParams = new URLSearchParams(location.search);
  const parent_id = searchParams.get('id');
  const typeId = searchParams.get('type');
  const [dataDetail, setDetail] = useState({})
  const [networkOptions, setNetworkOptions] = useState([])
  const [frameworkOptions, setFrameworkOptions] = useState([])
  const [incrementalSwitch, setIncrementalSwitch] = useState(false);
  const [baseTaskOptions, setBaseTaskOptions] = useState([])
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const [queryParams, setParams] = useState({
    params: {
      train_data_ratio: '',
      epochs: '',
      batch_size: '',
      imgsz: '',
      save_period: '',
      device: '',
    },
    description: '',
    ai_model_type: '',
    framework: '',
    network: '',
    data_set_ids: []
  })
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const ai_model_type_options = [
    { value: 'IMAGE_CLASSIFY', label: '图像分类' },
    { value: 'OBJECT_DETECTION', label: '物体检测' },
  ]
  const object_detection_network = [
    { value: 'yolov5n', label: 'yolov5n' },
    { value: 'yolov5s', label: 'yolov5s' },
    { value: 'yolov5m', label: 'yolov5m' },
    { value: 'yolov5x', label: 'yolov5x' },
    { value: 'yolov5l', label: 'yolov5l' },
  ]
  const image_classify_network = [
    { value: 'MobileNetV3_large_x1_0', label: 'MobileNetV3_large_x1_0' },
  ]
  const object_detection_framework = [
    { value: 'PyTorch', label: 'PyTorch' },
  ]
  const image_classify_framework = [
    { value: 'PaddlePaddle', label: 'PaddlePaddle' },
  ]


  const isChecked = (selectedKeys: React.Key[], eventKey: React.Key) =>
    selectedKeys.includes(eventKey);

  const generateTree = (treeNodes: TreeDataNode[] = [], checkedKeys: string[] = []): TreeDataNode[] =>
    treeNodes.map(({ children, ...props }) => ({
      ...props,
      disabled: checkedKeys.includes(props.key),
      children: generateTree(children, checkedKeys),
    }));
  const TreeTransfer: React.FC<TreeTransferProps> = ({ dataSource, targetKeys, ...restProps }) => {
    const { token } = theme.useToken();

    const transferDataSource: TransferItem[] = [];
    function flatten(list: TreeDataNode[] = []) {
      list.forEach((item) => {
        transferDataSource.push(item as TransferItem);
        flatten(item.children);
      });
    }
    flatten(dataSource);
    return (
      <Transfer
        {...restProps}
        targetKeys={targetKeys}
        dataSource={transferDataSource}
        className="tree-transfer"
        render={(item) => item.name!}
        showSelectAll={false}
        disabled={disabled}
      >
        {({ direction, onItemSelect, selectedKeys }) => {
          if (direction === 'left') {
            const checkedKeys = [...selectedKeys, ...targetKeys];
            return (
              <div style={{ padding: token.paddingXS }}>
                <Tree
                  blockNode
                  checkable
                  disabled={disabled}
                  checkStrictly
                  checkedKeys={checkedKeys}
                  loadData={onLoadData}
                  loadedKeys={loadedKeys}
                  onLoad={(loadedKeys) => { setLoadedKeys(loadedKeys); }}
                  treeData={generateTree(dataSource, targetKeys)}
                  fieldNames={{
                    title: 'name',
                    // key: 'id',
                    children: 'children',
                  }}
                  onCheck={(_, { node: { key } }) => {
                    onItemSelect(key as string, !isChecked(checkedKeys, key));
                  }}
                  onSelect={(_, { node: { key } }) => {
                    onItemSelect(key as string, !isChecked(checkedKeys, key));
                  }}
                />
              </div>
            );
          }
        }}
      </Transfer>
    );
  };
  const goback = () => {
    navigate(-1);
  }
  const [title, settitle] = useState('新增训练任务')
  const [disabled, setdisabled] = useState(false)
  const [initvalue, setinitvalue] = useState({
    device: '0',
    // ai_model_type: '',
    train_data_ratio: 0.8,
    epochs: 100,
    batch_size: 32,
    imgsz: 224
  })
  useEffect(() => {
    if (typeId == 'look') {
      setdisabled(true)
      settitle('查看训练任务')

    } else {
      settitle('新增训练任务')
    }
    getmodellist(parent_id, { page: 1, size: 100, status: "FINISH" }).then(res => {
      setBaseTaskOptions(res.details.items)
    }
    )
    getmodeldetail(parent_id).then(res => {
      form.setFieldsValue({ ai_model_type: res.details.ai_model_type.value })
      if (res.details.ai_model_type.value == "OBJECT_DETECTION") {
        setNetworkOptions(object_detection_network)
        setFrameworkOptions(object_detection_framework)
      } else {
        setNetworkOptions(image_classify_network)
        setFrameworkOptions(image_classify_framework)
      }
      setDetail(res.details);
      getDatagrouop({
        page: 1,
        size: 100,
        annotation_type: res.details.ai_model_type.value
      }).then(res => {
        res.details.items.forEach(item => {
          item['key'] = 'A' + item.id
          if (item.data_set_count == 0) {
            item['isLeaf'] = true
          }
          item['disableCheckbox'] = true
        })
        let ary = res.details.items

        if (typeId == 'look') {
          getmodelDetail(parent_id, searchParams.get('childid')).then(res => {
            console.log(res)
            setinitvalue({})
            // form.setFieldsValue(res.details);
            form.setFieldsValue({
              train_data_ratio: res.details.params.train_data_ratio,
              epochs: res.details.params.epochs,
              batch_size: res.details.params.batch_size,
              imgsz: res.details.params.imgsz,
              save_period: res.details.params.save_period,
              device: res.details.params.device,
              description: res.details.description,
              ai_model_type: res.details.ai_model_type,
              framework: res.details.framework,
              network: res.details.network,
              data_set_ids: res.details.data_set_ids,
              base_task_id: res.details.base_task ? res.details.base_task.id : '',
            })
            if (res.details && res.details.base_task) {
              setIncrementalSwitch(true);
            }

            let activeId = []
            ary.forEach(ele => {
              res.details.show_data_sets.forEach(eles => {

                eles.children.forEach(items => {
                  items['key'] = items.id
                  items['name'] = items.file.filename
                  activeId.push(items.id)
                })
                if (ele.id == eles.id) {
                  ele.children = eles.children
                }
              })
            })
            setTreeData(ary)
            setTargetKeys(activeId)
          })
        } else {
          setTreeData(ary)
        }
      })
    });


  }, [])
  const onLoadData = ({ key, children }: any) =>
    new Promise<void>((resolve) => {
      getDataSetList(key.slice(1), {
        page: 1,
        size: 100
      }).then(res => {
        res.details.items.forEach(item => {
          item['key'] = item.id
          item['name'] = item.file.filename
          item['isLeaf'] = true
        })

        setTreeData((origin) =>
          updateTreeData(origin, key, [...res.details.items]),
        );
        setLoadedKeys(keys => [...keys, key]);
        resolve();
      })
    });

  const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
    list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });


  const baseTaskSelected = (v: any) => {
    baseTaskOptions.map((item) => {
      if (item.id === v) {
        form.setFieldValue("framework", item.framework)
        form.setFieldValue("network", item.network)
      }
    })
  }


  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [modalTitle, setModalTitle] = useState('新增')


  const onFinish = (values: any) => {
    let paramsItem = {
      params: {
        train_data_ratio: values.train_data_ratio,
        epochs: values.epochs,
        batch_size: values.batch_size,
        imgsz: values.imgsz,
        // save_period: values.save_period,
        device: values.device,
      },
      description: values.description,
      ai_model_type: values.ai_model_type,
      framework: values.framework,
      network: values.network,
      data_set_ids: values.data_set_ids,
      base_task_id: values.base_task_id,
    }
    createmodeltasks(parent_id, paramsItem).then(Res => {
      message.success(`新增成功`);
      navigate(-1);
    })
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
  const onChangetree = (keys: string[]) => {
    console.log(keys)
    setTargetKeys(keys);
  };
  const parser = (value: number) => {
    const num = Number(value);
    return num % 32 === 0 ? value : num - 32;
  };

  const formatter = (value: number) => {
    const num = Number(value);
    return num % 32 === 0 ? value : (num + 32).toString();
  };
  return (
    <div className='menu'>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Card bordered={false}>
          <div className='bntbas'>
            {title}
          </div>
        </Card>
        <Form
          form={form}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          initialValues={initvalue}
        >
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Card bordered={false} style={{ width: '100%' }}>
              <Row gutter={[16, 24]}>
                <Col span={8}>
                  <Form.Item label="增量训练" name="is_inc">
                    <Switch
                      disabled={disabled}
                      checked={incrementalSwitch} onChange={(v) => { setIncrementalSwitch(v) }} />
                  </Form.Item>
                </Col>
                {incrementalSwitch ? <Col span={8}>
                  <Form.Item label="基准版本" required name="base_task_id">
                    <Select
                      disabled={disabled}
                      style={{ width: 200 }}
                      options={baseTaskOptions}
                      fieldNames={{ label: "version", value: "id" }}
                      onSelect={baseTaskSelected}
                      allowClear
                    />
                  </Form.Item>
                </Col> : ""}
              </Row >
            </Card >
            <Card bordered={false}>
              <Row gutter={[16, 24]}>
                <Col span={8} >
                  <Form.Item label="模型类别" required name="ai_model_type">
                    <Select
                      style={{ width: 100 }}
                      options={ai_model_type_options}
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="框架" name="framework" rules={[{ required: true, message: '请选择框架' }]}>
                    {/* <Input placeholder="" /> */}
                    <Select
                      style={{ width: 200 }}
                      allowClear
                      disabled={disabled || incrementalSwitch}
                      options={frameworkOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="模型网络" rules={[{ required: true, message: '请选择模型网络' }]} name="network">
                    {/* <Input placeholder="" /> */}
                    <Select
                      style={{ width: 200 }}
                      allowClear
                      disabled={disabled || incrementalSwitch}
                      options={
                        networkOptions
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="备注" name="description">
                    <Input.TextArea placeholder="" disabled={disabled} showCount maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={8}></Col>
              </Row>
            </Card>
            <Card bordered={false}>
              <Form.Item label="数据列表" name="data_set_ids" rules={[{ required: true, message: '请选择数据列表' }]}>
                <TreeTransfer dataSource={treeData} targetKeys={targetKeys} onChange={onChangetree} />
              </Form.Item>
            </Card>
            <Card bordered={false}>
              <Row gutter={[16, 24]}>
                <Col span={8}>
                  <Form.Item label="train_data_ratio" name="train_data_ratio" required tooltip="训练集比例0.1-0.9之间默认0.8">
                    {/* <InputNumber placeholder="请输入" /> */}
                    <Slider
                      min={0.1}
                      max={0.9}
                      step={0.1}
                      defaultValue={0.8}
                      tooltip={{ open: true }}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="epochs" name="epochs" tooltip="训练轮次" rules={[{ required: true, message: '请输入训练轮次' }]}>
                    <InputNumber defaultValue={100} placeholder="请输入" disabled={disabled} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="batch_size" name="batch_size" tooltip="每轮训练中处理的样本数量" rules={[{ required: true, message: '请输入每轮训练中处理的样本数量' }]}>
                    <InputNumber defaultValue={32} placeholder="请输入" disabled={disabled} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="imgsz" name="imgsz" rules={[{ required: true, message: '请输入训练图片大小' }]} tooltip="训练图片大小： 使用32的倍数，取值112-1024之间, 默认224">
                    <InputNumber
                      step={32}
                      parser={parser}
                      formatter={formatter}
                      defaultValue={224}
                      min={0}
                      disabled={disabled}
                      placeholder="请输入" />
                  </Form.Item>
                </Col>
                {/* <Col span={8}>
                  <Form.Item label="save_period" name="save_period" tooltip="每过多少轮保存权重, 限制save_period < epochs">
                    <InputNumber placeholder="请输入" disabled={disabled} />
                  </Form.Item>
                </Col> */}
                <Col span={8}>
                  <Form.Item label="device" required name="device">
                    <Radio.Group defaultValue='0' disabled={disabled}>
                      <Radio value={'0'}>gpu</Radio>
                      <Radio value={'cpu'}>cpu</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            {
              !disabled ? <Card bordered={false}>
                <Form.Item wrapperCol={{ offset: 18, span: 16 }}>
                  <Button onClick={goback}>
                    返回
                  </Button>
                  <Button type="primary" htmlType="submit" style={{
                    marginLeft: '20px'
                  }}>
                    确定
                  </Button>
                </Form.Item>
              </Card> : ''
            }
          </Space>
        </Form>
      </Space>
    </div >
  );
};

export default menu;
