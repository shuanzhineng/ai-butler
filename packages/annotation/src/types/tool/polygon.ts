import type { ELineColor, ELineTypes } from '../../constant/tool';
import type { IToolConfig } from './common';
import type { IInputList } from './tagTool';

export interface IPolygonData {
  sourceID: string;
  id: string;
  pointList: IPolygonPoint[];
  valid: boolean;
  isVisible: boolean;
  order: number;
  attribute: string;
  attributes?: Record<string, string>;
  isRect?: boolean; // 用于判断当前多边形矩形模式生成
}

export interface IPolygonPoint {
  x: number;
  y: number;
  specialPoint?: boolean; // 顶点是否特殊点
  specialEdge?: boolean; // 顶点与其下一个顶点连成的边是否为特殊边
}

export interface IPolygonConfig extends IToolConfig {
  attributeMap: Map<string, string>;
  // 多边形持有
  lineType: ELineTypes; // 线条类型
  lineColor: ELineColor; // 线条颜色
  lowerLimitPointNum: number; // 下限点个数
  upperLimitPointNum?: number; // 上限点个数
  edgeAdsorption: boolean; // 边缘吸附
  drawOutsideTarget: boolean;
  copyBackwardResult: boolean;
  isShowOrder?: boolean;
  attributeConfigurable: boolean;
  attributeList: IInputList[];
  textConfigurable: boolean;
  textCheckType: number;
  customFormat: string;

  referenceStep?: number;
  referenceFilterData?: string[]; // 存储参考展示的过滤数据对象
  preReferenceStep?: number; // 参考显示预标注步骤

  segmentSupport: boolean; // 分割辅助
  showConfirm?: boolean;
  panopticModel: string; // 分割模型
}
