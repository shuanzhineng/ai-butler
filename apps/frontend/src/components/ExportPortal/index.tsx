import type { RadioChangeEvent } from 'antd';
import { Modal, Radio } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { FlexLayout } from '@labelu/components-react';

import { ExportType, MediaType } from '@/api/types';
import { outputSample, outputSamples } from '@/api/services/samples';

export interface ExportPortalProps {
  children: React.ReactChild;
  taskId: string;
  mediaType: MediaType | undefined;
  sampleIds?: number[];
}

export const exportDescriptionMapping = {
  [ExportType.JSON]: '',
  [ExportType.XML]: '',
  // [ExportType.COCO]: 'COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务',
  // [ExportType.MASK]: '面向图像分割（多边形）任务',
};

const availableOptions = {
  [MediaType.IMAGE]: [
    {
      label: ExportType.JSON,
      value: ExportType.JSON,
    }, {
      label: ExportType.XML,
      value: ExportType.XML,
    },
    // {
    //   label: ExportType.COCO,
    //   value: ExportType.COCO,
    // },
    // {
    //   label: ExportType.MASK,
    //   value: ExportType.MASK,
    // },
  ],
  [MediaType.VIDEO]: [
    {
      label: ExportType.JSON,
      value: ExportType.JSON,
    },
  ],
  [MediaType.AUDIO]: [
    {
      label: ExportType.JSON,
      value: ExportType.JSON,
    },
  ],
};

export default function ExportPortal({ taskId, sampleIds, mediaType, children }: ExportPortalProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(ExportType.JSON);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleOptionChange = ({ target: { value } }: RadioChangeEvent) => {
    setExportType(value);
  };

  const handleExport = useCallback(async () => {
    console.log(sampleIds)
    if (!sampleIds) {
      await outputSamples(taskId, exportType);
    } else {
      await outputSample(taskId, sampleIds, exportType);
    }
    setTimeout(() => {
      setModalVisible(false);
    });
  }, [exportType, sampleIds, taskId]);

  const plainChild = useMemo(() => {
    if (
      children === null ||
      children === undefined ||
      typeof children === 'boolean' ||
      !React.isValidElement(children)
    ) {
      return null;
    }

    if (typeof children === 'string' || typeof children === 'number') {
      return <span onClick={handleOpenModal}>{children}</span>;
    }

    return React.cloneElement(React.Children.only(children), {
      // @ts-ignore
      onClick: handleOpenModal,
    });
  }, [children, handleOpenModal]);

  return (
    <>
      {plainChild}
      <Modal title="选择导出格式" okText={'导出'} onOk={handleExport} onCancel={handleCloseModal} open={modalVisible}>
        <FlexLayout flex="column" gap="1rem">
          <FlexLayout.Header items="center" gap="1rem" flex>
            <span>导出格式</span>
            <Radio.Group
              options={mediaType ? availableOptions[mediaType] : []}
              onChange={handleOptionChange}
              value={exportType}
              optionType="button"
              buttonStyle="solid"
            />
          </FlexLayout.Header>
          {/* <div>{exportDescriptionMapping[exportType]}</div> */}
        </FlexLayout>
      </Modal>
    </>
  );
}
