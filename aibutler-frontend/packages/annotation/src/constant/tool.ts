// 编辑步骤的侧边栏宽度
export const editStepWidth = 320;

export type ToolNameType =
  | `rectTool`
  | `tagTool`
  | `polygonTool`
  | `pointTool`
  | `textTool`
  | `lineTool`
  | `videoTagTool`;

export enum EPointCloudName {
  /** 点云工具 */
  PointCloud = 'pointCloudTool',
}

export enum EVideoToolName {
  /** 视频截取工具 */
  VideoSegmentTool = 'videoSegmentTool',
  /** 视频帧工具 */
  VideoFrameTool = 'videoFrameTool',
}

export enum EAudioToolName {
  /** 视频截取工具 */
  AudioSegmentTool = 'audioSegmentTool',
  /** 视频帧工具 */
  AudioFrameTool = 'audioFrameTool',
}

/** 新：工具type */
export enum EToolType {
  Rect = 0,
  Tag = 1,
}

export enum EToolName {
  /** 拉框工具 */
  Rect = 'rectTool',
  /** 标签工具 */
  Tag = 'tagTool',
  /** 标点工具 */
  Point = 'pointTool',
  /** 列表标点工具 */
  PointMarker = 'pointMarkerTool',
  /** 前景分割工具 */
  Segmentation = 'segmentationTool',
  /** 筛选工具 */
  Filter = 'filterTool',
  /** 文本工具 */
  Text = 'textTool',
  /** 多边形工具 */
  Polygon = 'polygonTool',
  /** 线条 */
  Line = 'lineTool',
  /** 列表线条工具 */
  LineMarker = 'lineMarkerTool',
  /** 空工具，表示当前没有选择的工具，没有实际的业务逻辑 */
  Empty = 'emptyTool',
  /** 文件夹标签工具 */
  FolderTag = 'folderTagTool',
  /** 拉框跟踪工具 */
  RectTrack = 'rectTrackTool',
  /** 人脸106工具 */
  Face = 'faceTool',
  /** 客户端属性工具 */
  ClientAttribute = 'clientAttributeTool',
  /** OCR关联关系工具 */
  OCRRelation = 'OCRRelationTool',
}

export enum ECheckModel {
  Check = 'check',
}

export enum ERectPattern {
  'nothing',
  'RectBG',
  'showOrder',
}

export type ToolName = EToolName | EVideoToolName | EPointCloudName;

export const TOOL_NAME: Record<string, string> = {
  [EToolName.Rect]: '拉框',
  [EToolName.Tag]: '标签分类',
  [EToolName.Point]: '标点',
  [EToolName.PointMarker]: '列表标点',
  [EToolName.Segmentation]: '前景分割',
  [EToolName.Filter]: '筛选',
  [EToolName.Text]: '文本描述',
  [EToolName.Polygon]: '多边形',
  [EToolName.Line]: '标线',
  [EToolName.LineMarker]: '列表线条',
  [EToolName.FolderTag]: '文件夹标签',
  [EToolName.RectTrack]: '拉框跟踪',
  [EToolName.Face]: '人脸106工具',
  [EToolName.ClientAttribute]: '客户端属性工具',
  [EToolName.OCRRelation]: 'OCR关联关系工具',
  [EVideoToolName.VideoSegmentTool]: '片断分割',
  [EVideoToolName.VideoFrameTool]: '时间戳',
  [EAudioToolName.AudioSegmentTool]: '片断分割',
  [EAudioToolName.AudioFrameTool]: '时间戳',
  [EPointCloudName.PointCloud]: '点云',
};

export enum EDependPattern {
  'noDepend' = 1, // 无依赖对象
  'dependOrigin', // 依赖原题
  'dependShape', // 依赖框体
  'dependLine', // 依赖线条
  'dependPolygon', // 依赖多边形
  'dependPreShape' = 101, // 依赖预标注
  'dependPreLine' = 102, // 依赖预标注线条
  'dependPrePolygon' = 103, // 依赖预标注多边形
}

export enum EFilterToolOperation {
  lc = 'leftClick',
  rc = 'rightClick',
  clc = 'ctrlLeftClick',
  crc = 'ctrlRightClick',
}

export const OPERATION_LIST = {
  leftClick: '鼠标左键',
  rightClick: '鼠标右键',
  ctrlLeftClick: 'ctrl + 鼠标左键',
  ctrlRightClick: 'ctrl + 鼠标右键',
};

/** 标注模式 */
export enum EAnnotationMode {
  /** 正常标注 */
  Normal = 1,
  /** 修改标注 */
  Modify,
}

/** 线条类型 */
export enum ELineTypes {
  Line,
  Curve,
}

/** 线条颜色 */
export enum ELineColor {
  SingleColor,
  MultiColor,
}

export enum ESelectedType {
  Form = 1, // 表单模式
  Json, // json 模式
}

export enum EDragTarget {
  Point,
  Line,
  Plane,
}

// 多边形绘制点的形式
export enum EDrawPointPattern {
  None, // 不绘制
  Drawing, // 绘制中， 最后一个点不绘制
  Edit, // 全部进行绘制
}

export enum EPageOperator {
  Backward,
  Forward,
  JumpSkip,
  None,
}

export enum EAuditStatus {
  Wait,
  Pass,
  Fail,
  Loading,
}

// 文本标注类型
export enum ETextType {
  AnyString, // 任意字符
  Order, // 序号
  EnglishOnly, // 仅英文
  NumberOnly, // 仅数字
  CustomFormat, // 自定义文本格式
}

export const TEXT_TYPE = {
  0: '任意字符',
  1: '序号',
  2: '仅英文',
  3: '仅数字',
  // 4: '自定义文本格式',
};

/** 文本标注字数上限 */
export const TEXT_ATTRIBUTE_MAX_LENGTH = 1000;

/** 文本标注的文本高度 */
export const TEXT_ATTRIBUTE_LINE_HEIGHT = 16;

/** 文本默认的最大宽度 */
export const DEFAULT_TEXT_MAX_WIDTH = 300;

export const DEFAULT_FONT = 'normal normal 500 14px Arial';

/** 缩略图下的模式 */
export enum EThumbnailOption {
  ImgList = 1000,
  TrackPrediction,
  ImgSearch,
}

/** 曲线分割点数 */
export const SEGMENT_NUMBER = 16;

// 边缘吸附的延伸范围
export const edgeAdsorptionScope = 10;

/**
 * 多边形的标注模式
 */
export enum EPolygonPattern {
  Normal,
  Rect,
}
