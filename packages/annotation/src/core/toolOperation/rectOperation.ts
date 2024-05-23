import AxisUtils from '@/utils/tool/AxisUtils';
import RectUtils from '@/utils/tool/RectUtils';
import MathUtils from '@/utils/MathUtils';
import type { IRect, IRectConfig } from '@/types/tool/rectTool';
import type { ICoordinate } from '@/types/tool/common';

import { EDragStatus } from '../../constant/annotation';
import EKeyCode from '../../constant/keyCode';
import { EDragTarget, EToolName } from '../../constant/tool';
import locale from '../../locales';
import { EMessage } from '../../locales/constants';
import AttributeUtils from '../../utils/tool/AttributeUtils';
import CommonToolUtils from '../../utils/tool/CommonToolUtils';
import DrawUtils from '../../utils/tool/DrawUtils';
import MarkerUtils from '../../utils/tool/MarkerUtils';
import { getPolygonPointUnderZoom } from '../../utils/tool/polygonTool';
import uuid from '../../utils/uuid';
import type { IBasicToolOperationProps } from './basicToolOperation';
import BasicToolOperation from './basicToolOperation';

export interface IRectOperationProps extends IBasicToolOperationProps {
  drawOutSideTarget: boolean; // 是否可以在边界外进行标注
  style: any;
}

const scope = 6;

export default class RectOperation extends BasicToolOperation {
  public drawingRect?: IRect;

  public firstClickCoord?: ICoordinate; // 第一次点击的位置

  public firstCurrentPos?: ICoordinate; // 第一次点击的 currentPos

  public rectList: IRect[];

  public drawOutSideTarget: boolean; // 是否能在边界外进行标注

  // 具体操作
  public hoverRectID?: string; // 当前是否hover rect

  public hoverRectPointIndex: number; //  当前 hoverIndex, 依次为左上角、右上角、右下角、左下角

  public hoverRectEdgeIndex: number; //  当前 hover 的边

  public selectedRectID?: string; //

  public isFlow: boolean; // 是否进行流动

  public config: IRectConfig;

  public markerIndex: number; // 用于列表标签定位

  private dragInfo?: {
    dragStartCoord: ICoordinate;
    dragTarget: EDragTarget;
    changePointIndex?: number[]; // 用于存储拖拽点 / 边的下标
    firstRect: IRect; // 最初的框
    startTime: number;
  };

  constructor(props: IRectOperationProps) {
    super(props);
    this.drawOutSideTarget = props.drawOutSideTarget || false;
    this.rectList = [];
    this.isFlow = true;
    this.config = CommonToolUtils.jsonParser(props.config);
    this.hoverRectEdgeIndex = -1;
    this.hoverRectPointIndex = -1;
    this.markerIndex = 0;
    this.setStyle(props.style);

    this.createNewDrawingRect = this.createNewDrawingRect.bind(this);
    this.getDrawingRectWithRectList = this.getDrawingRectWithRectList.bind(this);
    this.setSelectedIdAfterAddingDrawingRect = this.setSelectedIdAfterAddingDrawingRect.bind(this);
    this.getCurrentSelectedData = this.getCurrentSelectedData.bind(this);
    this.setSelectedID = this.setSelectedID.bind(this);

    // esc取消绘制
    this.on('cancel', () => {
      this.drawingRect = undefined;
      this.firstClickCoord = undefined;
    });
  }

  public setResult(rectList: IRect[]) {
    this.clearActiveStatus();
    this.setRectList(rectList);

    if (this.hasMarkerConfig) {
      const nextMarkerInfo = CommonToolUtils.getNextMarker(this.getCurrentPageResult(rectList), this.config.markerList);
      if (nextMarkerInfo) {
        this.setMarkerIndex(nextMarkerInfo.index);
      }
    }

    this.render();
  }

  public destroy() {
    super.destroy();
  }

  // @ts-ignore
  public setConfig(config: IRectConfig, isClear = false) {
    this.config = config;
    if (isClear === true) {
      this.clearResult(false);
    }
  }

  /**
   * 设置当前的结果集
   * @param rectList
   * @param isUpload
   */
  public setRectList(rectList: IRect[], isUpload = false) {
    const oldLen = this.rectList.length;
    this.rectList = rectList;

    if (oldLen !== rectList.length) {
      // 件数发生改变
      this.emit('updatePageNumber');
    }

    if (isUpload) {
      // 为了兼容外层实时同步数据 - （估计后面会干掉）
      this.emit('updateResult');
    }
  }

  public get selectedRect() {
    return this.rectList.find((v) => v.id === this.selectedRectID);
  }

  public get selectedID() {
    return this.selectedRectID;
  }

  public get selectedText() {
    const selectedResult = this.dataList.find((i) => i.id === this.selectedID);

    if (!selectedResult) {
      return '';
    }

    return this.getStringAttributes(selectedResult, EToolName.Rect);
  }

  get dataList() {
    return this.rectList;
  }

  /**
   * 当前页面展示的框体
   */
  public get currentShowList() {
    let rect: IRect[] = [];
    const [showingRect, selectedRect] = CommonToolUtils.getRenderResultList<IRect>(
      this.rectList,
      CommonToolUtils.getSourceID(this.basicResult),
      this.attributeLockList,
      this.selectedID,
    );
    rect = showingRect;

    if (this.isHidden) {
      rect = [];
    }

    if (selectedRect) {
      rect.push(selectedRect);
    }
    return rect;
  }

  /**
   * 当前依赖状态下本页的所有框
   *
   * @readonly
   * @memberof RectOperation
   */
  public get currentPageResult() {
    const [showingRect] = CommonToolUtils.getRenderResultList<IRect>(
      this.rectList,
      CommonToolUtils.getSourceID(this.basicResult),
      [],
    );
    return showingRect;
  }

  /**
   * 当前依赖状态下本页的所有框
   *
   * @readonly
   * @memberof RectOperation
   */
  public getCurrentPageResult(rectList: IRect[]) {
    const [showingRect] = CommonToolUtils.getRenderResultList<IRect>(
      rectList,
      CommonToolUtils.getSourceID(this.basicResult),
      [],
    );
    return showingRect;
  }

  public setSelectedID(newID?: string) {
    this.setSelectedRectID(newID);
  }

  public setSelectedRectID(newID?: string) {
    this.selectedRectID = newID;

    this.render();
    this.emit('selectedChange');
  }

  public setStyle(toolStyle: any) {
    super.setStyle(toolStyle);
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

    const currentRect = this.currentPageResult.find((rect) => rect.label === markerValue);

    if (currentRect) {
      this.setSelectedID(currentRect.id);
      if (this.config.attributeConfigurable === true) {
        this.setDefaultAttribute(currentRect.attribute);
      }
    }
    this.emit('markIndexChange');
  };

  public getHoverRectID = (e: MouseEvent) => {
    const coordinate = this.getCoordinateUnderZoom(e);
    const newScope = scope;

    const { currentShowList } = this;
    if (currentShowList.length > 0) {
      if (this.selectedRectID) {
        const { selectedRect } = this;
        if (selectedRect) {
          if (RectUtils.isInRect(coordinate, selectedRect, newScope, this.zoom)) {
            return selectedRect.id;
          }
        }
      }

      const hoverList = currentShowList.filter((rect) => RectUtils.isInRect(coordinate, rect, newScope, this.zoom));

      if (hoverList.length === 0) {
        return '';
      }

      if (hoverList.length === 1) {
        return hoverList[0].id;
      }

      if (hoverList.length > 1) {
        // 判断矩形的大小, 矩形面积小的优先
        const rectSizeList = hoverList
          .map((rect) => ({ size: rect.width * rect.height, id: rect.id }))
          .sort((a, b) => a.size - b.size);

        return rectSizeList[0].id;
      }
    }

    return '';
  };

  /**
   * 获取当前的选中部分的hoverIndex
   * ../../../param e
   */
  public getHoverRectPointIndex(e: MouseEvent) {
    if (!this.selectedRect) {
      return -1;
    }

    return AxisUtils.returnClosePointIndex(
      this.getCoordinateUnderZoom(e),
      RectUtils.getRectPointList(this.selectedRect, this.zoom),
      scope + 2,
    );
  }

  public getHoverRectEdgeIndex(e: MouseEvent) {
    if (!this.selectedRect) {
      return -1;
    }

    let edgeIndex = -1;
    const { selectedRect } = this;
    const edgeList = RectUtils.getRectEdgeList(selectedRect, this.zoom);
    const coordinate = this.getCoordinateUnderZoom(e);

    for (let i = 0; i < edgeList.length; i++) {
      const edge = edgeList[i];
      const { length } = MathUtils.getFootOfPerpendicular(coordinate, edge.begin, edge.end);

      if (length < scope + 10) {
        edgeIndex = i;
      }
    }

    return edgeIndex;
  }

  /**
   * 获取当前配置下的 icon svg
   * @param attribute
   */
  public getTextIconSvg(attribute = '') {
    return AttributeUtils.getTextIconSvg(
      attribute,
      this.config.attributeList,
      this.config.attributeConfigurable,
      this.baseIcon,
    );
  }

  public onMouseDown(e: MouseEvent) {
    if (super.onMouseDown(e) || this.forbidMouseOperation || e.ctrlKey === true) {
      return;
    }
    // e.stopPropagation();
    // 仅有在选中模式才能进行拖动
    const dragStartCoord = this.getCoordinateUnderZoom(e);
    const hoverRectID = this.getHoverRectID(e);

    const firstRect = this.currentShowList.find((v) => v.id === this.selectedRectID);
    /**
     * 拖拽基础判断，如果包含以下行为则直接禁止操作
     * 1. 不存在框体
     * 2. 拖拽行为下禁止操作 - 右键
     * 3. 拖拽行为下禁止操作 - 左键 + space
     */
    if (!firstRect || e.button === 2 || (e.button === 0 && this.isSpaceKey === true)) {
      return;
    }

    if (this.selectedRectID) {
      if (this.getHoverRectPointIndex(e) > -1) {
        // 点的拖拽
        const dragTarget = EDragTarget.Point;
        this.dragInfo = {
          dragStartCoord,
          dragTarget,
          startTime: +new Date(),
          firstRect,
        };
        this.dragStatus = EDragStatus.Start;

        return;
      }

      if (this.getHoverRectEdgeIndex(e) > -1) {
        // 点的拖拽
        const dragTarget = EDragTarget.Line;
        this.dragInfo = {
          dragStartCoord,
          dragTarget,
          startTime: +new Date(),
          firstRect,
        };
        this.dragStatus = EDragStatus.Start;

        return;
      }
    }

    if (hoverRectID === this.selectedRectID && !this.drawingRect) {
      const dragTarget = EDragTarget.Plane;

      this.dragInfo = {
        dragStartCoord,
        dragTarget,
        firstRect,
        startTime: +new Date(),
      };
      this.dragStatus = EDragStatus.Start;
    }

    return undefined;
  }

  public onDragMove(coordinate: ICoordinate) {
    if (!this.dragInfo) {
      return;
    }

    this.dragStatus = EDragStatus.Move;

    // 选中后的操作
    const dragRect = RectUtils.getRectUnderZoom(this.dragInfo.firstRect, this.zoom);
    const { x, y, width, height } = dragRect;
    const offset = {
      x: coordinate.x - this.dragInfo.dragStartCoord.x,
      y: coordinate.y - this.dragInfo.dragStartCoord.y,
    }; // 缩放后的偏移

    let selectedRect = this.rectList.filter((v) => v.id === this.selectedRectID)[0];

    switch (this.dragInfo.dragTarget) {
      // 仅处理翻转的偏移

      case EDragTarget.Plane:
        selectedRect = {
          ...selectedRect,
          x: x + offset.x,
          y: y + offset.y,
          width,
          height,
        };

        break;

      case EDragTarget.Point:
        {
          let newX = x;
          let newY = y;
          let newWidth = width;
          let newHeight = height;

          switch (this.hoverRectPointIndex) {
            case 0: {
              newX = width - offset.x < 0 ? x + width : x + offset.x;
              newY = height - offset.y < 0 ? y + height : y + offset.y;
              newWidth = Math.abs(offset.x - width);
              newHeight = Math.abs(offset.y - height);
              break;
            }

            case 1: {
              newX = width + offset.x > 0 ? x : x + width + offset.x;
              newY = height - offset.y < 0 ? y + height : y + offset.y;
              newWidth = Math.abs(width + offset.x);
              newHeight = Math.abs(height - offset.y);
              break;
            }

            case 2: {
              newX = width + offset.x > 0 ? x : x + width + offset.x;
              newY = height + offset.y > 0 ? y : y + height + offset.y;
              newWidth = Math.abs(width + offset.x);
              newHeight = height + offset.y > 0 ? height + offset.y : Math.abs(height + offset.y);
              break;
            }

            case 3: {
              newX = width - offset.x < 0 ? x + width : x + offset.x;
              newY = height + offset.y > 0 ? y : y + height + offset.y;
              newWidth = Math.abs(offset.x - width);
              newHeight = height + offset.y > 0 ? height + offset.y : Math.abs(height + offset.y);
              break;
            }

            default: {
              return;
            }
          }

          selectedRect = {
            ...selectedRect,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        }
        break;

      case EDragTarget.Line: {
        let newX = x;
        let newY = y;
        let newWidth = width;
        let newHeight = height;

        switch (this.hoverRectEdgeIndex) {
          case 0: {
            newY = height - offset.y < 0 ? y + height : y + offset.y;
            newHeight = Math.abs(offset.y - height);
            break;
          }

          case 1: {
            newX = width + offset.x > 0 ? x : x + width + offset.x;
            newWidth = Math.abs(width + offset.x);
            break;
          }

          case 2: {
            newY = height + offset.y > 0 ? y : y + height + offset.y;
            newHeight = height + offset.y > 0 ? height + offset.y : Math.abs(height + offset.y);
            break;
          }

          case 3: {
            newX = width - offset.x < 0 ? x + width : x + offset.x;
            newWidth = Math.abs(offset.x - width);
            break;
          }

          default: {
            return;
          }
        }

        selectedRect = {
          ...selectedRect,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };

        break;
      }

      default: {
        // 都无命中，则无法进行拖拽

        return;
      }
    }

    // 边缘判断
    if (this.config.drawOutsideTarget === false) {
      if (this.basicResult) {
        if (this.basicResult?.pointList?.length > 0) {
          // 多边形判断
          if (
            RectUtils.isRectNotInPolygon(selectedRect, getPolygonPointUnderZoom(this.basicResult.pointList, this.zoom))
          ) {
            return;
          }
        }

        const basicX = this.basicResult.x * this.zoom;
        const basicY = this.basicResult.y * this.zoom;
        const basicWidth = this.basicResult.width * this.zoom;
        const basicHeight = this.basicResult.height * this.zoom;

        if (
          this.dragInfo.dragTarget !== EDragTarget.Plane &&
          (selectedRect.x < basicX - 0.01 ||
            selectedRect.y < basicY - 0.01 ||
            selectedRect.width > basicX + basicWidth - selectedRect.x + 0.01 ||
            selectedRect.height > basicY + basicHeight - selectedRect.y + 0.01)
        ) {
          return;
        }

        if (selectedRect.x < basicX) {
          selectedRect.x = basicX;
        }
        if (selectedRect.y < basicY) {
          selectedRect.y = basicY;
        }

        if (selectedRect.width > basicX + basicWidth - selectedRect.x) {
          switch (this.dragInfo.dragTarget) {
            case EDragTarget.Plane:
              selectedRect.x = basicX + basicWidth - width;
              break;

            case EDragTarget.Point:
            case EDragTarget.Line:
              if (offset.x > 0 && offset.y > 0) {
                selectedRect.width = basicX + basicWidth - selectedRect.x;
              }
              break;

            default: {
              return;
            }
          }
        }

        if (selectedRect.height > basicY + basicHeight - selectedRect.y) {
          switch (this.dragInfo.dragTarget) {
            case EDragTarget.Plane:
              selectedRect.y = basicY + basicHeight - height;
              break;

            default: {
              break;
            }
          }
        }
      } else {
        // 原图的限制
        if (selectedRect.x < 0) {
          selectedRect.x = 0;
        }

        if (selectedRect.y < 0) {
          selectedRect.y = 0;
        }

        if (this.imgInfo) {
          switch (this.dragInfo.dragTarget) {
            // 仅处理翻转的偏移

            case EDragTarget.Plane:
              if (selectedRect.x + selectedRect.width > this.imgInfo?.width) {
                selectedRect.x = this.imgInfo.width - width;
              }

              if (selectedRect.y + selectedRect.height > this.imgInfo?.height) {
                selectedRect.y = this.imgInfo.height - height;
              }
              break;

            default: {
              if (
                selectedRect.x + selectedRect.width > this.imgInfo?.width + 0.01 ||
                selectedRect.y + selectedRect.height > this.imgInfo?.height + 0.01
              ) {
                // 对线条和点先不做延伸的判断
                return;
              }
            }
          }
        }
      }
    }

    this.setRectList(
      this.rectList.map((v) => {
        if (v.id === selectedRect.id) {
          return RectUtils.getRectUnderZoom(selectedRect, 1 / this.zoom);
        }
        return v;
      }),
    );

    this.render();
  }

  public onMouseMove(e: MouseEvent) {
    if (super.onMouseMove(e) || this.forbidMouseOperation || !this.imgInfo) {
      return;
    }

    const coordinateZoom = this.getCoordinateUnderZoom(e);

    const coordinate = AxisUtils.changeDrawOutsideTarget(
      coordinateZoom,
      { x: 0, y: 0 },
      this.imgInfo,
      this.config.drawOutsideTarget,
      this.basicResult,
      this.zoom,
    );

    if (this.selectedRectID && this.dragInfo) {
      this.onDragMove(coordinate);
      return;
    }

    if (this.selectedRectID) {
      const hoverRectPointIndex = this.getHoverRectPointIndex(e);

      if (hoverRectPointIndex !== this.hoverRectPointIndex) {
        this.hoverRectPointIndex = hoverRectPointIndex;
        this.hoverRectEdgeIndex = -1;
        this.render();
        return;
      }

      if (this.hoverRectPointIndex === -1) {
        // 边的检测
        const hoverRectEdgeIndex = this.getHoverRectEdgeIndex(e);

        if (hoverRectEdgeIndex !== this.hoverRectEdgeIndex) {
          this.hoverRectEdgeIndex = hoverRectEdgeIndex;
          this.render();
          return;
        }
      }
    }

    const hoverRectID = this.getHoverRectID(e);
    const oldHoverRectID = this.hoverRectID;
    this.hoverRectID = hoverRectID;
    if (hoverRectID !== oldHoverRectID) {
      this.render();
    }

    if (this.drawingRect && this.firstClickCoord) {
      let { x, y } = this.firstClickCoord;
      let { width, height } = this.drawingRect;

      width = Math.abs(x - coordinate.x); // zoom 下的 width
      height = Math.abs(y - coordinate.y);
      if (coordinate.x < x) {
        x = coordinate.x;
      }
      if (coordinate.y < y) {
        y = coordinate.y;
      }

      if (this.config.drawOutsideTarget === false) {
        if (this.basicResult?.pointList?.length > 0) {
          // changeDrawOutsideTarget 最好还是在这里下功夫这里暂时进行多边形的判断
          if (
            RectUtils.isRectNotInPolygon(
              {
                ...this.drawingRect,
                x,
                y,
                width,
                height,
              },
              getPolygonPointUnderZoom(this.basicResult.pointList, this.zoom),
            )
          ) {
            return;
          }
        }

        if (coordinate.x < 0) {
          width = Math.abs(this.firstClickCoord.x);
          x = 0;
        }
        if (coordinate.y < 0) {
          height = Math.abs(this.firstClickCoord.y);
          y = 0;
        }
        if (this.imgInfo) {
          if (x + width > this.imgInfo.width) {
            width = Math.abs(this.imgInfo.width - x);
          }
          if (y + height > this.imgInfo.height) {
            height = Math.abs(this.imgInfo.height - y);
          }
        }
      }

      this.drawingRect = {
        ...this.drawingRect,
        x,
        y,
        width,
        height,
      };
      this.render();
    }

    return undefined;
  }

  public setAttributeLockList(attributeLockList: string[]) {
    this.setSelectedRectID(undefined);

    super.setAttributeLockList(attributeLockList);
  }

  // 修改为不依赖 考虑删除 todo
  public setBasicResult(basicResult: any) {
    super.setBasicResult(basicResult);

    this.clearActiveStatus();
  }

  public setRectValidAndRender(id: string) {
    if (!id) {
      return;
    }

    this.setRectList(
      this.rectList.map((rect) => {
        if (rect.id === id) {
          return {
            ...rect,
            valid: !rect.valid,
          };
        }
        return rect;
      }),
      true,
    );

    this.render();

    // 同步 rectList
    this.emit('updateResult');
  }

  public createNewDrawingRect(e: MouseEvent, basicSourceID: string) {
    if (!this.imgInfo) {
      return;
    }
    const coordinateZoom = this.getCoordinateUnderZoom(e);
    const coordinate = AxisUtils.changeDrawOutsideTarget(
      coordinateZoom,
      { x: 0, y: 0 },
      this.imgInfo,
      this.config.drawOutsideTarget,
      this.basicResult,
      this.zoom,
    );

    this.setSelectedRectID('');
    this.hoverRectID = '';
    if (this.drawOutSideTarget) {
      if (coordinate.x < 0) {
        coordinate.x = 0;
      }

      if (coordinate.y < 0) {
        coordinate.y = 0;
      }
    }

    this.drawingRect = {
      ...coordinate,
      width: 0,
      height: 0,
      attribute: this.defaultAttribute,
      valid: !e.ctrlKey,
      isVisible: true,
      id: uuid(8, 62),
      sourceID: basicSourceID,
    };

    if (this.hasMarkerConfig) {
      const nextMarkInfo = CommonToolUtils.getNextMarker(
        this.currentPageResult,
        this.config.markerList,
        this.markerIndex,
      );

      if (nextMarkInfo) {
        if (this.drawingRect) {
          this.drawingRect = {
            ...this.drawingRect,
            label: nextMarkInfo.label,
          };
        }
        this.markerIndex = nextMarkInfo.index;
        this.emit('markIndexChange');
      } else {
        // 不存在则不允许创建新的
        this.emit('messageInfo', locale.getMessagesByLocale(EMessage.MarkerFinish, this.lang));
        this.drawingRect = undefined;
        return;
      }
    }

    // 标注序号添加
    Object.assign(this.drawingRect!, {
      order:
        // CommonToolUtils.getMaxOrder(
        //   this.rectList.filter((v) => CommonToolUtils.isSameSourceID(v.sourceID, basicSourceID)),
        // ) + 1,
        CommonToolUtils.getAllToolsMaxOrder(this.rectList, this.prevResultList) + 1,
    });

    this.firstClickCoord = {
      ...coordinate,
    };

    this.firstCurrentPos = {
      ...this.currentPos,
    };

    /**
     * 数据注入
     */
    if (this.dataInjectionAtCreation) {
      const data = this.dataInjectionAtCreation(this.drawingRect);
      if (data) {
        Object.assign(this.drawingRect!, data);
      }
    }
  }

  /**
   * 将绘制中的框体添加进 rectList 中
   * @returns
   */
  public addDrawingRectToRectList(e: MouseEvent) {
    if (!this.drawingRect) {
      return;
    }

    // 结束框的绘制
    // drawingRect 为相对于原图的坐标

    let { width, height } = this.drawingRect;
    width /= this.zoom;
    height /= this.zoom;

    // 小于最小尺寸设置为无效框
    if (Math.round(width) < this.config.minWidth || Math.round(height) < this.config.minHeight) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.RectErrorSizeNotice, this.lang));

      this.drawingRect = undefined;
      this.firstClickCoord = undefined;
      this.dragInfo = undefined;
      this.dragStatus = EDragStatus.Wait;
      this.render();
      return;
    }

    const newRectList = this.getDrawingRectWithRectList();

    this.setRectList(newRectList, true);
    this.history.pushHistory(this.rectList);
    this.setSelectedIdAfterAddingDrawingRect();

    this.firstClickCoord = undefined;
    this.drawingRect = undefined;
    this.dragInfo = undefined;
    this.dragStatus = EDragStatus.Wait;
    this.emit('drawEnd', newRectList[newRectList.length - 1], e);
  }

  public setSelectedIdAfterAddingDrawingRect() {
    if (!this.drawingRect) {
      return;
    }
    if (this.config.textConfigurable) {
      this.setSelectedRectID(this.drawingRect.id);
    } else {
      this.setSelectedRectID();
    }
  }

  public getDrawingRectWithRectList() {
    if (!this.drawingRect) {
      return this.rectList;
    }

    let { x, y, width, height } = this.drawingRect;
    x /= this.zoom;
    y /= this.zoom;
    width /= this.zoom;
    height /= this.zoom;

    return [
      ...this.rectList,
      {
        ...this.drawingRect,
        x,
        y,
        width,
        height,
      },
    ];
  }

  /**
   * mouseup 下的鼠标右键
   * @param e
   */
  public rightMouseUp(e: MouseEvent) {
    const hoverRectID = this.getHoverRectID(e);

    const hoverRect = this.rectList.find((v) => v.id === hoverRectID);
    const { selectedRectID } = this;
    this.setSelectedRectID(undefined);
    if (hoverRect) {
      this.setDefaultAttribute(hoverRect.attribute);
    }

    if (this.drawingRect) {
      // 取消绘制

      this.drawingRect = undefined;
      this.firstClickCoord = undefined;
    } else {
      // 选中操作
      if (selectedRectID !== hoverRectID) {
        this.dblClickListener.clearRightDblClick();
      }

      this.setSelectedRectID(hoverRectID);
      this.hoverRectID = '';

      if (hoverRect?.label && this.hasMarkerConfig) {
        const markerIndex = CommonToolUtils.getCurrentMarkerIndex(hoverRect.label, this.config.markerList);
        if (markerIndex >= 0) {
          this.setMarkerIndex(markerIndex);
          this.emit('markIndexChange');
        }
      }
    }

    this.render();
    this.container.dispatchEvent(this.saveDataEvent);
  }

  public shiftRightMouseUp(e: MouseEvent) {
    const hoverRectID = this.getHoverRectID(e);

    this.emit('shiftRightMouseUp', hoverRectID);
  }

  public onMouseUp(e: MouseEvent) {
    if (super.onMouseUp(e) || this.forbidMouseOperation || !this.imgInfo) {
      return true;
    }

    if (this.dragInfo && this.dragStatus === EDragStatus.Move) {
      // 拖拽停止
      this.dragInfo = undefined;
      this.dragStatus = EDragStatus.Wait;
      this.history.pushHistory(this.rectList);

      // 同步 rectList
      this.emit('updateResult');
      return;
    }

    // shift + 右键操作
    if (e.button === 2 && e.shiftKey === true) {
      this.shiftRightMouseUp(e);
      return;
    }

    // 右键关闭
    if (e.button === 2) {
      this.rightMouseUp(e);
      return;
    }

    const basicSourceID = CommonToolUtils.getSourceID(this.basicResult);
    if (this.drawingRect) {
      // 结束框的绘制
      this.addDrawingRectToRectList(e);
      this.container.dispatchEvent(this.saveDataEvent);
      return;
    }

    if (e.ctrlKey === true && e.button === 0 && this.hoverRectID) {
      // ctrl + 左键 + hover存在，更改框属性
      this.setRectValidAndRender(this.hoverRectID);
      return;
    }

    // 创建框
    this.createNewDrawingRect(e, basicSourceID);
    this.render();
    this.container.dispatchEvent(this.saveDataEvent);

    return undefined;
  }

  public onRightDblClick(e: MouseEvent) {
    super.onRightDblClick(e);

    const hoverRectID = this.getHoverRectID(e);
    if (this.selectedRectID && this.selectedRectID === hoverRectID) {
      // 删除
      this.deleteRect(hoverRectID);
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
      case EKeyCode.Ctrl:
        if (this.drawingRect) {
          this.drawingRect = {
            ...this.drawingRect,
            valid: !e.ctrlKey,
          };
          this.render();
        }
        break;

      case EKeyCode.F:
        if (this.selectedRectID) {
          this.setRectValidAndRender(this.selectedRectID);
        }

        break;

      // case EKeyCode.Z:
      //   this.setIsHidden(!this.isHidden);
      //   this.render();
      //   break;

      case EKeyCode.Delete:
      case EKeyCode.BackSpace:
        this.deleteRect(this.selectedRectID);
        break;

      default: {
        break;
      }
    }

    return true;
  }

  public onKeyUp(e: KeyboardEvent) {
    super.onKeyUp(e);

    switch (e.keyCode) {
      case EKeyCode.Ctrl:
        if (this.drawingRect) {
          this.drawingRect = {
            ...this.drawingRect,
            valid: true,
          };
          this.render();
        }
        break;

      default: {
        break;
      }
    }
  }

  public onWheel(e: MouseEvent) {
    const oldZoom = this.zoom;
    let newDrawingRect;
    let newFirsClickCoord;

    if (this.drawingRect && this.firstClickCoord) {
      newDrawingRect = RectUtils.getRectUnderZoom(this.drawingRect, 1 / oldZoom);
      newFirsClickCoord = AxisUtils.changePointByZoom(this.firstClickCoord, 1 / oldZoom);
    }

    super.onWheel(e, false);
    if (newDrawingRect && newFirsClickCoord) {
      this.drawingRect = RectUtils.getRectUnderZoom(newDrawingRect, this.zoom);
      this.firstClickCoord = AxisUtils.changePointByZoom(newFirsClickCoord, this.zoom);
    }
    this.render();
  }

  public textChange = (v: string) => {
    if (this.config.textConfigurable !== true || !this.selectedRectID) {
      return;
    }

    this.setRectList(AttributeUtils.textChange(v, this.selectedRectID, this.rectList), true);

    this.emit('selectedChange');
    this.render();
  };

  public getCurrentSelectedData() {
    const { selectedRect } = this;
    if (!selectedRect) {
      return;
    }

    const toolStyle = this.getRenderStyle(selectedRect.attribute, selectedRect.valid);
    const color = toolStyle.stroke;

    return {
      width: selectedRect.width * this.zoom * 0.6,
      textAttribute: this.selectedText,
      color,
    };
  }

  public renderSelectedRect(rect?: IRect) {
    const { selectedRect } = this;
    if (!this.ctx || !rect || !selectedRect) {
      return;
    }

    const { ctx } = this;
    let radius = 10;
    const pointList = RectUtils.getRectPointList(selectedRect);
    const len = pointList.length;
    const toolStyle = this.getRenderStyle(rect.attribute, rect.valid);

    pointList.forEach((v: ICoordinate, i: number) => {
      ctx.save();
      ctx.moveTo(v.x, v.y);
      ctx.beginPath();

      if (this.hoverRectPointIndex === i) {
        radius = scope + 6;
      } else {
        radius = scope;
      }

      ctx.strokeStyle = toolStyle.stroke;
      ctx.fillStyle = toolStyle.stroke;

      ctx.arc(v.x * this.zoom + this.currentPos.x, v.y * this.zoom + this.currentPos.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // 边的加深
      if (this.hoverRectEdgeIndex === i) {
        ctx.beginPath();
        ctx.lineWidth = 10;

        const strokeStyle = toolStyle.stroke;

        ctx.strokeStyle = strokeStyle;

        ctx.moveTo(pointList[i].x * this.zoom + this.currentPos.x, pointList[i].y * this.zoom + this.currentPos.y);
        ctx.lineTo(
          pointList[(i + 1) % len].x * this.zoom + this.currentPos.x,
          pointList[(i + 1) % len].y * this.zoom + this.currentPos.y,
        );
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  /**
   *  绘制当前框的
   * @param rect 当前矩形框
   * @param zoom 是否进行缩放
   * @param isZoom 矩形框是否为缩放后的比例
   */
  public renderDrawingRect(rect: IRect, zoom = this.zoom, isZoom = false) {
    if (this.ctx && rect) {
      const { ctx, style } = this;
      // 不看图形信息
      const { hiddenText = false } = style;

      ctx.save();

      const { stroke, fill, text } = this.getRenderStyle(rect.attribute, rect.valid);

      ctx.font = 'lighter 14px Arial';
      let showText = '';
      if (this.isShowOrder && rect.order && rect?.order > 0) {
        showText = `${rect.order}`;
      }

      if (rect.label && this.hasMarkerConfig) {
        // const order = CommonToolUtils.getCurrentMarkerIndex(rect.label, this.config.markerList) + 1;
        const order = CommonToolUtils.getAllToolsMaxOrder(this.rectList, this.prevResultList);
        showText = `${order}_${MarkerUtils.getMarkerShowText(rect.label, this.config.markerList)}`;
      }

      if (rect.attribute) {
        showText = `${showText}  ${this.getAttributeKey(rect.attribute)}`;
      }

      const transformRect = AxisUtils.changeRectByZoom(rect, isZoom ? zoom : this.zoom, this.currentPos);

      if (!hiddenText) {
        // 框体上方展示
        DrawUtils.drawText(this.canvas, { x: transformRect.x, y: transformRect.y - 5 }, showText, {
          color: stroke,
          // font: 'normal normal 900 14px SourceHanSansCN-Regular',
          // ...DEFAULT_TEXT_SHADOW,
          textMaxWidth: 300,
        });
      }

      const lineWidth = this.style?.width ?? 2;

      if (rect.id === this.hoverRectID || rect.id === this.selectedRectID) {
        DrawUtils.drawRectWithFill(this.canvas, transformRect, { color: fill });
      }

      DrawUtils.drawRect(this.canvas, transformRect, { color: stroke, thickness: lineWidth, hiddenText: true });
      ctx.restore();

      const textAttribute = this.getStringAttributes(rect, EToolName.Rect);
      // 文本的输入
      if (!hiddenText && textAttribute && rect.id !== this.selectedRectID && this.isShowAttributeText) {
        const marginTop = 0;
        const textWidth = Math.max(20, transformRect.width);
        DrawUtils.drawText(
          this.canvas,
          { x: transformRect.x, y: transformRect.y + transformRect.height + 20 + marginTop },
          textAttribute,
          {
            color: text,
            // font: 'italic normal 900 14px Arial',
            textMaxWidth: textWidth,
            // ...DEFAULT_TEXT_SHADOW,
          },
        );
      }
    }
  }

  /**
   * 渲染静态框体
   */
  public renderStaticRect() {
    if (!(this.rectList?.length > 0 && JSON.stringify(this.rectList))) {
      return;
    }
    const { renderEnhance = {} } = this;
    const [showingRect, selectedRect] = CommonToolUtils.getRenderResultList<IRect>(
      this.rectList,
      CommonToolUtils.getSourceID(this.basicResult),
      this.attributeLockList,
      this.selectedRectID,
    );
    // 静态矩形
    if (!this.isHidden) {
      showingRect?.forEach((rect) => {
        if (rect.isVisible) {
          this.renderDrawingRect(rect);
          // 静态渲染挣增强渲染
          if (renderEnhance.staticRender) {
            renderEnhance.staticRender(
              this.canvas,
              AxisUtils.changeRectByZoom(rect, this.zoom, this.currentPos),
              this.getRenderStyle(rect.attribute, rect.valid),
            );
          }
        }
      });
    }

    // 选中矩形熏染
    if (selectedRect) {
      this.renderDrawingRect(selectedRect);
      this.renderSelectedRect(selectedRect);

      if (renderEnhance.selectedRender) {
        renderEnhance.selectedRender(
          this.canvas,
          AxisUtils.changeRectByZoom(selectedRect, this.zoom, this.currentPos),
          this.getRenderStyle(selectedRect.attribute, selectedRect.valid),
        );
      }
    }
  }

  /**
   * 创建创建中的框体
   * @returns
   */
  public renderCreatingRect() {
    if (!this.drawingRect) {
      return;
    }

    const { renderEnhance = {} } = this;
    this.renderDrawingRect(this.drawingRect, 1, true); // 正常框体的创建

    // 创建时进行渲染
    if (renderEnhance.creatingRender) {
      renderEnhance.creatingRender(
        this.canvas,
        AxisUtils.changeRectByZoom(this.drawingRect, 1, this.currentPos),
        this.getRenderStyle(this.drawingRect.attribute, this.drawingRect.valid),
      );
    }
  }

  /**
   * 渲染矩形框体
   */
  public renderRect() {
    this.renderStaticRect();
    this.renderCreatingRect();
  }

  public render() {
    if (!this.ctx || !this.renderReady) {
      return;
    }
    super.render();
    this.renderRect();
    this.renderCursorLine(this.getLineColor(this.defaultAttribute));
  }

  public setDefaultAttribute(defaultAttribute?: string) {
    const oldDefault = this.defaultAttribute;

    if (!this.hasAttributeInConfig(defaultAttribute!)) {
      return;
    }

    this.defaultAttribute = defaultAttribute ?? '';

    if (oldDefault !== defaultAttribute) {
      // 如果更改 attribute 需要同步更改 style 的样式
      this.changeStyle(defaultAttribute);

      //  触发侧边栏同步
      this.emit('changeAttributeSidebar');
      this.container.dispatchEvent(this.saveDataEvent);

      // 如有选中目标，则需更改当前选中的属性
      const { selectedRect } = this;
      if (selectedRect) {
        this.setRectList(
          this.rectList.map((v) => {
            if (v.id === this.selectedID) {
              return {
                ...v,
                attribute: this.defaultAttribute,
              };
            }

            return v;
          }),
          true,
        );

        this.history.pushHistory(this.rectList);
        this.render();
      }

      if (this.drawingRect) {
        this.drawingRect = {
          ...this.drawingRect,
          attribute: this.defaultAttribute,
        };
        this.render();
      }
    }
  }

  /**
   *  清楚所有的中间状态
   */
  public clearActiveStatus() {
    this.drawingRect = undefined;
    this.firstClickCoord = undefined;
    this.dragInfo = undefined;
    this.dragStatus = EDragStatus.Wait;
    this.setSelectedRectID(undefined);
  }

  public clearResult(sendMessage = true) {
    const newRectList: IRect[] = this.rectList.filter((rect) => rect.disableDelete === true);
    if (newRectList.length > 0 && sendMessage) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.ClearPartialData, this.lang));
    }

    this.setRectList(newRectList, true);
    this.setSelectedRectID(undefined);
  }

  public deleteRect(rectID?: string) {
    if (!rectID) {
      return;
    }
    const selectedRect = this.rectList.find((v) => v.id === rectID);

    if (selectedRect?.disableDelete === true) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.DisableDelete, this.lang));
      return;
    }

    this.setRectList(
      this.rectList.filter((v) => v.id !== rectID),
      true,
    );
    this.history.pushHistory(this.rectList);
    this.setSelectedRectID(undefined);
    this.render();
  }

  /**
   * 导出结果
   */
  public exportData(): any[] {
    const { rectList } = this;

    return [rectList, this.basicImgInfo];
  }

  /** 撤销 */
  public undo() {
    const rectList = this.history.undo();
    if (rectList) {
      if (rectList.length !== this.rectList.length) {
        this.setSelectedRectID('');
      }

      this.setRectList(rectList, true);
      this.render();
    }
  }

  /** 重做 */
  public redo() {
    const rectList = this.history.redo();
    if (rectList) {
      if (rectList.length !== this.rectList.length) {
        this.setSelectedRectID('');
      }

      this.setRectList(rectList, true);
      this.render();
    }
  }
}
