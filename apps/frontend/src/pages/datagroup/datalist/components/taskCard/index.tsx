import Icon, { EditOutlined } from '@ant-design/icons';
import { EllipsisText, FlexLayout } from '@labelu/components-react';
import { Button, Form, Input, Modal, Select, Tag, Tooltip, Popconfirm, Badge } from 'antd';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { modal } from '@/StaticAnt';
// @ts-ignore
import { deletedatagroup, putdatagroup } from '@/api/aiButler/index';
// @ts-ignore
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';

import { ActionRow, CardWrapper, Row, TaskName } from './style';

const TaskCard = (props: any) => {
  const { cardInfo, className } = props;
  const modalTitle = '编辑';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailBtnFlag, setdetailBtnFlag] = useState<Boolean>(false)
  const [editBtnFlag, seteditBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)

  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据集') {
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
    navigate(`/home/datalistDetails?parent_id=${cardInfo.id}`);
  };

  const handleDeleteTask = (e: React.MouseEvent) => {
    deletedatagroup(cardInfo.id).then(() => {
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
      const params = {
        name: values.name,
        description: values.description,
        annotation_type: values.annotation_type.value ? values.annotation_type.value : values.annotation_type,
      };
      putdatagroup(cardInfo.id, params).then(() => {
        setIsModalOpen(false);
        props.MakeMoney();
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };
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
                {cardInfo.annotation_type.name}
              </Tag>
            </EllipsisText>
          </FlexLayout>
          <ActionRow justify="flex-end" items="center">
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
        <FlexLayout.Footer style={{ marginTop: '20px' }}>  <Badge status="processing" text={'数据集数量：'} />
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {cardInfo.data_set_count}
          </span>
        </FlexLayout.Footer>
        <Modal title={modalTitle} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={null}>
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            layout="horizontal"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              label="数据类型"
              name="annotation_type"
              rules={[{ required: true, message: '数据类型不能为空!' }]}
            >
              <Select
                disabled={cardInfo.data_set_count > 0}
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
            <Form.Item label="备注" name="description">
              <Input.TextArea placeholder="请备注本次版本主要做的修改，限制50字以内" showCount maxLength={50} />
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
export default TaskCard;
