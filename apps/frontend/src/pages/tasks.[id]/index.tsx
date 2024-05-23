import React, { useLayoutEffect, useState, useEffect } from 'react';
import { json, Link, useParams, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SelectProps } from 'antd';
import { Table, Pagination, Button, Select, Input, Card } from 'antd';
import { VideoCard } from '@labelu/video-annotator-react';
import _ from 'lodash-es';
import formatter from '@labelu/formatter';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import TaskCard from './components/taskCard';
import type { SampleResponse } from '@/api/types';
import { MediaType, TaskStatus } from '@/api/types';
import ExportPortal from '@/components/ExportPortal';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import BlockContainer from '@/layouts/BlockContainer';
import { jsonParse } from '@/utils';

import type { TaskStatusProps } from './components/Statistical';
import Statistical, { TaskStatus as TaskStatusComponent } from './components/Statistical';
import GoToEditTask from './components/GoToEditTask';
import commonController from '../../utils/common';
import { config } from '../../api/config';
import { dataDetail } from '@/api/aiButler/index'
const HeaderWrapper = styled(FlexLayout.Header)`
  background-color: #fff;
  height: 3.5rem;
`;
const TaskCardItem = styled(TaskCard)``;
const options: SelectProps['options'] = [{
  label: '未标注',
  value: 'NEW'
}, {
  label: '跳过',
  value: 'SKIPPED'
}, {
  label: '已标注',
  value: 'DONE'
}];
const datasetid = null

const Samples = () => {
  const routerData = useRouteLoaderData('task') as TaskLoaderResult;
  const samples = _.get(routerData, 'samples.details.items');
  const task = _.get(routerData, 'task');
  console.log(routerData)
  const metaData = routerData?.samples?.details?.total;
  const routeParams = useParams();
  const taskId = routeParams.taskId;
  // 查询参数
  const [searchParams, setSearchParams] = useSearchParams(
    new URLSearchParams({
      // 默认按照最后更新时间倒序
      page: '1',
      size: '10',
    }),
  );

  const taskStatus = _.get(task, 'status');

  const isTaskReadyToAnnotate =
    ![TaskStatus.DRAFT, TaskStatus.IMPORTED].includes(taskStatus!) &&
    task.details.config &&
    Object.keys(task.details.config).length > 0;
  const [enterRowId, setEnterRowId] = useState<any>(undefined);
  const [selectedSampleIds, setSelectedSampleIds] = useState<any>([]);

  const columns: ColumnsType<SampleResponse> = [
    {
      title: '数据ID',
      dataIndex: 'id',
      key: 'id',
      align: 'left',
    },
    {
      title: '数据预览',
      dataIndex: 'data',
      key: 'packageID',
      align: 'left',
      render: (res) => {
        console.log(res)
        const data = res
        console.log(data)
        let url = '';
        let baseURL = '';
        //@ts-ignore
        switch (import.meta.env.MODE) {
          case 'production':
            baseURL = config.prod.baseUrl;
            break;
          case 'development':
            baseURL = config.test.baseUrl;
        }
        for (const sampleId in data.urls) {
          url = baseURL + data.urls[sampleId];
        }
        console.log(url)

        if (task.details?.media_type === MediaType.IMAGE) {
          return <img src={url} style={{ width: '116px', height: '70px' }} />;
        } else if (task.details?.media_type === MediaType.AUDIO) {
          return <audio src={url} controls />;
        } else {
          return <VideoCard size={{ width: 116, height: 70 }} src={url} showPlayIcon showDuration />;
        }
      },
    },
    {
      title: '标注情况',
      dataIndex: 'state',
      key: 'packageID',
      align: 'left',

      render: (text) => {
        console.log(text)
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        return <TaskStatusComponent status={_.lowerCase(text) as TaskStatusProps['status']} />;
      },
      sorter: true,
    },
    {
      title: '标注数',
      dataIndex: 'annotated_count',
      key: 'annotated_count',
      align: 'left',

      render: (_unused, record) => {
        console.log(record)
        let result = 0;
        const resultJson = record?.data?.result ? record?.data?.result : {};
        for (const key in resultJson) {
          if (key.indexOf('Tool') > -1 && key !== 'textTool' && key !== 'tagTool') {
            const tool = resultJson[key];
            if (!tool.result) {
              let _temp = 0;
              if (tool.length) {
                _temp = tool.length;
              }
              result = result + _temp;
            } else {
              result = result + tool.result.length;
            }
          }
        }
        return result;
      },
      sorter: true,

      // width: 80,
    },
    // {
    //   title: '标注者',
    //   dataIndex: 'created_by',
    //   key: 'created_by',
    //   align: 'left',

    //   render: (created_by) => {
    //     if (!isTaskReadyToAnnotate) {
    //       return '';
    //     }
    //     return created_by.username;
    //   },
    // },
    {
      title: '上次标注时间',
      dataIndex: 'create_time',
      key: 'create_time',
      align: 'left',
      render: (create_time) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        return formatter.format('dateTime', new Date(create_time), { style: 'YYYY-MM-DD HH:mm' });
      },
    },
    {
      title: '',
      dataIndex: 'option',
      key: 'option',
      width: 180,
      align: 'center',

      render: (x, record) => {
        return (
          <>
            {/* {record.id === enterRowId && isTaskReadyToAnnotate && startFlag && ( */}
            <Link to={`/home/tasks/${taskId}/samples/${record.id}`}>
              <Button type="link">进入标注</Button>
            </Link>
            {/* )} */}
          </>
        );
      },
    },
  ];
  const [startFlag, setstartFlag] = useState<Boolean>(false)
  const [dataDetails, setDetail] = useState(Object);
  useEffect(() => {
    dataDetail(String(taskId)).then(res => {
      console.log(res.details)
      setDetail(res.details)
    })

    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据标注') {
            ele.children.forEach(eles => {
              if (eles.name == '标注') {
                setstartFlag(true)
              }
            })
          }
        })
      }
    })

  }, [])
  const rowSelection: TableProps<SampleResponse>['rowSelection'] = {
    columnWidth: 58,
    onChange: (selectedKeys) => {
      setSelectedSampleIds(selectedKeys);
    },
  };

  const handleTableChange: TableProps<SampleResponse>['onChange'] = (pagination, filters, sorter) => {
    if (!_.isEmpty(pagination)) {
      searchParams.set('page', `${pagination.current}`);
      searchParams.set('size', `${pagination.pageSize}`);
    }

    if (sorter) {
      let sortValue = '';
      if (sorter.column.title == '标注情况') {
        // @ts-ignore
        switch (sorter.order) {
          case 'ascend':
            sortValue = 'state';
            break;
          case 'descend':
            sortValue = '-state';
            break;
          case undefined:
            sortValue = '';
            break;
        }
      } else {
        switch (sorter.order) {
          case 'ascend':
            sortValue = 'annotated_count';
            break;
          case 'descend':
            sortValue = '-annotated_count';
            break;
          case undefined:
            sortValue = '';
            break;
        }
      }
      searchParams.set('ordering', `${sortValue}`);
    } else {
      searchParams.delete('ordering');
    }
    setSearchParams(searchParams);
  };

  const [selectValue, setSelectValue] = useState([]);

  const handleGoAnnotation = () => {
    searchParams.set('state', `${selectValue}`);
    searchParams.set('annotated_count', `${inputNote}`);
    setSearchParams(searchParams);
  };
  const resetAnnotation = () => {
    searchParams.set('state', '');
    searchParams.set('annotated_count', '');
    setValuenote('')
    setSelectValue('')
    setSearchParams(searchParams);
  };
  console.log(searchParams)
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set('page', `${page}`);
    searchParams.set('size', `${pageSize}`);
    setSearchParams(searchParams);
  };

  const onMouseEnterRow = (rowId: any) => {
    setEnterRowId(rowId);
  };
  const onRow = (record: any) => {
    return {
      onMouseLeave: () => setEnterRowId(undefined),
      onMouseOver: () => {
        onMouseEnterRow(record.id);
      },
    };
  };

  useLayoutEffect(() => {
    if (task?.media_type !== MediaType.AUDIO) {
      return;
    }

    const handleOnPlay = (e: Event) => {
      const audios = document.getElementsByTagName('audio');
      // 使当前只有一条音频在播放
      for (let i = 0, len = audios.length; i < len; i++) {
        if (audios[i] !== e.target) {
          (audios[i] as HTMLAudioElement).pause();
        }
      }
    };

    document.addEventListener('play', handleOnPlay, true);

    return () => {
      document.removeEventListener('play', handleOnPlay, true);
    };
  }, [task?.media_type]);
  const [inputNote, setValuenote] = useState('')
  const handleChange = (value: string) => {
    // datasetid = value
    setSelectValue(value);
  };

  return (
    <FlexLayout flex="column" full gap="2rem">
      {
        dataDetails.id ? <TaskCardItem key={dataDetails.id} cardInfo={dataDetails} /> : ""
      }
      {
        !isTaskReadyToAnnotate ? <HeaderWrapper flex items="center">
          <FlexLayout.Content full>
            <BlockContainer>
              {isTaskReadyToAnnotate ? '' : <GoToEditTask taskStatus={taskStatus} />}
            </BlockContainer>
          </FlexLayout.Content>
        </HeaderWrapper> : ''
      }

      <FlexLayout.Content scroll>
        <FlexLayout justify="space-between" flex="column" gap="1rem" padding="0 0rem 1.5rem">
          {/* <span>标注状态</span> */}
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ margin: '0 20px 0 0' }}>标注情况</span>
              <Select
                placeholder="请选择标注情况"
                style={{ width: '150px' }}
                onChange={handleChange}
                options={options}
                value={selectValue}
              />
              <span style={{ margin: '0 20px' }}>标注数</span>
              <Input type='text' placeholder="" style={{ width: '150px' }} value={inputNote} onChange={e => setValuenote(e.target.value)} />
              <Button type="primary" style={{ margin: '0 20px' }} onClick={commonController.debounce(handleGoAnnotation, 100)}>
                筛选
            </Button>
              <Button type="primary" ghost onClick={commonController.debounce(resetAnnotation, 100)}>
                重置
            </Button>
            </div>
          </Card>
          <Card bordered={false}>
            {isTaskReadyToAnnotate ? <Statistical /> : ''}
            <Table
              columns={columns}
              dataSource={samples || []}
              pagination={false}
              rowKey={(record) => record.id!}
              // rowSelection={rowSelection}
              // onRow={onRow}
              onChange={handleTableChange}
            />
            <FlexLayout justify="end">
              <ExportPortal taskId={taskId} sampleIds={selectedSampleIds} mediaType={task!.media_type!}>
                {/* <Button type="link" disabled={selectedSampleIds.length === 0}>
                批量数据导出
              </Button> */}
              </ExportPortal>
              <Pagination
                current={parseInt(searchParams.get('page') || '1')}
                pageSize={parseInt(searchParams.get('size') || '10')}
                total={metaData}
                // showSizeChanger
                showQuickJumper
                onChange={handlePaginationChange}
                style={{ margin: '10px 0px 0 0' }}
              />
            </FlexLayout>
          </Card>
        </FlexLayout>
      </FlexLayout.Content>
    </FlexLayout>
  );
};

export default Samples;
