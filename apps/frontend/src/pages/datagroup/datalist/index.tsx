import { PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { FlexLayout } from '@labelu/components-react';
import { Button, Form, Input, Modal, Select, Space, Spin, Card, Pagination } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { createDatagroups, getDatagrouop } from '@/api/aiButler/index';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { ReactComponent as CreateTaskIcon } from '@/assets/svg/create-task.svg';

import TaskCard from './components/taskCard';

interface QueryParamsType {
  page: string;
  size: string;
  keyword?: string;
  annotation_type?: string;
}
interface DataType {
  id: number;
  create_time: string;
  update_time: string;
  name: string;
  data_type: { name: string; value: string };
  annotation_type: { name: string; value: string };
  creator: { name: string; id: number; username: string };
  disabled: boolean;
  description: string;
  data_set_count: number;
}
const Footer = styled(FlexLayout.Footer)`
  padding: 1rem 0;
`;
const Wrappers = styled(FlexLayout.Item)`
  display: flex;
  flex-direction: column;
  width: 288px;
  height: 220px;
  background: #fbfcff;
  border: 1px dashed #d0dfff;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const Wrapper = styled(FlexLayout)`
  height: calc(100vh - var(--header-height));
  box-sizing: border-box;
`;

const CardsWrapper = styled(ResponsiveGrid)`
  height: 100%;
`;

const Header = styled(FlexLayout.Header)`
  padding: 1rem 0;
`;

const TaskCardItem = styled(TaskCard)``;

const DataSetGroup = () => {
  const [groupData, setGroupData] = useState<DataType[]>([]);
  const [searchfrom] = Form.useForm();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [total, setTotal] = useState(10)
  const [isSpinning, setIisSpinning] = useState(false);
  const [currentPage, setcurrentPage] = useState(1)
  // const [queryParams, setQueryParams] = useState<QueryParamsType>({
  //   page: '1',
  //   size: '10',
  // });
  const [queryParams, setQueryParams] = useState<QueryParamsType>({
    page: '1',
    size: '10',
  });
  const modalTitle = '新增';
  const fetchData = () => {
    setIisSpinning(true);
    getDatagrouop({ ...queryParams, ...searchfrom.getFieldsValue() }).then((res) => {
      setGroupData(res.details.items);
      setTotal(res.details.total)
      setIisSpinning(false);
    });
  };
  const changData = (val: any) => {
    setQueryParams({ ...queryParams, page: val })
  }
  const onFinishsearch = () => {
    setcurrentPage(1)
    changData(1)
    // fetchData();
  };
  const resetbtn = () => {
    searchfrom.resetFields();
    setcurrentPage(1)
    changData(1)
    // fetchData();
  };
  const addBtn = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const onFinish = (values: any) => {
    if (modalTitle == '新增') {
      // createDatagroups
      createDatagroups(values).then(() => {
        setIsModalOpen(false);
        fetchData();
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    // eslint-disable-next-line no-console
    console.log('Failed:', errorInfo);
  };
  const MakeMoney = () => {
    //子组件调用父组件的方法
    fetchData();
  };


  const [searchBtnFlag, setsearchBtnFlag] = useState<Boolean>(false)
  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)

  useEffect(() => {
    fetchData();
    const cache_menu = localStorage.getItem('Menu')
    if (cache_menu != null) {
      const menus = JSON.parse(cache_menu)
      menus.forEach((item: any) => {
        if (item.name == '数据管理') {
          item.children.forEach((ele: any) => {
            if (ele.name == '数据集') {
              ele.children.forEach((eles: any) => {
                if (eles.name == '查询') {
                  setsearchBtnFlag(true)
                }
                if (eles.name == '新增') {
                  setaddBtnFlag(true)
                }
              })
            }
          })
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const onChangePage = (val: any) => {
    changData(val)
    setcurrentPage(val)
  }

  return (
    <div>
      <Spin spinning={isSpinning}>
        {
          !isSpinning ?
            groupData.length ?
              <Wrapper flex="column">
                <FlexLayout.Content scroll flex="column">
                  <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <Card bordered={false}>
                      <Form layout="inline" onFinish={onFinishsearch} form={searchfrom}>
                        <Space wrap>
                          <Form.Item label="关建词搜索" name="name">
                            <Input placeholder="请输入关键词" />
                          </Form.Item>
                          <Form.Item label="数据类型" name="annotation_type">
                            <Select
                              defaultValue=""
                              style={{ width: 100 }}
                              allowClear
                              options={[
                                { value: 'IMAGE_CLASSIFY', label: '图像分类' },
                                { value: 'OBJECT_DETECTION', label: '物体检测' },
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
                    {
                      addBtnFlag ? <Header>
                        <Button type="primary" icon={<PlusOutlined />} onClick={addBtn}>
                          新增
                        </Button>
                      </Header> : ''
                    }
                    <FlexLayout.Content scroll>
                      <CardsWrapper>
                        {groupData.map((cardInfo: any, cardInfoIndex: number) => {
                          return <TaskCardItem key={cardInfoIndex} cardInfo={cardInfo} MakeMoney={MakeMoney} />;
                        })}
                      </CardsWrapper>
                    </FlexLayout.Content>
                  </Space>
                </FlexLayout.Content>

                <Footer flex="column" items="flex-end">
                  <Pagination
                    pageSize={10}
                    total={total}
                    showSizeChanger={false}
                    onChange={onChangePage}
                    current={currentPage}
                  />
                </Footer>

              </Wrapper>
              : addBtnFlag ? <FlexLayout flex="column" full items="center" justify="center">
                <Wrappers gap="1rem" onClick={addBtn}>
                  <CreateTaskIcon />
                  <Button type="primary">新建任务</Button>
                </Wrappers>
              </FlexLayout> : ""
            : <Wrapper flex="column" />

        }
      </Spin>
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
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '名称不能为空!' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item label="数据类型" name="annotation_type" rules={[{ required: true, message: '数据类型不能为空!' }]}>
            <Select
              defaultValue=""
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 'IMAGE_CLASSIFY', label: '图像分类' },
                { value: 'OBJECT_DETECTION', label: '物体检测' },
              ]}
            />
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
    </div>

  );
};

export default DataSetGroup;
