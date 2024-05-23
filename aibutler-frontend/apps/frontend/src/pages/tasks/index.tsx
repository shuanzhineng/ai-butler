import { Alert, Button, Pagination} from 'antd';
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import _ from 'lodash';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';
import React, { useState, useEffect } from 'react';
import type { TaskListResponseWithStatics } from '@/api/types';
import { usePageSize } from '@/hooks/usePageSize';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';

import TaskCard from './components/taskCard';
import NullTask from './components/nullTask';

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

const Footer = styled(FlexLayout.Footer)`
  padding: 1rem 0;
`;

const TaskCardItem = styled(TaskCard)``;

const TaskList = () => {
  const navigate = useNavigate();
  const routerLoaderData = useRouteLoaderData('tasks') as TaskListResponseWithStatics;
  // const tasks = _.get(routerLoaderData, 'data');
  const tasks = _.get(routerLoaderData, 'details.items');
  // const meta_data = _.get(routerLoaderData, 'meta_data');
  const meta_data = {
    page: 1,
    size: 10,
    total: routerLoaderData.details.total
  };
  const pageSize = usePageSize();
  console.log(pageSize)
  const [searchParams, setSearchParams] = useSearchParams({
    size: String(pageSize),
  });

  const createTask = () => {
    navigate('/home/tasks/0/edit?isNew=true');
  };

  const [addBtnFlag, setaddBtnFlag] = useState<Boolean>(false)
  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据标注') {
            ele.children.forEach(eles => {
              if (eles.name == '新增') {
                setaddBtnFlag(true)
              }
            })
          }
        })
      }
    })
  }, [])
  return (
    <Wrapper flex="column">
      <FlexLayout.Content scroll flex="column">
        {tasks.length > 0 && addBtnFlag && (
          <Header>
            <Button type="primary" onClick={createTask}>
              新建任务
            </Button>
          </Header>
        )}
        <FlexLayout.Content scroll>
          {meta_data && meta_data?.total > 0 ? (
            <CardsWrapper>
              {tasks.map((cardInfo: any, cardInfoIndex: number) => {
                return <TaskCardItem key={cardInfoIndex} cardInfo={cardInfo} />;
              })}
            </CardsWrapper>
          ) : addBtnFlag ? (
            <NullTask />
          ) : ''}
        </FlexLayout.Content>
      </FlexLayout.Content>
      <Footer flex="column" items="flex-end">
        {meta_data && searchParams && meta_data?.total > pageSize && (
          <Pagination
            defaultCurrent={searchParams.get('page') ? +searchParams.get('page')! : 1}
            total={meta_data?.total ?? 0}
            pageSize={+searchParams.get('page_size')! || 10}
            onChange={(value: number, _pageSize: number) => {
              searchParams.set('page_size', String(_pageSize));
              searchParams.set('page', String(value));
              setSearchParams(searchParams);
            }}
          />
        )}
      </Footer>
    </Wrapper >
  );
};

export default TaskList;
