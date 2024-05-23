import { edgeAdsorptionScope, ELineTypes, EToolName } from '@/constant/tool';
import RectUtils from '@/utils/tool/RectUtils';
import PolygonUtils from '@/utils/tool/PolygonUtils';
import MarkerUtils from '@/utils/tool/MarkerUtils';
import MathUtils from '@/utils/MathUtils';
import type { IPointToolConfig, IPointUnit } from '@/types/tool/pointTool';
import type { ICoordinate } from '@/types/tool/common';

import { DEFAULT_TEXT_OFFSET, EDragStatus } from '../../constant/annotation';
import EKeyCode from '../../constant/keyCode';
import locale from '../../locales';
import { EMessage } from '../../locales/constants';
import type { IPolygonData } from '../../types/tool/polygon';
import AttributeUtils from '../../utils/tool/AttributeUtils';
import AxisUtils from '../../utils/tool/AxisUtils';
import CommonToolUtils from '../../utils/tool/CommonToolUtils';
import DrawUtils from '../../utils/tool/DrawUtils';
import uuid from '../../utils/uuid';
import type { IBasicToolOperationProps } from './basicToolOperation';
import BasicToolOperation from './basicToolOperation';

const TEXTAREA_WIDTH = 200;

export interface IPointOperationProps extends IBasicToolOperationProps {
  style: any;
}
export default class PointOperation extends BasicToolOperation {
  public config: IPointToolConfig;

  // 正在标的点

  public pointList: IPointUnit[];

  // 具体操作
  public hoverID?: string; // hover 到其中一个点上 会有hoverID

  public selectedID?: string;

  public markerIndex: number; // 用于列表标签定位

  constructor(props: IPointOperationProps) {
    super(props);
    this.config = CommonToolUtils.jsonParser(props.config);
    this.pointList = [];
    this.markerIndex = 0;

    this.setStyle(props.style);

    this.createPoint = this.createPoint.bind(this);
    this.getCurrentSelectedData = this.getCurrentSelectedData.bind(this);
    this.setSelectedID = this.setSelectedID.bind(this);
  }

  get dataList() {
    return this.pointList;
  }

  get drawOutsideTarget() {
    // 兼容旧的目标外标注
    return this.config.drawOutsideTarget ?? this.config.drawPointOut;
  }

  /**
   * 向外部提供标记的更改
   * @param markerIndex
   */
  public setMarkerIndex = (markerIndex: number) => {
    this.markerIndex = markerIndex;
  };

  /**
   * 更改当前列表标注位置，并且设置为选中
   * @param markerIndex
   * @returns
   */
  public setMarkerIndexAndSelect = (markerIndex: number) => {
    if (!this.config.markerList) {
      return;
    }

    this.markerIndex = markerIndex;
    const markerValue = this.config.markerList[markerIndex].value;

    const currentPoint = this.currentPageResult.find((point) => point.label === markerValue);

    if (currentPoint) {
      this.setSelectedID(currentPoint.id);
      if (this.config.attributeConfigurable === true) {
        this.setDefaultAttribute(currentPoint.attribute);
      }
    }
    this.emit('markIndexChange');
  };

  /**
   * 设置下一个列表选择器
   * @param pointList
   */
  public setNextMarker(pointList = this.pointList) {
    if (this.hasMarkerConfig) {
      const nextMarkerInfo = CommonToolUtils.getNextMarker(
        this.getCurrentPageResult(pointList),
        this.config.markerList,
      );
      if (nextMarkerInfo) {
        this.setMarkerIndexAndSelect(nextMarkerInfo.index);
      }
    }
  }

  public setResult(pointList: IPointUnit[]) {
    this.clearActiveStatus();
    this.setPointList(pointList);
    this.setNextMarker(pointList);
    this.render();
  }

  /**
   * 设置当前的结果集
   * @param rectList
   * @param isUpload
   */
  public setPointList(pointList: IPointUnit[], isUpload = false) {
    const oldLen = this.pointList.length;
    this.pointList = pointList;

    if (oldLen !== pointList.length) {
      // 件数发生改变
      this.emit('updatePageNumber');
    }

    if (isUpload) {
      // 为了兼容外层实时同步数据 - （估计后面会干掉）
      this.emit('updateResult');
    }
  }

  // @ts-ignore
  public setConfig(config: IPointToolConfig, isClear = false) {
    this.config = CommonToolUtils.jsonParser(config);
    if (isClear === true) {
      this.clearResult();
    }
  }

  // 全局操作
  public clearResult() {
    this.setPointList([]);
    this.setSelectedID(undefined);
    this.history.pushHistory([]);

    this.hoverID = '';
    this.render();
  }

  public setDefaultAttribute(defaultAttribute: string = '') {
    const oldDefault = this.defaultAttribute;

    if (!this.hasAttributeInConfig(defaultAttribute)) {
      return;
    }

    this.defaultAttribute = defaultAttribute;

    if (oldDefault !== defaultAttribute) {
      // 如果更改 attribute 需要同步更改 style 的样式
      this.changeStyle(defaultAttribute);

      //  触发侧边栏同步
      this.emit('changeAttributeSidebar');
      this.container.dispatchEvent(this.saveDataEvent);

      // 如有选中目标，则需更改当前选中的属性
      const { selectedID } = this;
      if (selectedID) {
        this.pointList.forEach((point) => {
          if (point.id === selectedID) {
            point.attribute = defaultAttribute;
          }
        });
        this.history.pushHistory(this.pointList);
        this.render();
      }
    }
  }

  /**
   * 外层 sidabr 调用
   * @param v
   * @returns
   */
  public textChange = (v: string) => {
    if (this.config.textConfigurable !== true || !this.selectedID) {
      return;
    }

    this.setPointList(AttributeUtils.textChange(v, this.selectedID, this.pointList));
    this.emit('selectedChange'); // 触发外层的更新
    this.render();
  };

  public get selectedText() {
    const selectedResult = this.pointList.find((i) => i.id === this.selectedID);

    if (!selectedResult) {
      return '';
    }

    return this.getStringAttributes(selectedResult, EToolName.Point);
  }

  public setStyle(toolStyle: any) {
    super.setStyle(toolStyle);
  }

  public setSelectedID(newID?: string) {
    this.selectedID = newID;

    this.render();
    this.emit('selectedChange');
  }

  /**
   * 获取当前配置下的 icon svg
   * @param attribute
   */
  public getTextIconSvg(attribute = '') {
    return AttributeUtils.getTextIconSvg(
      attribute,
      this.config?.attributeList,
      this.config.attributeConfigurable,
      this.baseIcon,
    );
  }

  /**
   *  清除所有的中间状态
   */
  public clearActiveStatus() {
    this.hoverID = undefined;
    this.dragStatus = EDragStatus.Wait;
    this.setSelectedID(undefined);
  }

  // 修改为不依赖,考虑删除 todo
  public setBasicResult(basicResult: any) {
    super.setBasicResult(basicResult);
    this.setNextMarker();

    this.clearActiveStatus();
  }

  public onMouseDown(e: MouseEvent) {
    if (super.onMouseDown(e) || this.forbidMouseOperation) {
      return;
    }

    // 当前目标下没有 hoverId 才进行标注
    if (e.button === 0 && !this.hoverID) {
      // 超出边界则不绘制
      if (
        !this.imgInfo ||
        (!this.drawOutsideTarget && this.isPointOutOfBoundary(this.getCoordinateUnderZoom(e), { x: 0, y: 0 }))
      ) {
        return;
      }

      this.createPoint(e);
      this.render();
      this.container.dispatchEvent(this.saveDataEvent);

      return;
    }
    // 有选中的点时 才能进行拖拽
    if (this.hoverID === this.selectedID && e.button === 0) {
      this.dragStatus = EDragStatus.Start;
    }

    if (e.button === 2) {
      this.selectPoint();
    }

    this.render();
    return true;
  }

  public onMouseMove(e: MouseEvent) {
    if (super.onMouseMove(e) || this.forbidMouseOperation || !this.imgInfo) {
      return;
    }
    this.hoverID = this.getHoverId();
    // 拖拽中
    if (this.dragStatus === EDragStatus.Start || this.dragStatus === EDragStatus.Move) {
      this.onDragMove(e);
    }

    // 鼠标划过 需要改变颜色
    if (this.hoverID) {
      this.render();
    }
    return undefined;
  }

  public onMouseUp(e: MouseEvent) {
    if (super.onMouseUp(e) || this.forbidMouseOperation || !this.imgInfo) {
      return true;
    }
    // 拖拽停止
    if (this.dragStatus === EDragStatus.Move) {
      this.history.pushHistory(this.pointList);
    }
    this.dragStatus = EDragStatus.Wait;
    this.render();
  }

  public onDragMove(e: MouseEvent) {
    if (!this.imgInfo) return;
    this.dragStatus = EDragStatus.Move;
    const coordinateZoom = this.getCoordinateUnderZoom(e);
    // 缩放后的坐标
    const zoomCoordinate = AxisUtils.changeDrawOutsideTarget(
      coordinateZoom,
      { x: 0, y: 0 },
      this.imgInfo,
      this.drawOutsideTarget,
      this.basicResult,
      this.zoom,
    );
    const coordinate = this.drawOutsideTarget
      ? AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos) // 正常的坐标
      : AxisUtils.changePointByZoom(zoomCoordinate, 1 / this.zoom); // 恢复正常的坐标

    // 边缘判断
    if (this.drawOutsideTarget === false) {
      if (
        this.dependToolName === EToolName.Polygon &&
        this.basicResult?.pointList?.length > 0 &&
        !PolygonUtils.isInPolygon(coordinate, this.basicResult.pointList)
      ) {
        return;
      }
    }

    this.pointList.forEach((point) => {
      if (point.id === this.selectedID) {
        point.x = coordinate.x;
        point.y = coordinate.y;
      }
    });
    this.render();
  }

  public onKeyDown(e: KeyboardEvent) {
    if (!CommonToolUtils.hotkeyFilter(e)) {
      // 如果为输入框则进行过滤
      return;
    }

    if (super.onKeyDown(e) === false) {
      return;
    }

    const { keyCode } = e;
    switch (keyCode) {
      case EKeyCode.Delete:
      case EKeyCode.BackSpace:
        this.deletePoint();
        break;
      // case EKeyCode.Z:
      //   this.setIsHidden(!this.isHidden);
      //   this.render();
      //   break;
      default: {
        break;
      }
    }
  }

  // 点之间的距离不能小于0.2px
  public isMinDistance = (coord: ICoordinate) => {
    const transformCoord = AxisUtils.changePointByZoom(coord, this.zoom);
    return this.pointList.some((point) => {
      const transformPoint = AxisUtils.changePointByZoom(point, this.zoom);
      return MathUtils.getLineLength(transformPoint, transformCoord) < 0.2;
    });
  };

  public createPoint(e: MouseEvent) {
    if (!this.imgInfo) return;
    const { upperLimit } = this.config;
    if (upperLimit && this.currentPageResult.length >= upperLimit && this.pointList.length >= upperLimit) {
      // 小于对应的下限点, 大于上限点无法添加
      this.emit('messageInfo', `${locale.getMessagesByLocale(EMessage.LowerLimitPoint, this.lang)}`);
      return;
    }

    const basicSourceID = CommonToolUtils.getSourceID(this.basicResult);
    const coordinateZoom = this.getCoordinateUnderZoom(e);
    let coordinate = AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos);

    if (this.config.edgeAdsorption && this.referenceData) {
      const isAllowEdgeAdsoption = [EToolName.Polygon, EToolName.Line].includes(this.referenceData?.toolName);

      // Currently only available for PolygonTool and LineTool
      if (isAllowEdgeAdsoption) {
        const isClose = this.referenceData?.toolName === EToolName.Polygon;

        const { dropFoot, hasClosed } = PolygonUtils.getClosestPoint(
          coordinate,
          this.referenceData.result as IPolygonData[],
          this.referenceData.config?.lineType ?? ELineTypes.Line,
          edgeAdsorptionScope / this.zoom,
          { isClose },
        );
        if (dropFoot) {
          coordinate = dropFoot;
        }
        if (hasClosed) {
          this.emit('messageSuccess', `${locale.getMessagesByLocale(EMessage.SuccessfulEdgeAdsorption, this.lang)}`);
        }
      }
    }

    // 边缘判断
    if (this.drawOutsideTarget === false) {
      if (this.dependToolName && this.basicCanvas) {
        let isOutSide = false;
        switch (this.dependToolName) {
          case EToolName.Rect: {
            // 依赖拉框
            isOutSide = !RectUtils.isInRect(coordinate, this.basicResult);
            break;
          }
          // 依赖多边型
          case EToolName.Polygon: {
            isOutSide = !PolygonUtils.isInPolygon(coordinate, this.basicResult.pointList);
            break;
          }
          default: {
            //
          }
        }

        if (isOutSide) {
          // 在边界外直接跳出
          return;
        }
      }

      if (
        coordinateZoom.x < 0 ||
        coordinateZoom.y < 0 ||
        coordinateZoom.x > this.imgInfo.width ||
        coordinateZoom.y > this.imgInfo.height
      ) {
        return;
      }
    }

    if (this.isMinDistance(coordinate)) {
      return;
    }

    let newDrawingPoint = {
      ...coordinate,
      isVisible: true,
      attribute: this.defaultAttribute,
      valid: !e.ctrlKey,
      id: uuid(8, 62),
      sourceID: basicSourceID,
      textAttribute: '',
      order:
        // CommonToolUtils.getMaxOrder(
        //   this.pointList.filter((v) => CommonToolUtils.isSameSourceID(v.sourceID, basicSourceID)),
        // ) + 1,
        CommonToolUtils.getAllToolsMaxOrder(this.pointList, this.prevResultList) + 1,
    } as IPointUnit;

    if (this.hasMarkerConfig) {
      const nextMarkInfo = CommonToolUtils.getNextMarker(
        this.currentPageResult,
        this.config.markerList,
        this.markerIndex,
      );

      if (nextMarkInfo) {
        newDrawingPoint = {
          ...newDrawingPoint,
          label: nextMarkInfo.label,
        };
        this.markerIndex = nextMarkInfo.index;
        this.emit('markIndexChange');
      } else {
        // 不存在则不允许创建新的
        this.emit('messageInfo', locale.getMessagesByLocale(EMessage.MarkerFinish, this.lang));
        return;
      }
    }

    this.hoverID = newDrawingPoint.id;
    const newPointList = [...this.pointList, newDrawingPoint];
    this.setPointList(newPointList);
    this.history.pushHistory(newPointList);
    this.setSelectedID(newDrawingPoint.id);
    this.emit('drawEnd', newDrawingPoint, e);
  }

  // 判断是是否在标点范围内
  public isInPoint(pos: ICoordinate, point: ICoordinate, zoom: number = this.zoom) {
    // 加上边框 2px
    return (this.style.width + 2) / zoom >= Math.sqrt((pos.x - point.x) ** 2 + (pos.y - point.y) ** 2);
  }

  public getHoverId() {
    // 获取鼠标的坐标点
    const pos = AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos);
    const selectPoint = this.pointList?.find((print) => this.isInPoint(pos, print));
    return selectPoint?.id;
  }

  public selectPoint() {
    // 选中操作
    const hoverPoint = this.pointList.find((point) => point.id === this.hoverID);
    this.setSelectedID(this.hoverID);
    this.setDefaultAttribute(hoverPoint?.attribute);

    if (hoverPoint?.label && this.hasMarkerConfig) {
      const markerIndex = CommonToolUtils.getCurrentMarkerIndex(hoverPoint.label, this.config.markerList);
      if (markerIndex >= 0) {
        this.setMarkerIndex(markerIndex);
        this.emit('markIndexChange');
      }
    }
    this.container.dispatchEvent(this.saveDataEvent);
  }

  /**
   * 当前依赖状态下本页的所有的点
   *
   * @readonly
   * @memberof RectOperation
   */
  public get currentPageResult() {
    const [showingPolygon] = CommonToolUtils.getRenderResultList<IPointUnit>(
      this.pointList,
      CommonToolUtils.getSourceID(this.basicResult),
      [],
    );
    return showingPolygon;
  }

  /**
   * 当前依赖状态下本页的所有框
   *
   * @readonly
   * @memberof RectOperation
   */
  public getCurrentPageResult(pointList: IPointUnit[]) {
    const [showingRect] = CommonToolUtils.getRenderResultList<IPointUnit>(
      pointList,
      CommonToolUtils.getSourceID(this.basicResult),
      [],
    );
    return showingRect;
  }

  /**
   * 导出结果
   */
  public exportData(): any[] {
    const { pointList } = this;

    return [pointList, this.basicImgInfo];
  }

  public deletePoint() {
    if (this.selectedID) {
      this.setPointList(this.pointList.filter((point) => point.id !== this.selectedID));
      this.history.pushHistory(this.pointList);
      this.emit('selectedChange');
      this.render();
      this.container.dispatchEvent(this.saveDataEvent);
    }
  }

  /** 撤销 和  重做 */
  public undoAndRedo(name: 'undo' | 'redo') {
    // 拖拽中 禁止撤销
    if (this.dragStatus === EDragStatus.Move || this.dragStatus === EDragStatus.Start) {
      return;
    }
    const rectList = this.history[name]?.() as IPointUnit[];

    // 当没有选中的id时 清空选中的id
    if (!rectList?.some((point) => point.id === this.selectedID)) {
      this.setSelectedID('');
    }
    if (rectList) {
      this.setPointList(rectList, true);
      this.render();
    }
  }

  /** 撤销 */
  public undo() {
    this.undoAndRedo('undo');
  }

  /** 重做 */
  public redo() {
    this.undoAndRedo('redo');
  }

  public getCurrentSelectedData() {
    if (!this.selectedID) return;
    // 后面这里可以用传参的形式 不用在重新过滤了
    const point = this.pointList?.find((item) => item.id === this.selectedID);
    const toolStyle = this.getRenderStyle(point?.attribute, point?.valid);
    const color = toolStyle.stroke;
    this.dragStatus = EDragStatus.Wait;
    return {
      width: TEXTAREA_WIDTH * this.zoom * 0.6,
      textAttribute: this.selectedText,
      color,
    };
  }

  /**
   * 绘制标点
   */
  public renderPoint(point: IPointUnit) {
    if (!point.isVisible) {
      return;
    }
    const { attribute } = point;
    const selected = point.id === this.selectedID;
    const hovered = point.id === this.hoverID;
    const toolColor = this.getColor(attribute, this.config, EToolName.Point);

    const transformPoint = AxisUtils.changePointByZoom(point, this.zoom, this.currentPos);
    const { width = 2, hiddenText = false } = this.style;

    const toolData = this.getRenderStyle(point.attribute, point.valid, {
      isSelected: selected || hovered,
      color: toolColor,
    });

    // 绘制点
    DrawUtils.drawCircle(this.canvas, transformPoint, width, {
      startAngleDeg: 0,
      endAngleDeg: 360,
      thickness: 1,
      color: toolData.stroke,
      // Fix: https://project.feishu.cn/bigdata_03/issue/detail/4174573?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
      fill: selected || hovered ? '#fff' : 'transparent',
    });

    let showText = '';

    const isShowOrder = this.isShowOrder;

    if (isShowOrder && point.order && point?.order > 0) {
      showText = `${point.order}`;
    }

    if (point.label && this.hasMarkerConfig) {
      // const order = CommonToolUtils.getCurrentMarkerIndex(point.label, this.config.markerList) + 1;
      const order = CommonToolUtils.getAllToolsMaxOrder(this.pointList, this.prevResultList) + 1;

      showText = `${order}_${MarkerUtils.getMarkerShowText(point.label, this.config.markerList)}`;
    }

    if (point.attribute) {
      showText = `${showText} ${this.getAttributeKey(point.attribute)}`;
    }

    // 上方属性（列表、序号）
    if (!hiddenText) {
      DrawUtils.drawText(this.canvas, { x: transformPoint.x + width / 2, y: transformPoint.y - width - 4 }, showText, {
        textAlign: 'center',
        color: toolData.stroke,
      });
    }

    // 文本
    if (selected) {
    } else if (!hiddenText && this.isShowAttributeText) {
      DrawUtils.drawText(
        this.canvas,
        { x: transformPoint.x + width, y: transformPoint.y + width + 24 },
        this.getStringAttributes(point, EToolName.Point),
        {
          color: toolData.stroke,
          ...DEFAULT_TEXT_OFFSET,
        },
      );
    }
  }

  public renderPointList() {
    const [showingPointList, selectedPoint] = CommonToolUtils.getRenderResultList<IPointUnit>(
      this.pointList,
      CommonToolUtils.getSourceID(this.basicResult),
      this.attributeLockList,
      this.selectedID,
    );
    if (!this.isHidden) {
      showingPointList.forEach((point) => {
        this.renderPoint(point);
      });
    }

    if (selectedPoint) {
      this.renderPoint(selectedPoint);
    }
  }

  /**
   * 顶层渲染图标
   */
  public renderTop() {
    const color = this.getLineColor(this.defaultAttribute);
    this.renderCursorLine(color);

    if (this.config.edgeAdsorption && this.referenceData) {
      let coordinate = AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos);
      const isClose = this.referenceData?.toolName === EToolName.Polygon;

      const { dropFoot } = PolygonUtils.getClosestPoint(
        coordinate,
        this.referenceData.result as IPolygonData[],
        this.referenceData.config?.lineType ?? ELineTypes.Line,
        edgeAdsorptionScope / this.zoom,
        {
          isClose,
        },
      );
      if (dropFoot && coordinate !== dropFoot) {
        if (coordinate !== dropFoot) {
          coordinate = dropFoot;
          DrawUtils.drawCircle(this.canvas, AxisUtils.changePointByZoom(coordinate, this.zoom, this.currentPos), 5, {
            color: 'white',
            fill: 'white',
          });
          DrawUtils.drawCircle(this.canvas, AxisUtils.changePointByZoom(coordinate, this.zoom, this.currentPos), 3, {
            fill: color,
            color,
          });
        }
      }
    }
  }

  public render() {
    if (!this.ctx || !this.renderReady) {
      return;
    }
    super.render();
    this.renderPointList();
    this.renderTop();
  }
}
