// @ts-ignore
import { i18n } from '@labelu/utils';

import MathUtils from '@/utils/MathUtils';
import RectUtils from '@/utils/tool/RectUtils';
import type { ICoordinate } from '@/types/tool/common';
import type { IRect } from '@/types/tool/rectTool';

import {
  DEFAULT_TEXT_OFFSET,
  EDragStatus,
  EDragTarget,
  ERotateDirection,
  TEXT_ATTRIBUTE_OFFSET,
} from '../../constant/annotation';
import EKeyCode from '../../constant/keyCode';
import { edgeAdsorptionScope, ELineTypes, EPolygonPattern, EToolName } from '../../constant/tool';
import locale from '../../locales';
import { EMessage } from '../../locales/constants';
import type { IPolygonConfig, IPolygonData, IPolygonPoint } from '../../types/tool/polygon';
import ActionsHistory from '../../utils/ActionsHistory';
import AttributeUtils from '../../utils/tool/AttributeUtils';
import AxisUtils from '../../utils/tool/AxisUtils';
import CommonToolUtils from '../../utils/tool/CommonToolUtils';
import DrawUtils from '../../utils/tool/DrawUtils';
import PolygonUtils from '../../utils/tool/PolygonUtils';
import uuid from '../../utils/uuid';
import type { IBasicToolOperationProps } from './basicToolOperation';
import BasicToolOperation from './basicToolOperation';

const TEXT_MAX_WIDTH = 164;

type IPolygonOperationProps = IBasicToolOperationProps;

export default class PolygonOperation extends BasicToolOperation {
  public config: IPolygonConfig;

  // RENDER
  public drawingPointList: IPolygonPoint[]; // 正在绘制的多边形，在 zoom 底下

  public polygonList: IPolygonData[];

  public hoverID?: string;

  public hoverPointIndex: number;

  public hoverEdgeIndex: number;

  public selectedID?: string;

  public editPolygonID?: string; // 是否进入编辑模式

  public pattern: EPolygonPattern; // 当前多边形标注形式

  public isCombined: boolean; // 是否开启合并操作

  private dragInfo?: {
    dragStartCoord: ICoordinate;
    initPointList: IPolygonPoint[];
    changePointIndex?: number[]; // 用于存储拖拽点 / 边的下标
    dragTarget: EDragTarget;
  };

  private drawingHistory: ActionsHistory; // 用于正在编辑中的历史记录

  private isCtrl: boolean; // 当前的是否按住了 ctrl

  private isAlt: boolean; // 当前是否按住了 alt

  constructor(props: IPolygonOperationProps) {
    super(props);
    this.config = CommonToolUtils.jsonParser(props.config);
    this.drawingPointList = [];
    this.polygonList = [];
    this.hoverPointIndex = -1;
    this.hoverEdgeIndex = -1;

    this.drawingHistory = new ActionsHistory();
    this.isCtrl = false;
    this.isAlt = false;
    this.isCombined = false;
    this.pattern = EPolygonPattern.Normal;

    this.getCurrentSelectedData = this.getCurrentSelectedData.bind(this);

    // esc取消绘制
    this.on('cancel', () => {
      if (this.drawingPointList.length > 0) {
        this.addDrawingPointToPolygonList(false);
        // this.container.dispatchEvent(this.saveDataEvent);
      }
    });
  }

  public eventBinding() {
    super.eventBinding();
    // 解绑原本的 onMouseUp，将 onMoueUp 用于 dblClickListener ß进行绑定
    this.container.removeEventListener('mouseup', this.onMouseUp);

    this.container.addEventListener('mouseup', this.dragMouseUp);
    this.dblClickListener.addEvent(this.onMouseUp, undefined, undefined, () => false);
  }

  public eventUnbinding() {
    super.eventUnbinding();
    this.container.removeEventListener('mouseup', this.dragMouseUp);
  }

  public destroy() {
    super.destroy();
  }

  public get selectedPolygon() {
    return PolygonUtils.getPolygonByID(this.polygonList, this.selectedID);
  }

  public get polygonListUnderZoom() {
    return this.polygonList.map((polygon) => ({
      ...polygon,
      pointList: AxisUtils.changePointListByZoom(polygon.pointList, this.zoom),
    }));
  }

  public get selectedText() {
    const selectedResult = this.dataList.find((i) => i.id === this.selectedID);

    if (!selectedResult) {
      return '';
    }

    return this.getStringAttributes(selectedResult, EToolName.Polygon);
  }

  public get dataList() {
    return this.polygonList;
  }

  // 更改当前标注模式
  public setPattern(pattern: EPolygonPattern) {
    if (this.drawingPointList?.length > 0) {
      // 编辑中不允许直接跳出
      return;
    }

    this.pattern = pattern;
  }

  /**
   * 当前页面展示的框体
   */
  public get currentShowList() {
    let polygon: IPolygonData[] = [];
    const [showingPolygon, selectdPolygon] = CommonToolUtils.getRenderResultList<IPolygonData>(
      this.polygonList,
      CommonToolUtils.getSourceID(this.basicResult),
      this.attributeLockList,
      this.selectedID,
    );
    polygon = showingPolygon;

    if (this.isHidden) {
      polygon = [];
    }

    if (selectdPolygon) {
      polygon.push(selectdPolygon);
    }
    return polygon;
  }

  /**
   * 当前依赖状态下本页的所有框
   *
   * @readonly
   * @memberof RectOperation
   */
  public get currentPageResult() {
    const [showingPolygon] = CommonToolUtils.getRenderResultList<IPolygonData>(
      this.polygonList,
      CommonToolUtils.getSourceID(this.basicResult),
      [],
    );
    return showingPolygon;
  }

  public setResult(polygonList: IPolygonData[]) {
    this.clearActiveStatus();
    this.setPolygonList(polygonList);
    this.render();
  }

  /**
   * 外层 sidabr 调用
   * @param v
   * @returns
   */
  public textChange = (v: string) => {
    if (this.config.textConfigurable === false || !this.selectedID) {
      return;
    }
    this.setPolygonList(AttributeUtils.textChange(v, this.selectedID, this.polygonList));
    this.emit('selectedChange'); // 触发外层的更新
    this.render();
  };

  /**
   * 设定指定多边形的信息
   * @param id
   * @param newPolygonData
   * @returns
   */
  public setPolygonDataByID(newPolygonData: Partial<IPolygonData>, id?: string) {
    return this.polygonList.map((polygon) => {
      if (polygon.id === id) {
        return {
          ...polygon,
          ...newPolygonData,
        };
      }
      return polygon;
    });
  }

  public rotatePolygon(angle: number = 1, direction = ERotateDirection.Clockwise, selectedID = this.selectedID) {
    if (!selectedID) {
      return;
    }

    const selectedPolygon = PolygonUtils.getPolygonByID(this.polygonList, selectedID);

    if (!selectedPolygon) {
      return;
    }

    const rotatePointList = PolygonUtils.updatePolygonByRotate(direction, angle, selectedPolygon?.pointList);

    this.setPolygonList(this.setPolygonDataByID({ pointList: rotatePointList }, selectedID));
    this.render();
  }

  public addPointInDrawing(e: MouseEvent) {
    if (!this.imgInfo) {
      return;
    }

    const { upperLimitPointNum, edgeAdsorption } = this.config;
    if (upperLimitPointNum && this.drawingPointList.length >= upperLimitPointNum) {
      // 小于对应的下限点, 大于上限点无法添加
      this.emit(
        'messageInfo',
        `${locale.getMessagesByLocale(EMessage.UpperLimitErrorNotice, this.lang)}${upperLimitPointNum}`,
      );

      return;
    }

    this.setSelectedID('');
    const coordinateZoom = this.getCoordinateUnderZoom(e);
    const coordinate = AxisUtils.changeDrawOutsideTarget(
      coordinateZoom,
      { x: 0, y: 0 },
      this.imgInfo,
      this.config.drawOutsideTarget,
      this.basicResult,
      this.zoom,
    );

    // 判断是否的初始点，是则进行闭合
    const calculateHoverPointIndex = AxisUtils.returnClosePointIndex(
      coordinate,
      AxisUtils.changePointListByZoom(this.drawingPointList, this.zoom),
    );
    if (calculateHoverPointIndex === 0) {
      this.addDrawingPointToPolygonList(false, e);
      return;
    }

    const { dropFoot } = PolygonUtils.getClosestPoint(
      coordinate,
      this.polygonListUnderZoom,
      this.config.lineType,
      edgeAdsorptionScope,
    );

    const coordinateWithOrigin = AxisUtils.changePointByZoom(
      dropFoot && e.altKey === false && edgeAdsorption ? dropFoot : coordinate,
      1 / this.zoom,
    );

    if (this.pattern === EPolygonPattern.Rect && this.drawingPointList.length === 2) {
      const rect = MathUtils.getRectangleByRightAngle(coordinateWithOrigin, this.drawingPointList);
      this.drawingPointList = rect;

      // 边缘判断 - 仅限支持图片下范围下
      if (this.config.drawOutsideTarget === false && this.imgInfo) {
        const isOutSide = this.isPolygonOutSide(this.drawingPointList);
        if (isOutSide) {
          // 边缘外直接跳出
          this.emit(
            'messageInfo',
            `${locale.getMessagesByLocale(EMessage.ForbiddenCreationOutsideBoundary, this.lang)}`,
          );
          this.drawingPointList = [];

          return;
        }
      }
      // 创建多边形
      this.addDrawingPointToPolygonList(true, e);
      return;
    }

    this.drawingPointList.push(coordinateWithOrigin);
    if (this.drawingPointList.length === 1) {
      this.drawingHistory.initRecord(this.drawingPointList);
    } else {
      this.drawingHistory.pushHistory(this.drawingPointList);
    }
  }

  // 全局操作
  public clearResult() {
    this.setPolygonList([]);
    this.setSelectedID(undefined);
    this.render();
  }

  /**
   *  清除多边形拖拽的中间状态
   */
  public clearPolygonDrag() {
    this.drawingPointList = [];
    this.dragInfo = undefined;
    this.dragInfo = undefined;
    this.dragStatus = EDragStatus.Wait;
    this.hoverEdgeIndex = -1;
    this.hoverPointIndex = -1;
    this.hoverID = '';
  }

  /**
   *  清楚所有的中间状态
   */
  public clearActiveStatus() {
    this.clearPolygonDrag();
    this.setSelectedID(undefined);
  }

  // SET DATA
  public setPolygonList(polygonList: IPolygonData[]) {
    const oldLen = this.polygonList.length;
    this.polygonList = polygonList;

    if (oldLen !== polygonList.length) {
      // 件数发生改变
      this.emit('updatePageNumber');
    }
  }

  public setSelectedID(newID?: string) {
    this.selectedID = newID;

    this.render();
    this.emit('selectedChange');
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

      // 如有选中目标，则需更改当前选中的属性
      const { selectedID } = this;
      if (selectedID) {
        if (this.selectedPolygon) {
          this.selectedPolygon.attribute = defaultAttribute;
        }
        this.history.pushHistory(this.polygonList);
        this.render();
      }
    }
  }

  public setStyle(toolStyle: any) {
    super.setStyle(toolStyle);
  }

  public setPolygonValidAndRender(id: string) {
    if (!id) {
      return;
    }

    const newPolygonList = this.polygonList.map((polygon) => {
      if (polygon.id === id) {
        return {
          ...polygon,
          valid: !polygon.valid,
        };
      }

      return polygon;
    });

    this.setPolygonList(newPolygonList);
    this.history.pushHistory(this.polygonList);
    this.render();

    // 同步外层
    this.emit('updateResult');
  }

  /**
   * 初始化的添加的数据
   * @returns
   */
  public addDrawingPointToPolygonList(isRect: boolean, e?: MouseEvent) {
    let { lowerLimitPointNum = 3 } = this.config;

    if (lowerLimitPointNum < 3) {
      lowerLimitPointNum = 3;
    }

    if (this.drawingPointList.length < lowerLimitPointNum) {
      // 小于下线点无法闭合, 直接清除数据
      this.drawingPointList = [];
      this.editPolygonID = '';

      return;
    }

    const basicSourceID = CommonToolUtils.getSourceID(this.basicResult);

    const polygonList = [...this.polygonList];
    if (this.editPolygonID) {
      const samePolygon = polygonList.find((polygon) => polygon.id === this.editPolygonID);
      if (!samePolygon) {
        return;
      }
      samePolygon.pointList = this.drawingPointList;
      this.editPolygonID = '';
    } else {
      const id = uuid(8, 62);
      let newPolygon: IPolygonData = {
        id,
        sourceID: basicSourceID,
        valid: !this.isCtrl,
        isVisible: true,
        pointList: this.drawingPointList,
        attribute: this.defaultAttribute,
        order: CommonToolUtils.getAllToolsMaxOrder(this.polygonList, this.prevResultList) + 1,
      };

      if (this.pattern === EPolygonPattern.Rect && isRect === true) {
        newPolygon = {
          ...newPolygon,
          isRect: true,
        };
      }

      polygonList.push(newPolygon);

      this.setSelectedIdAfterAddingDrawing(id);

      if (e) {
        this.emit('drawEnd', newPolygon, e);
      }
    }

    this.setPolygonList(polygonList);
    this.isCtrl = false;
    this.drawingPointList = [];

    this.history.pushHistory(polygonList);
  }

  public setSelectedIdAfterAddingDrawing(newID: string) {
    if (this.drawingPointList.length === 0) {
      return;
    }

    if (this.config.textConfigurable) {
      this.setSelectedID(newID);
    } else {
      this.setSelectedID();
    }
  }

  /**
   * 获取当前 hover 多边形的 ID
   * @param e
   * @returns
   */
  public getHoverID(e: MouseEvent) {
    const coordinate = this.getCoordinateUnderZoom(e);
    const polygonListWithZoom = this.currentShowList.map((polygon) => ({
      ...polygon,
      pointList: AxisUtils.changePointListByZoom(polygon.pointList, this.zoom),
    }));
    return PolygonUtils.getHoverPolygonID(coordinate, polygonListWithZoom, 10, this.config?.lineType);
  }

  public getHoverEdgeIndex(e: MouseEvent) {
    if (!this.selectedID) {
      return -1;
    }

    const selectPolygon = this.selectedPolygon;

    if (!selectPolygon) {
      return -1;
    }
    const currentCoord = this.getCoordinateUnderZoom(e);
    const editPointListUnderZoom = AxisUtils.changePointListByZoom(selectPolygon.pointList, this.zoom);
    return PolygonUtils.getHoverEdgeIndex(currentCoord, editPointListUnderZoom, this.config?.lineType);
  }

  public getHoverPointIndex(e: MouseEvent) {
    if (!this.selectedID) {
      return -1;
    }

    const selectPolygon = this.selectedPolygon;

    if (!selectPolygon) {
      return -1;
    }
    const currentCoord = this.getCoordinateUnderZoom(e);
    const editPointListUnderZoom = AxisUtils.changePointListByZoom(selectPolygon.pointList, this.zoom);
    return AxisUtils.returnClosePointIndex(currentCoord, editPointListUnderZoom);
  }

  public deletePolygon(id?: string) {
    if (!id) {
      return;
    }

    this.setPolygonList(this.polygonList.filter((polygon) => polygon.id !== id));
    this.history.pushHistory(this.polygonList);
    this.emit('selectedChange');
    this.render();
  }

  public deletePolygonPoint(index: number) {
    if (!this.selectedID) {
      return;
    }

    const { selectedPolygon } = this;

    if (!selectedPolygon) {
      return;
    }

    let { lowerLimitPointNum } = this.config;

    if (lowerLimitPointNum < 3) {
      lowerLimitPointNum = 3;
    }

    if (selectedPolygon.pointList.length <= lowerLimitPointNum) {
      this.emit(
        'messageInfo',
        `${locale.getMessagesByLocale(EMessage.LowerLimitErrorNotice, this.lang)}${lowerLimitPointNum}`,
      );
      return;
    }

    selectedPolygon?.pointList.splice(index, 1);
    this.history.pushHistory(this.polygonList);
    this.render();
  }

  // OPERATION

  public spaceKeydown() {
    // 续标检测
    if (this.selectedID) {
      // 矩形模式无法续标
      if (this.selectedPolygon?.isRect === true) {
        this.emit('messageInfo', `${locale.getMessagesByLocale(EMessage.UnableToReannotation, this.lang)}`);
        return;
      }

      this.editPolygonID = this.selectedID;
      this.drawingPointList = this.selectedPolygon?.pointList ?? [];
      this.drawingHistory.empty();
      this.drawingHistory.initRecord(this.drawingPointList);

      this.hoverID = '';
      this.setSelectedID('');
      this.render();
    }
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
      case EKeyCode.Space:
        this.spaceKeydown();
        break;

      case EKeyCode.Esc:
        this.drawingPointList = [];
        this.editPolygonID = '';

        break;

      case EKeyCode.F:
        if (this.selectedID) {
          this.setPolygonValidAndRender(this.selectedID);
        }

        break;

      // case EKeyCode.Z:
      //   if (e.altKey) {
      //     this.onCombinedExecute();
      //     return;
      //   }

      //   this.setIsHidden(!this.isHidden);
      //   this.render();
      //   break;

      case EKeyCode.Delete:
      case EKeyCode.BackSpace:
        this.dragInfo = undefined;
        this.clearImgDrag();

        if (this.hoverPointIndex > -1) {
          this.deletePolygonPoint(this.hoverPointIndex);
          this.dragInfo = undefined;
          this.hoverPointIndex = -1;
        } else {
          this.deletePolygon(this.selectedID);
        }
        this.render();
        this.container.dispatchEvent(this.saveDataEvent);
        break;

      case EKeyCode.Ctrl:
        this.isCtrl = true;
        break;

      case EKeyCode.Alt:
        if (this.isAlt === false) {
          e.preventDefault();
          this.isAlt = true;
          this.render();
        }

        break;

      case EKeyCode.X:
        if (e.altKey) {
          this.segment();
          // this.container.dispatchEvent(this.saveDataEvent);
        }
        break;

      default: {
        break;
      }
    }
  }

  public onKeyUp(e: KeyboardEvent) {
    super.onKeyUp(e);

    switch (e.keyCode) {
      case EKeyCode.Ctrl:
        this.isCtrl = false;
        break;

      case EKeyCode.Alt: {
        const oldAlt = this.isAlt;
        this.isAlt = false;
        if (oldAlt === true) {
          this.render();
        }
        break;
      }

      default: {
        break;
      }
    }
  }

  public rightMouseUp(e: MouseEvent) {
    // 标注中的数据结束
    if (this.drawingPointList.length > 0) {
      this.addDrawingPointToPolygonList(false, e);
      // this.container.dispatchEvent(this.saveDataEvent);
    }

    // 右键选中设置
    this.setSelectedID(this.hoverID);
    const { selectedPolygon } = this;
    if (selectedPolygon) {
      this.setDefaultAttribute(selectedPolygon.attribute);
    }
  }

  public insertPoint(e: MouseEvent) {
    if (this.hoverEdgeIndex > -1) {
      const currentCoord = this.getCoordinateUnderZoom(e);
      const { selectedPolygon } = this;
      if (!selectedPolygon) {
        return;
      }

      const { dropFoot } = PolygonUtils.getClosestPoint(
        currentCoord,
        this.polygonListUnderZoom,
        this.config.lineType,
        edgeAdsorptionScope,
      );

      if (!dropFoot) {
        return;
      }

      const { upperLimitPointNum } = this.config;
      if (upperLimitPointNum && selectedPolygon.pointList.length >= upperLimitPointNum) {
        // 小于对应的下限点, 大于上限点无法添加
        this.emit(
          'messageInfo',
          `${locale.getMessagesByLocale(EMessage.UpperLimitErrorNotice, this.lang)}${upperLimitPointNum}`,
        );
        this.clearPolygonDrag();
        return;
      }

      selectedPolygon?.pointList.splice(
        this.hoverEdgeIndex + 1,
        0,
        AxisUtils.changePointByZoom(dropFoot, 1 / this.zoom),
      );
      this.setPolygonDataByID(selectedPolygon, this.selectedID);
      this.history.pushHistory(this.polygonList);
      this.hoverPointIndex = -1;
      this.hoverEdgeIndex = -1;
      this.render();
    }
    this.dragInfo = undefined;
  }

  public onMouseDown(e: MouseEvent) {
    if (super.onMouseDown(e) || this.forbidMouseOperation || e.ctrlKey === true) {
      return;
    }

    const firstPolygon = this.selectedPolygon;

    if (!firstPolygon || e.button !== 0) {
      return;
    }
    const hoverID = this.getHoverID(e);

    if (hoverID !== this.selectedID) {
      // 无选中则无法进行拖拽，提前退出
      return;
    }

    const initPointList = firstPolygon.pointList;
    const dragStartCoord = this.getCoordinateUnderZoom(e);
    let changePointIndex = [0];

    let dragTarget = EDragTarget.Plane;
    this.dragStatus = EDragStatus.Start;

    const closePointIndex = this.getHoverPointIndex(e);
    const closeEdgeIndex = this.getHoverEdgeIndex(e);

    if (closePointIndex > -1) {
      dragTarget = EDragTarget.Point;
      changePointIndex = [closePointIndex];
    } else if (closeEdgeIndex > -1 && this.hoverEdgeIndex > -1) {
      dragTarget = EDragTarget.Line;
      changePointIndex = [closeEdgeIndex, (closeEdgeIndex + 1) % initPointList.length];
    }

    this.dragInfo = {
      dragStartCoord,
      dragTarget,
      initPointList,
      changePointIndex,
    };

    return true;
  }

  public segment() {
    // 如果没有选中多边形直接进行裁剪操作，直接跳出
    if (!this.selectedID) {
      return;
    }

    if (this.config?.lineType !== ELineTypes.Line) {
      return;
    }
    const selectedPointList = PolygonUtils.getPolygonPointList(this.selectedID, this.currentShowList);
    const backgroundPolygonList = this.currentShowList.filter((v) => v.id !== this.selectedID);

    if (backgroundPolygonList.length === 0 || selectedPointList.length === 0) {
      return;
    }

    // 需判断是否存在包裹
    const wrapIndex = PolygonUtils.getWrapPolygonIndex(selectedPointList, backgroundPolygonList);

    let newPolygonList = [...this.polygonList];

    if (wrapIndex === -1) {
      // 并不存在合并的问题
      const newPointListArray = PolygonUtils.segmentPolygonByPolygon(selectedPointList, backgroundPolygonList);

      if (!newPointListArray) {
        return;
      }
      const newPointList = newPointListArray.shift();

      if (!newPointList) {
        return;
      }

      let defaultAttribute = '';
      let valid = true;
      const sourceID = CommonToolUtils.getSourceID(this.basicResult);

      newPolygonList = this.polygonList.map((v) => {
        if (v.id === this.selectedID) {
          defaultAttribute = v.attribute;
          valid = v?.valid ?? true;
          return {
            ...v,
            pointList: newPointList,
          };
        }

        return v;
      });

      // 如果有多余的框则进行添加
      if (newPointListArray.length > 0) {
        newPointListArray.forEach((v, i) => {
          newPolygonList.push({
            sourceID,
            id: uuid(8, 62),
            pointList: v,
            valid,
            isVisible: true,
            order: CommonToolUtils.getAllToolsMaxOrder(this.polygonList, this.prevResultList) + 1 + i,
            attribute: defaultAttribute,
          });
        });
      }
    } else {
      // 嵌套合并结果
      newPolygonList[wrapIndex].pointList = PolygonUtils.clipPolygonFromWrapPolygon(
        selectedPointList,
        newPolygonList[wrapIndex].pointList,
      );
      newPolygonList = newPolygonList.filter((v) => v.id !== this.selectedID);
    }
    this.setPolygonList(newPolygonList);
    this.history.pushHistory(newPolygonList);
    this.render();
  }

  public onCombinedExecute() {
    if (!this.selectedID) {
      this.emit('messageInfo', i18n.t('PolygonsToBeCombinedNeedToBeSelected'));
      return;
    }
    this.isCombined = !this.isCombined;
  }

  public combine(e: MouseEvent) {
    // 没有选中和 hover 都退出
    const hoverID = this.getHoverID(e);
    if (!hoverID || !this.selectedID || this.selectedID === hoverID) {
      return;
    }

    if (this.config?.lineType !== ELineTypes.Line) {
      this.emit('messageInfo', i18n.t('CurveModeDoesNotSupportCutting'));
      return;
    }

    const selectedPolygon = this.polygonList.find((v) => v.id === this.selectedID);
    const combinedPolygon = this.currentShowList.find((v) => v.id === hoverID);
    if (!combinedPolygon || !selectedPolygon) {
      return;
    }

    const composeData = PolygonUtils.combinePolygonWithPolygon(selectedPolygon, combinedPolygon);

    if (!composeData) {
      return;
    }

    const { newPolygon, unionList } = composeData;
    if (unionList.length === 1 && newPolygon) {
      const newPolygonList = this.polygonList
        .filter((v) => !unionList.includes(v.id))
        .map((v) => {
          if (v.id === this.selectedID) {
            return newPolygon;
          }

          return v;
        });
      this.setPolygonList(newPolygonList);
      this.history.pushHistory(newPolygonList);
      this.render();
      this.emit('messageInfo', i18n.t('CombineSuccess'));
    } else {
      this.emit('messageInfo', i18n.t('CombiningFailedNotify'));
    }
    this.isCombined = false;
  }

  /**
   * 判断是否在边界外
   * @param selectedPointList
   * @returns
   */
  public isPolygonOutSide(selectedPointList: IPolygonPoint[]) {
    // 边缘判断 - 仅限支持图片下范围下
    if (this.dependToolName && this.basicCanvas && this.basicResult) {
      let isOutSide = false;
      switch (this.dependToolName) {
        case EToolName.Rect: {
          // 依赖拉框
          isOutSide = selectedPointList.filter((v) => !RectUtils.isInRect(v, this.basicResult)).length > 0;

          break;
        }
        case EToolName.Polygon: {
          isOutSide = PolygonUtils.isPointListOutSidePolygon(
            selectedPointList,
            this.basicResult.pointList,
            this.config.lineType,
          );
          break;
        }
        default: {
          //
        }
      }

      return isOutSide;
    }

    if (!this.imgInfo) {
      return false;
    }

    const { left, top, right, bottom } = MathUtils.calcViewportBoundaries(
      AxisUtils.changePointListByZoom(selectedPointList, this.zoom),
    );

    const scope = 0.00001;
    if (left < 0 || top < 0 || right > this.imgInfo.width + scope || bottom > this.imgInfo.height + scope) {
      // 超出范围则不进行编辑
      return true;
    }

    return false;
  }

  public onDragMove(e: MouseEvent) {
    if (!this.dragInfo || !this.selectedID) {
      return;
    }

    const { selectedPolygon } = this;
    let selectedPointList: IPolygonPoint[] | undefined = selectedPolygon?.pointList;
    if (!selectedPointList) {
      return;
    }

    const { initPointList, dragStartCoord, dragTarget, changePointIndex } = this.dragInfo;
    const coordinate = this.getCoordinateUnderZoom(e);

    let offset = {
      x: (coordinate.x - dragStartCoord.x) / this.zoom,
      y: (coordinate.y - dragStartCoord.y) / this.zoom,
    };

    /**
     * 矩形拖动
     * 1. 模式匹配
     * 2. 当前选中多边形是否为矩形
     * 3. 是否带有拖动
     *  */
    if (
      this.pattern === EPolygonPattern.Rect &&
      selectedPolygon?.isRect === true &&
      changePointIndex &&
      [EDragTarget.Line].includes(dragTarget)
    ) {
      const firstPointIndex = MathUtils.getArrayIndex(changePointIndex[0] - 2, 4);
      const secondPointIndex = MathUtils.getArrayIndex(changePointIndex[0] - 1, 4);
      const basicLine: [ICoordinate, ICoordinate] = [initPointList[firstPointIndex], initPointList[secondPointIndex]];

      offset = MathUtils.getRectPerpendicularOffset(dragStartCoord, coordinate, basicLine);
    }

    this.dragStatus = EDragStatus.Move;

    switch (dragTarget) {
      case EDragTarget.Plane:
        selectedPointList = selectedPointList.map((v, i) => ({
          ...v,
          x: initPointList[i].x + offset.x,
          y: initPointList[i].y + offset.y,
        }));

        break;

      case EDragTarget.Point:
      case EDragTarget.Line:
        selectedPointList = selectedPointList.map((n, i) => {
          if (changePointIndex && changePointIndex.includes(i)) {
            return {
              ...n,
              x: initPointList[i].x + offset.x,
              y: initPointList[i].y + offset.y,
            };
          }
          return n;
        });
        break;

      default: {
        break;
      }
    }

    if (
      this.pattern === EPolygonPattern.Rect &&
      selectedPolygon?.isRect === true &&
      dragTarget === EDragTarget.Point &&
      changePointIndex
    ) {
      const newPointList = MathUtils.getPointListFromPointOffset(
        initPointList as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
        changePointIndex[0],
        offset,
      );

      selectedPointList = newPointList;
    }

    // 边缘判断 - 仅限支持图片下范围下
    if (this.config.drawOutsideTarget === false && this.imgInfo) {
      const isOutSide = this.isPolygonOutSide(selectedPointList);
      if (isOutSide) {
        // 边缘外直接跳出
        return;
      }
    }

    const newPolygonList = this.polygonList.map((v) => {
      if (v.id === this.selectedID) {
        const newData = {
          ...v,
          pointList: selectedPointList as IPolygonPoint[],
        };

        // 非矩形模式下拖动，矩形模式下生成的框将会转换为非矩形框
        if (v.isRect === true && this.pattern === EPolygonPattern.Normal) {
          Object.assign(newData, { isRect: false });
        }

        return newData;
      }

      return v;
    });

    this.setPolygonList(newPolygonList);
    this.render();
  }

  public onMouseMove(e: MouseEvent) {
    if (super.onMouseMove(e) || this.forbidMouseOperation || !this.imgInfo) {
      return;
    }

    if (this.selectedID && this.dragInfo) {
      this.onDragMove(e);
      return;
    }

    let hoverPointIndex = -1;
    let hoverEdgeIndex = -1;

    const { selectedID } = this;
    if (selectedID) {
      this.hoverEdgeIndex = -1;
      this.hoverPointIndex = -1;

      hoverPointIndex = this.getHoverPointIndex(e);

      // 注意： 点的优先级大于边
      if (hoverPointIndex > -1) {
        this.hoverPointIndex = hoverPointIndex;
      } else {
        hoverEdgeIndex = this.getHoverEdgeIndex(e);
        this.hoverEdgeIndex = hoverEdgeIndex;
      }
    }

    if (this.drawingPointList.length > 0) {
      // 编辑中无需 hover操作

      return;
    }

    const newHoverID = this.getHoverID(e);
    if (this.hoverID !== newHoverID) {
      this.hoverID = newHoverID;
      this.render();
    }
  }

  public leftMouseUp(e: MouseEvent) {
    const hoverID = this.getHoverID(e);
    if (this.drawingPointList.length === 0 && e.ctrlKey === true && hoverID) {
      // ctrl + 左键 + hover存在，更改框属性
      this.setPolygonValidAndRender(hoverID);
    } else if (this.drawingPointList.length === 0 && hoverID) {
      // 鼠标左键 + hover存在，插入点
      this.insertPoint(e);
    } else {
      // 创建多边形
      this.addPointInDrawing(e);
    }
  }

  public onMouseUp(e: MouseEvent) {
    if (this.isCombined) {
      switch (e.button) {
        case 0:
          this.combine(e);
          break;

        case 2:
          this.isCombined = false;
          break;
        default:
          return;
      }

      return;
    }

    if (super.onMouseUp(e) || this.forbidMouseOperation || !this.imgInfo) {
      return undefined;
    }

    if (this.dragInfo && this.dragStatus === EDragStatus.Move) {
      // 拖拽停止
      this.dragInfo = undefined;
      this.dragStatus = EDragStatus.Wait;
      this.history.pushHistory(this.polygonList);

      // 同步 结果
      this.emit('updateResult');
      return;
    }

    switch (e.button) {
      case 0: {
        this.leftMouseUp(e);
        break;
      }

      case 2: {
        this.rightMouseUp(e);

        break;
      }

      default: {
        break;
      }
    }
    this.render();
    this.container.dispatchEvent(this.saveDataEvent);
  }

  public dragMouseUp() {
    if (this.dragStatus === EDragStatus.Start) {
      this.dragInfo = undefined;
      this.dragStatus = EDragStatus.Wait;
    }
  }

  public exportData() {
    const { polygonList } = this;

    return [polygonList, this.basicImgInfo];
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

  public getCurrentSelectedData() {
    const { selectedPolygon } = this;
    if (!selectedPolygon) {
      return;
    }

    const toolStyle = this.getRenderStyle(selectedPolygon.attribute, selectedPolygon.valid);
    const color = toolStyle.stroke;
    return {
      width: TEXT_MAX_WIDTH,
      color,
    };
  }

  public renderPolygon() {
    // 1. 静态多边形
    if (this.isHidden === false) {
      this.polygonList?.forEach((polygon) => {
        if ([this.selectedID, this.editPolygonID].includes(polygon.id)) {
          return;
        }
        if (polygon.isVisible) {
          const { attribute } = polygon;
          const toolColor = this.getColor(attribute, this.config, EToolName.Polygon);
          const toolData = this.getRenderStyle(polygon.attribute, polygon.valid, {
            color: toolColor,
          });
          const transformPointList = AxisUtils.changePointListByZoom(
            polygon.pointList || [],
            this.zoom,
            this.currentPos,
          );

          DrawUtils.drawPolygonWithFillAndLine(this.canvas, transformPointList, {
            fillColor: toolData.fill,
            strokeColor: toolData.stroke,
            pointColor: 'white',
            thickness: this.style?.width ?? 2,
            lineCap: 'round',
            isClose: true,
            lineType: this.config?.lineType,
          });

          let showText = `${this.getAttributeKey(attribute)}`;
          if (this.isShowOrder && polygon?.order > 0) {
            showText = `${polygon.order} ${showText}`;
          }

          DrawUtils.drawText(this.canvas, transformPointList[0], showText, {
            color: toolData.stroke,
            ...DEFAULT_TEXT_OFFSET,
          });

          // 文本输入
          const textAttribute = this.getStringAttributes(polygon, EToolName.Polygon);
          if (this.isShowAttributeText) {
            const endPoint = transformPointList[transformPointList.length - 1];
            if (endPoint && endPoint.x) {
              DrawUtils.drawText(
                this.canvas,
                { x: endPoint.x + TEXT_ATTRIBUTE_OFFSET.x, y: endPoint.y + TEXT_ATTRIBUTE_OFFSET.y },
                textAttribute,
                {
                  color: toolData.stroke,
                  ...DEFAULT_TEXT_OFFSET,
                },
              );
            }
          }
        }
      });
    }

    // 2. hover 多边形
    if (this.hoverID && this.hoverID !== this.editPolygonID) {
      const hoverPolygon = this.polygonList.find((v) => v.id === this.hoverID && v.id !== this.selectedID);
      if (hoverPolygon) {
        const color = this.getRenderStyle(hoverPolygon.attribute, hoverPolygon.valid, {
          isHovered: true,
        }).fill;

        DrawUtils.drawPolygonWithFill(
          this.canvas,
          AxisUtils.changePointListByZoom(hoverPolygon.pointList, this.zoom, this.currentPos),
          {
            color,
            lineType: this.config?.lineType,
          },
        );
      }
    }

    // 3. 选中多边形的渲染
    if (this.selectedID) {
      const selectdPolygon = this.selectedPolygon;

      if (selectdPolygon) {
        const toolData = this.getRenderStyle(selectdPolygon.attribute, selectdPolygon.valid, {
          isSelected: true,
        });

        DrawUtils.drawSelectedPolygonWithFillAndLine(
          this.canvas,
          AxisUtils.changePointListByZoom(selectdPolygon.pointList, this.zoom, this.currentPos),
          {
            fillColor: toolData.fill,
            strokeColor: toolData.stroke,
            pointColor: 'white',
            thickness: 2,
            lineCap: 'round',
            isClose: true,
            lineType: this.config?.lineType,
          },
        );

        let showText = `${this.getAttributeKey(selectdPolygon.attribute)}`;
        if (this.isShowOrder && selectdPolygon?.order > 0) {
          showText = `${selectdPolygon.order} ${showText}`;
        }

        DrawUtils.drawText(
          this.canvas,
          AxisUtils.changePointByZoom(selectdPolygon.pointList[0], this.zoom, this.currentPos),
          showText,
          {
            color: toolData.stroke,
            ...DEFAULT_TEXT_OFFSET,
          },
        );
      }
    }

    const toolData = this.getRenderStyle(this.defaultAttribute, !this.isCtrl);
    // 4. 编辑中的多边形
    if (this.drawingPointList?.length > 0) {
      // 渲染绘制中的多边形
      let drawingPointList = [...this.drawingPointList];
      let coordinate = AxisUtils.getOriginCoordinateWithOffsetCoordinate(this.coord, this.zoom, this.currentPos);

      if (this.pattern === EPolygonPattern.Rect && drawingPointList.length === 2) {
        // 矩形模式特殊绘制
        drawingPointList = MathUtils.getRectangleByRightAngle(coordinate, drawingPointList);
      } else {
        if (this.config?.edgeAdsorption && this.isAlt === false) {
          const { dropFoot } = PolygonUtils.getClosestPoint(
            coordinate,
            this.polygonList,
            this.config?.lineType,
            edgeAdsorptionScope / this.zoom,
          );
          if (dropFoot) {
            coordinate = dropFoot;
          }
        }
        drawingPointList.push(coordinate);
      }

      DrawUtils.drawSelectedPolygonWithFillAndLine(
        this.canvas,
        AxisUtils.changePointListByZoom(drawingPointList, this.zoom, this.currentPos),
        {
          fillColor: toolData.fill,
          strokeColor: toolData.stroke,
          pointColor: 'white',
          thickness: 2,
          lineCap: 'round',
          isClose: false,
          lineType: this.config.lineType,
        },
      );
    }

    // 5. 编辑中高亮的点
    if (this.hoverPointIndex > -1 && this.selectedID) {
      const selectdPolygon = this.selectedPolygon;
      if (!selectdPolygon) {
        return;
      }
      const selectedColor = this.getRenderStyle(this.defaultAttribute, selectdPolygon.valid, {
        isSelected: true,
      });

      const point = selectdPolygon?.pointList[this.hoverPointIndex];
      if (point) {
        const { x, y } = AxisUtils.changePointByZoom(point, this.zoom, this.currentPos);
        DrawUtils.drawCircleWithFill(this.canvas, { x, y }, 5, {
          color: selectedColor.fill,
        });
      }
    }

    // 6. 编辑中高亮的边
    if (this.hoverEdgeIndex > -1 && this.selectedID) {
      const selectdPolygon = this.selectedPolygon;
      if (!selectdPolygon) {
        return;
      }

      const selectedColor = this.getRenderStyle(this.defaultAttribute, selectdPolygon.valid, {
        isSelected: true,
      });

      DrawUtils.drawLineWithPointList(
        this.canvas,
        AxisUtils.changePointListByZoom(selectdPolygon.pointList, this.zoom, this.currentPos),
        {
          color: selectedColor.stroke,
          thickness: 10,
          hoverEdgeIndex: this.hoverEdgeIndex,
          lineType: this.config?.lineType,
        },
      );
    }
  }

  public render() {
    if (!this.ctx || !this.renderReady) {
      return;
    }
    super.render();
    this.renderPolygon();
    this.renderCursorLine(this.getLineColor(this.defaultAttribute));
  }

  public renderCursorLine(color: string) {
    super.renderCursorLine(color);
    if (this.isCombined) {
      const { x, y } = this.coord;
      const padding = 10; // 框的边界
      const rectWidth = 186; // 框的宽度
      const rectHeight = 32; // 框的高度
      DrawUtils.drawRectWithFill(
        this.canvas,
        {
          x: x + padding,
          y: y - padding * 4 - 1,
          width: rectWidth,
          height: rectHeight,
        } as IRect,
        { color: 'black' },
      );

      DrawUtils.drawText(this.canvas, { x, y }, i18n.t('ClickAnotherPolygon'), {
        textAlign: 'center',
        color: 'white',
        offsetX: rectWidth / 2 + padding,
        offsetY: -(rectHeight / 2 + padding / 2),
      });

      DrawUtils.drawRect(
        this.canvas,
        {
          x: x - padding,
          y: y - padding,
          width: padding * 2,
          height: padding * 2,
        } as IRect,
        { lineDash: [6], color: 'white' },
      );
    }
  }

  /** 撤销 */
  public undo() {
    if (this.drawingPointList.length > 0) {
      // 绘制中进行
      const drawingPointList = this.drawingHistory.undo();
      if (!drawingPointList) {
        return;
      }
      this.drawingPointList = drawingPointList;
      this.render();

      return;
    }

    const polygonList = this.history.undo();
    if (polygonList) {
      if (polygonList.length !== this.polygonList.length) {
        this.setSelectedID('');
      }

      this.setPolygonList(polygonList);
      this.render();
    }

    this.container.dispatchEvent(this.saveDataEvent);
  }

  /** 重做 */
  public redo() {
    if (this.drawingPointList.length > 0) {
      // 绘制中进行
      const drawingPointList = this.drawingHistory.redo();
      if (!drawingPointList) {
        return;
      }
      this.drawingPointList = drawingPointList;
      this.render();

      return;
    }

    const polygonList = this.history.redo();
    if (polygonList) {
      if (polygonList.length !== this.polygonList.length) {
        this.setSelectedID('');
      }

      this.setPolygonList(polygonList);
      this.render();
    }

    this.container.dispatchEvent(this.saveDataEvent);
  }
}
