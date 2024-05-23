import { useState, createRef, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import _ from 'lodash-es';
import { Empty, Spin } from 'antd';
import AnnotationOperation from '@labelu/components';
import type { AnnotatorProps } from '@labelu/video-annotator-react';
import { Annotator } from '@labelu/video-annotator-react';
import { Annotator as AudioAnnotator } from '@labelu/audio-annotator-react';
import '@labelu/components/dist/index.css';
import { useSearchParams } from 'react-router-dom';
import { Bridge } from 'iframe-message-bridge';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { FlexLayout } from '@labelu/components-react';

import { MediaType, type SampleResponse } from '@/api/types';
import { useScrollFetch } from '@/hooks/useScrollFetch';
import type { getSample } from '@/api/services/samples';
import { getSamples } from '@/api/services/samples';
import { convertVideoConfig } from '@/utils/convertVideoConfig';
import { convertVideoSample } from '@/utils/convertVideoSample';
import type { TaskLoaderResult } from '@/loaders/task.loader';

import commonController from '../../utils/common';
import SlideLoader from './components/slideLoader';
import AnnotationRightCorner from './components/annotationRightCorner';
import AnnotationContext from './annotation.context';
import { LoadingWrapper, Wrapper } from './style';

export const annotationRef = createRef();
export const videoAnnotationRef = createRef();
export const audioAnnotationRef = createRef();

const AnnotationPage = () => {
  const routeParams = useParams();
  const { task } = useRouteLoaderData('task') as TaskLoaderResult;
  const sample = useRouteLoaderData('annotation') as Awaited<ReturnType<typeof getSample>>;
  const [searchParams] = useSearchParams();
  const taskConfig = _.get(task, 'config');
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const sampleId = routeParams.sampleId;

  // 滚动加载
  const [totalCount, setTotalCount] = useState<number>(0);
  const currentPage = useRef<number>(1);
  const fetchSamples = useCallback(async () => {
    if (!routeParams.taskId) {
      return Promise.resolve([]);
    }
    console.log(123412414)
    const { details } = await getSamples({
      task_id: routeParams.taskId,
      page: currentPage.current,
      page_size: 40,
    });
    currentPage.current += 1;
    setTotalCount(details.total ? details.total : 0);
    console.log(details)
    return details.items;
  }, [routeParams.taskId]);
  const [samples = [] as SampleResponse[], loading, setSamples] = useScrollFetch(
    fetchSamples,
    () => document.querySelector('.lab-layout__left_sider'),
    {
      isEnd: () => totalCount == samples.length,
    },
  );

  const transformed = useMemo(() => {
    if (!sample?.details) {
      return [];
    }
    console.log(sample)
    console.log(routeParams)

    return commonController.transformFileList(sample.details, routeParams.sampleId);
  }, [sample?.details, routeParams.sampleId]);

  const isLastSample = _.findIndex(samples, { id: Number(sampleId) }) == samples.length - 1;

  const isFirstSample = _.findIndex(samples, { id: Number(sampleId) }) == 0;

  const leftSiderContent = useMemo(() => <SlideLoader />, []);

  const topActionContent = (
    <AnnotationRightCorner
      isLastSample={isLastSample}
      isFirstSample={isFirstSample}
      noSave={!!searchParams.get('noSave')}
    />
  );

  const annotationContextValue = useMemo(() => {
    console.log(task)
    return {
      samples,
      setSamples,
      task,
      isEnd: totalCount == samples.length,
    };
  }, [samples, setSamples, task, totalCount]);

  let content = null;

  const editorConfig = useMemo(() => {
    if (task?.details.media_type == MediaType.VIDEO || task?.details.media_type == MediaType.AUDIO) {
      return convertVideoConfig(taskConfig);
    }

    return {} as AnnotatorProps['config'];
  }, [task?.details.media_type, taskConfig]);

  const editingSample = useMemo(() => {
    if (task?.details.media_type == MediaType.IMAGE) {
      return transformed[0];
    } else if (task?.details.media_type == MediaType.VIDEO || task?.details.media_type == MediaType.AUDIO) {
      if (!transformed?.[0]) {
        return null;
      }

      return convertVideoSample(sample?.data?.data, routeParams.sampleId, editorConfig, task?.details.media_type);
    }
  }, [editorConfig, routeParams.sampleId, sample?.data, task?.media_type, transformed]);

  const renderSidebar = useMemo(() => {
    return () => leftSiderContent;
  }, [leftSiderContent]);

  // =================== preview config ===================
  const [configFromParent, setConfigFromParent] = useState<any>();
  useLayoutEffect(() => {
    const bridge = new Bridge(window.parent);

    bridge.on('preview', (data) => {
      setConfigFromParent(data);
    });

    bridge.post('ready').catch(() => { });

    return () => bridge.destroy();
  }, []);

  const isLoading = useMemo(() => loading || isFetching > 0 || isMutating > 0, [loading, isFetching, isMutating]);

  if (task?.details.media_type == MediaType.IMAGE) {
    content = (
      <AnnotationOperation
        leftSiderContent={leftSiderContent}
        topActionContent={topActionContent}
        loading={loading}
        ref={annotationRef}
        isPreview={false}
        sample={editingSample}
        config={configFromParent || taskConfig}
        isShowOrder={false}
      />
    );
  } else if (task?.details.media_type == MediaType.VIDEO) {
    content = (
      <Annotator
        primaryColor="#0d53de"
        ref={videoAnnotationRef}
        editingSample={editingSample}
        config={configFromParent || editorConfig}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  } else if (task?.details.media_type == MediaType.AUDIO) {
    content = (
      <AudioAnnotator
        primaryColor="#0d53de"
        ref={audioAnnotationRef}
        editingSample={editingSample}
        config={configFromParent || editorConfig}
        toolbarRight={topActionContent}
        renderSidebar={renderSidebar}
      />
    );
  }
  if (_.isEmpty(transformed)) {
    return (
      <FlexLayout.Content items="center" justify="center" flex>
        <Empty description="无样本数据" />
      </FlexLayout.Content>
    );
  }

  if (_.isEmpty(taskConfig?.tools) && _.isEmpty(configFromParent)) {
    return (
      <FlexLayout.Content items="center" justify="center" flex>
        <Empty description="无标注工具" />
      </FlexLayout.Content>
    );
  }

  return (
    <AnnotationContext.Provider value={annotationContextValue}>
      {isLoading && (
        <LoadingWrapper items="center" justify="center" flex>
          <Spin spinning />
        </LoadingWrapper>
      )}
      <Wrapper flex="column" full loading={isLoading}>
        {content}
      </Wrapper>
    </AnnotationContext.Provider>
  );
};
export default AnnotationPage;
