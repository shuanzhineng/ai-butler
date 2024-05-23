import React from 'react';
import { useParams } from 'react-router';
import _ from 'lodash-es';
import { VideoCard } from '@labelu/video-annotator-react';
import { AudioCard } from '@labelu/components-react';

import type { SampleResponse } from '@/api/types';
import { MediaType } from '@/api/types';
import checkIconUrl from '@/assets/png/check.png';
import { jsonParse } from '@/utils';
import{ config} from '../../../../api/config'
import { AudioWrapper, CheckBg, CheckWrapper, ContentWrapper, IdWrapper, SkipWrapper, Wrapper } from './style';

function CheckIcon() {
  return (
    <CheckWrapper>
      <img src={checkIconUrl} alt="" />
    </CheckWrapper>
  );
}

interface SliderCardProps {
  cardInfo: SampleResponse;
  type?: MediaType;
  index?: number;
  onClick: (sample: SampleResponse) => void;
}

const SliderCard = ({ type, cardInfo, index, onClick }: SliderCardProps) => {
  const { id, state, data } = cardInfo;
  const datas = data
  console.log(cardInfo)
  const headId = _.chain(datas).get('fileNames').keys().head().value();
  const filename = _.get(datas, `fileNames.${headId}`);
  const url = _.get(datas, `urls.${headId}`);
  console.log(filename)
  console.log(headId)
  console.log(url)

  const routeParams = useParams();
  const sampleId = routeParams.sampleId!;

  const handleOnClick = (sample: SampleResponse) => {
    console.log(sample)
    console.log(sampleId)
    if (sample.id === sampleId) {
      return;
    }

    onClick(sample);
  };
  console.log(type)

  if (type === MediaType.AUDIO) {
    return (
      <AudioWrapper flex="column" items="stretch" justify="center" onClick={() => handleOnClick(cardInfo)}>
        {type === MediaType.AUDIO && (
          <AudioCard src={url!} active={id === sampleId} title={filename} no={index! + 1} showNo />
        )}
        {state === 'DONE' && (
          <React.Fragment>
            <CheckBg />
            <CheckIcon />
          </React.Fragment>
        )}
        {state === 'SKIPPED' && <SkipWrapper>跳过</SkipWrapper>}
      </AudioWrapper>
    );
  }
  let baseURL = '';
  //@ts-ignore
  switch (import.meta.env.MODE) {
    case 'production':
      baseURL = config.prod.baseUrl;
      break;
    case 'development':
      baseURL = config.test.baseUrl;
  }
console.log(sampleId)
console.log(id)
  return (
    <Wrapper items="center" flex="column" justify="center">
      <ContentWrapper
        flex="column"
        items="center"
        justify="center"
        active={id == sampleId}
        onClick={() => handleOnClick(cardInfo)}
      >
        {type === MediaType.IMAGE && <img src={baseURL+ url} alt="" />}
        {type === MediaType.VIDEO && <VideoCard src={url!} showPlayIcon showDuration />}
        {state === 'DONE' && (
          <>
            <CheckBg />
            <CheckIcon />
          </>
        )}
        {state === 'SKIPPED' && <SkipWrapper>跳过</SkipWrapper>}
      </ContentWrapper>
      <IdWrapper>{id}</IdWrapper>
    </Wrapper>
  );
};
export default SliderCard;
