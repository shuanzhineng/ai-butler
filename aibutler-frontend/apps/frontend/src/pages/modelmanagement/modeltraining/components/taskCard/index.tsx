import Icon, { EditOutlined } from '@ant-design/icons';
import { EllipsisText, FlexLayout } from '@labelu/components-react';
import { Badge, Button, Form, Input, Modal, Select, Tag, Tooltip, Space, Popconfirm } from 'antd';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { modal } from '@/StaticAnt';
// @ts-ignore
import { deletedatagroup, putTrainlist, deletemodelid } from '@/api/aiButler/index'; // @ts-ignore
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';

import { ActionRow, CardWrapper, Row, TaskName } from './style';

interface DataType {
  id: number;
  name: string;
  description: string;
  create_time: string;
  ai_model_type: { name: string; value: string };
  disabled: boolean;
  creator: { id: number; name: string; username: string };
  task_count_stat: { WAITING: number; TRAINING: number; FAILURE: number; FINISH: number };
}

const TrainTaskList = (props: any) => {
  const cardInfo = props.cardInfo as DataType;
  const className = props.className as any;
  const modalTitle = '编辑';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const turnToAnnotation = (e: any) => {
    if (!e.currentTarget.contains(e.target)) {
      return;
    }

    e.stopPropagation();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (!detailBtnFlag) {
      return
    }
    navigate(`/home/modeltraininglist?id=${cardInfo.id}`);
  };

  const handleDeleteTask = (e: React.MouseEvent) => {
    deletemodelid(cardInfo.id).then(() => {
      props.MakeMoney();
    });

  };
  const editTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    form.setFieldsValue(cardInfo);
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const onFinish = (values: any) => {
    if (modalTitle == '编辑') {
      const putParams = {
        name: values.name,
        description: values.description,
        ai_model_type: values.ai_model_type.value,
      };
      putTrainlist(String(cardInfo.id), putParams).then(() => {
        setIsModalOpen(false);
        props.MakeMoney();
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };
  // StudyMakeMoney=()=>{ // 调用父组件方法
  //   this.props.MakeMoney();
  // }

  const [detailBtnFlag, setdetailBtnFlag] = useState<Boolean>(false)
  const [editBtnFlag, seteditBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)

  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '模型管理') {
        item.children.forEach(ele => {
          if (ele.name == '在线训练') {
            ele.children.forEach(eles => {
              if (eles.name == '详情') {
                setdetailBtnFlag(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const returnPag = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

  };
  return (
    <Tooltip placement="bottom" title={cardInfo.description}>
      <CardWrapper className={className} onClick={turnToAnnotation} gap=".5rem">
        <Row justify="space-between">
          <FlexLayout items="center" gap=".5rem">
            <EllipsisText maxWidth={120} title={cardInfo.name}>
              <TaskName>{cardInfo.name}</TaskName>
            </EllipsisText>
            <EllipsisText maxWidth={120} title={cardInfo.name}>
              <Tag bordered={false} color="blue">
                {cardInfo.ai_model_type.name}
              </Tag>
            </EllipsisText>
            {/* <MediaTypeTag type={cardInfo.media_type as MediaType} status={cardInfo.status} /> */}
          </FlexLayout>
          <ActionRow justify="flex-end" items="center">
            {/* <ExportPortal taskId={cardInfo.id} mediaType={cardInfo.media_type}>
            <Tooltip placement={'top'} title={'数据导出'}>
              <Button size="small" type="text" icon={<Icon component={OutputIcon} />} />
            </Tooltip>
          </ExportPortal> */}

            {
              editBtnFlag ? <Tooltip title="编辑任务" placement={'top'}>
                <Button onClick={editTask} size="small" type="text" icon={<EditOutlined />} />
              </Tooltip> : ''
            }
            {
              deleteBtnFlag ?
                <Popconfirm
                  title="删除任务"
                  description="确定删除该任务吗？"
                  onConfirm={handleDeleteTask}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button onClick={returnPag} size="small" type="text" icon={<Icon component={DeleteIcon} />} />
                </Popconfirm> : ''
            }
          </ActionRow>
        </Row>
        <Row>创建人:{cardInfo.creator.name}</Row>
        <Space style={{ marginTop: '20px' }}>
          <Badge status="default" text={'等待训练:'} />
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}>{cardInfo.task_count_stat.WAITING}</span>
          <Badge status="processing" text={'训练中: '} />
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}>{cardInfo.task_count_stat.TRAINING}</span>
          <Badge status="success" text={'已完成: '} />
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}>{cardInfo.task_count_stat.FINISH}</span>
          <Badge status="error" text={'已失败: '} />
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}>{cardInfo.task_count_stat.FAILURE}</span>
        </Space>
        <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            layout="horizontal"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            {/* <Form.Item label='版本'>
            V1
          </Form.Item> */}
            <Form.Item label="数据类型" name="ai_model_type" rules={[{ required: true, message: '数据类型不能为空!' }]}>
              <Select
                disabled={Object.values(cardInfo.task_count_stat).reduce((acc, val) => acc + val, 0) > 0}
                style={{ width: 120 }}
                allowClear
                options={[
                  { value: 'IMAGE_CLASSIFY', label: '图像分类' },
                  { value: 'OBJECT_DETECTION', label: '物体检测' },
                ]}
              />
            </Form.Item>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '名称不能为空!' }]}>
              <Input placeholder="请输入名称" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea placeholder="请输入希望解决的问题，限制100字符以内" showCount maxLength={100} />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </CardWrapper>
    </Tooltip>
  );
};
export default TrainTaskList;
