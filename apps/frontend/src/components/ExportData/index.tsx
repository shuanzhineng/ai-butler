import type { RadioChangeEvent, SelectProps } from 'antd';
import { useEffect } from 'react'
import { Modal, Radio, Select, Input, Form, Progress, Button, message, Space } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { FlexLayout } from '@labelu/components-react';
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { ExportType, MediaType } from '@/api/types';
import { outputSample, outputSamples, getdataSet, exportDataSet, getSamples } from '@/api/services/samples';

export interface ExportDataProps {
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
      label: '导入到已有数据集组',
      value: ExportType.JSON,
    }, {
      label: '导入并创建新的数据集组',
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

// getdataSet
let datasetid = ''


const num = 0
let progress = false
// const options: SelectProps['options'] = [];
// const ()

export default function ExportData({ taskId, sampleIds, mediaType, children }: ExportDataProps) {
  const [options, setoptions] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(ExportType.JSON);
  const [percent, setPercent] = useState<number>(0);
  const [inputValue, setValue] = useState('')
  const [inputNote, setValuenote] = useState('')
  const [messageApi, contextHolder] = message.useMessage();
  // useEffect(() => {
  const samplesRes = getdataSet({
    page: 1,
    page_size: 100
  });
  // }, [])
  const decline = () => {
    setPercent((prevPercent) => {
      const newPercent = prevPercent + 1;
      if (newPercent > 90) {
        return 90;
      }
      return newPercent;
    });
  };
  useEffect(() => {
    let optionary = []
    samplesRes.then(Res => {
      console.log(Res)
      Res.details.items.forEach(item => {
        optionary.push({
          label: item.name,
          value: item.id
        })
      })
    })
    setoptions(optionary)
  }, [])


  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleOptionChange = ({ target: { value } }: RadioChangeEvent) => {
    console.log(value)
    setExportType(value);
  };
  const onFinish = (values: any) => {
    console.log('Success:', values);
  };



  const handleExport = useCallback(async () => {
    const samplesRes = await getSamples({ task_id: taskId, page: 1, page_size: 100000 });
    const sampleIdArrays = samplesRes.details.items;
    const sampleIds = [];
    for (const sample of sampleIdArrays) {
      sampleIds.push(sample.id!);
    }

    const params = {
      sample_ids: sampleIds,
      dataset_group_id: exportType == 'json' ? String(datasetid) : '',
      dataset_group_name: inputValue,
      dataset_group_note: inputNote,
    }
    const times = setInterval(() => {
      decline()
    }, 300)
    progress = true

    await exportDataSet(taskId, params).then(res => {
      messageApi.open({
        type: 'success',
        content: '导入成功',
      });

    }).catch(err => {
      console.log(err)
    })

    setTimeout(() => {
      setModalVisible(false);
      setValue('')
      setValuenote('')
      clearInterval(times)
      progress = false
      setPercent((prevPercent) => {
        const newPercent = 0;
        if (newPercent > 90) {
          return 90;
        }
        return newPercent;
      });
    });
  }, [exportType, sampleIds, taskId, inputValue, inputNote, progress]);

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
  const handleChange = (value: string) => {

    // console.log(`selected ${value}`);
    datasetid = value
  };



  const dataChild = useMemo(() => {
    return <div>
      <div>
        <span>名称</span>
        <Input type='text' placeholder="" value={inputValue} onChange={e => setValue(e.target.value)} />
      </div>
      <div>
        <span>备注</span>
        <Input type='text' placeholder="" value={inputNote} onChange={e => setValuenote(e.target.value)} />
      </div>
    </div>;
  }, [children, handleOpenModal]);


  return (
    <>
      {contextHolder}
      {plainChild}
      <Modal title="导出数据集" okText={'导出'} onOk={handleExport} onCancel={handleCloseModal} open={modalVisible}>
        <FlexLayout flex="column" gap="1rem">
          <FlexLayout.Header items="center" gap="1rem" flex>
            {/* <span>导出方式</span> */}
            <Radio.Group
              options={mediaType ? availableOptions[mediaType] : []}
              onChange={handleOptionChange}
              value={exportType}
              optionType="button"
              buttonStyle="solid"
            />
          </FlexLayout.Header>
          {/* {dataChild} */}
          {
            exportType == 'json' ?
              <div>
                <div>
                  <span>名称</span>
                </div>
                <Select
                  placeholder="请选择数据集"
                  style={{ width: '50%' }}
                  onChange={handleChange}
                  options={options}
                />
                <div>
                  <span>备注</span>
                  <Input type='text' placeholder="" value={inputNote} onChange={e => setValuenote(e.target.value)} />
                </div>
              </div>
              : <div>
                <div>
                  <span>名称</span>
                  <Input type='text' placeholder="" value={inputValue} onChange={e => setValue(e.target.value)} />
                </div>
                <div>
                  <span>备注</span>
                  <Input type='text' placeholder="" value={inputNote} onChange={e => setValuenote(e.target.value)} />
                </div>
              </div>
          }
          {progress ? <Progress percent={percent} /> : ''}
          {/* <Progress percent={percent} /> */}

          {/* <div>{exportDescriptionMapping[exportType]}</div> */}
        </FlexLayout>

      </Modal>
    </>
  );
}
