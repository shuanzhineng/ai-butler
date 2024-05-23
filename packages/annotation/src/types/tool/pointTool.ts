import type { IPoint, IToolConfig } from './common';
import type { IInputList } from './tagTool';

export interface IPointUnit extends IPoint {
  id: string;
  sourceID?: string;
  valid: boolean;
  label?: string;
  attribute?: string;
  attributes?: Record<string, string>;
  order: number;
  isVisible: boolean;
}

export interface IPointToolConfig extends IToolConfig {
  attributeMap: Map<string, string>;
  // 目标外标注
  drawOutsideTarget: boolean;
  // 显示标注顺序
  isShowOrder: boolean;
  // 复制上一张结果
  copyBackwardResult: boolean;
  // 标注上限
  upperLimit: number | '';

  // 属性标注
  attributeConfigurable: boolean;
  attributeList: IInputList[];

  // 文本标注属性
  textConfigurable: boolean;
  textCheckType: number;
  customFormat: string;
  markerConfigurable?: boolean; // 是否开启列表标注
  markerList: IInputList[];

  showOrder?: boolean; // 兼容旧 order 的配置
  drawPointOut?: boolean; // 兼容旧的目标外标注
  edgeAdsorption?: boolean; // 是否开启边缘吸附
}
