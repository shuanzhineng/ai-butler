import type { IImageAttribute } from '@/types/imgAttributeStore';
import type { ICoordinate, IOffsetCanvasPosition, IPoint } from '@/types/tool/common';
import type { IRect } from '@/types/tool/rectTool';

import { DEFAULT_FONT, ELineTypes, SEGMENT_NUMBER } from '../../constant/tool';
import type { IPolygonPoint } from '../../types/tool/polygon';
import PolygonUtils from './PolygonUtils';
import UnitUtils from './UnitUtils';

const DEFAULT_ZOOM = 1;
const DEFAULT_CURRENT_POS = {
  x: 0,
  y: 0,
};
const DEFAULT_ROTATE = 0;
const DEFAULT_COLOR = '';

export default class DrawUtils {
  public static drawImg = (
    canvas: HTMLCanvasElement,
    imgNode: HTMLImageElement,
    options: Partial<IOffsetCanvasPosition & { imgAttribute: IImageAttribute }> = {},
  ) => {
    const ctx = canvas.getContext('2d')!;

    const { zoom = DEFAULT_ZOOM, currentPos = DEFAULT_CURRENT_POS, rotate = DEFAULT_ROTATE, imgAttribute } = options;

    ctx.save();
    switch (rotate) {
      case 0:
        ctx.translate(currentPos.x, currentPos.y);
        break;

      case 90:
        ctx.translate(currentPos.x + imgNode.height * zoom, currentPos.y);
        ctx.rotate((90 * Math.PI) / 180);
        break;

      case 180:
        ctx.translate(currentPos.x + imgNode.width * zoom, currentPos.y + imgNode.height * zoom);
        ctx.rotate(Math.PI);
        break;

      case 270:
        ctx.translate(currentPos.x, currentPos.y + imgNode.width * zoom);
        ctx.rotate((270 * Math.PI) / 180);
        break;

      default:
        ctx.translate(currentPos.x, currentPos.y);
        break;
    }

    if (imgAttribute) {
      // 更改图片的属性
      const { contrast, saturation, brightness } = imgAttribute;
      ctx.filter = `saturate(${saturation + 100}%) contrast(${contrast + 100}%) brightness(${brightness + 100}%)`;
    }

    ctx.drawImage(imgNode, 0, 0, imgNode.width * zoom, imgNode.height * zoom);
    ctx.restore();
  };

  public static drawLine(
    canvas: HTMLCanvasElement,
    startPoint: IPoint | IPolygonPoint,
    endPoint: IPoint | IPolygonPoint,
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const { color = DEFAULT_COLOR, thickness = 1, lineCap = 'round' } = options;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = lineCap;
    ctx.beginPath();

    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x + 1, endPoint.y + 1);
    ctx.stroke();
    ctx.restore();
  }

  /**
   *  查看绘制拉框
   * @param canvas
   * @param rect
   * @param options
   */
  public static drawRect(
    canvas: HTMLCanvasElement,
    rect: IRect,
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
      isShowOrder?: boolean;
      order?: number;
      hiddenText: boolean;
      lineDash: number[];
      text: string;
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const {
      color = DEFAULT_COLOR,
      thickness = 1,
      lineCap = 'round',
      hiddenText = false,
      lineDash,
      isShowOrder,
      order,
      text,
    } = options;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = lineCap;
    if (Array.isArray(lineDash)) {
      ctx.setLineDash(lineDash);
    }
    ctx.fillStyle = color;

    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    if (hiddenText === false) {
      let showText = '';
      if (rect.attribute) {
        showText = `${showText}  ${text || rect.attribute}`;
      }
      if (isShowOrder) {
        showText = `${order}${showText}`;
      }
      this.drawText(canvas, { x: rect.x, y: rect.y - 5 }, showText);
    }
    ctx.restore();
  }

  /**
   * 填充矩形框的绘制
   * @param canvas
   * @param rect
   * @param options
   */
  public static drawRectWithFill(
    canvas: HTMLCanvasElement,
    rect: IRect,
    options: Partial<{
      color: string;
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const { color = DEFAULT_COLOR } = options;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  /**
   * 通过 DOM 形式创建标签
   * @param parent
   * @param text
   * @param id
   * @returns
   */
  public static drawTagByDom(parent: HTMLElement, text: string, id: string) {
    const parentNode = parent;
    if (!(text?.length > 0)) {
      return;
    }

    const dom = document.createElement('div');
    dom.innerHTML = text;
    dom.setAttribute('id', id);
    parentNode?.appendChild(dom);

    return dom;
  }

  public static drawTag(canvas: HTMLCanvasElement, tagList: { keyName: string; value: string[] }[]) {
    const parentNode = canvas?.parentNode;
    let oldDom;
    if (typeof window !== 'undefined') {
      oldDom = window.self.document.getElementById('tagToolTag');
    }
    if (oldDom && parentNode && parentNode.contains(oldDom)) {
      parentNode?.removeChild(oldDom);
    }
    if (!(tagList?.length > 0)) {
      return;
    }
    const dom = document.createElement('div');
    dom.innerHTML =
      tagList.reduce((acc: string, cur) => {
        return `${acc}${cur.keyName}: ${cur.value.join(` 、 `)}\n`;
      }, '') ?? '';
    dom.setAttribute('id', 'tagToolTag');
    parentNode?.appendChild(dom);

    return dom;
  }

  /**
   * 绘制点击线条
   * @param canvas
   * @param pointList
   * @param options
   * @returns
   */
  public static drawLineWithPointList(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
      lineType: ELineTypes;
      lineDash: number[];
      hoverEdgeIndex: number;
    }> = {},
  ) {
    if (pointList.length < 2) {
      return;
    }

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const {
      color = DEFAULT_COLOR,
      thickness = 1,
      lineCap = 'round',
      lineType = ELineTypes.Line,
      lineDash,
      hoverEdgeIndex,
    } = options;
    ctx.save();
    const setStyle = () => {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = lineCap;
      if (Array.isArray(lineDash)) {
        ctx.setLineDash(lineDash);
      } else {
        ctx.setLineDash([]);
      }
    };
    setStyle();

    if (lineType === ELineTypes.Curve) {
      // 适配 HoverEdge 的高亮形式，TODO
      if (hoverEdgeIndex !== undefined && hoverEdgeIndex > -1) {
        pointList.push(pointList[0]);
      }

      // eslint-disable-next-line no-param-reassign
      pointList = PolygonUtils.createSmoothCurvePointsFromPointList([...pointList], SEGMENT_NUMBER);

      if (hoverEdgeIndex !== undefined && hoverEdgeIndex > -1) {
        // 想要绘制第 hoverEdgeIndex 的边, 注意，现在发现这种闭合的初始化的点并不是从 点 0 开始，而是从  0的后一个点开始
        // eslint-disable-next-line no-param-reassign
        pointList = pointList.slice((SEGMENT_NUMBER + 1) * hoverEdgeIndex, (SEGMENT_NUMBER + 1) * (hoverEdgeIndex + 1));
      }
    } else if (hoverEdgeIndex !== undefined && hoverEdgeIndex > -1) {
      // eslint-disable-next-line no-param-reassign
      pointList = [...pointList, pointList[0]];
      // eslint-disable-next-line no-param-reassign
      pointList = pointList.slice(hoverEdgeIndex, hoverEdgeIndex + 2);
    }

    const specialEdgeList = [];
    ctx.beginPath();
    ctx.moveTo(pointList[0].x, pointList[0].y);
    for (let i = 0; i < pointList.length - 1; i++) {
      if (pointList[i].specialEdge) {
        specialEdgeList.push({
          i1: i,
          i2: i + 1,
        });
      }

      ctx.lineTo(pointList[i + 1].x, pointList[i + 1].y);
    }
    ctx.stroke();

    ctx.save();
    ctx.lineWidth = thickness * 0.8;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'white';
    ctx.setLineDash([3, 3]);

    // 后续可以进行渲染优化
    specialEdgeList.forEach((v) => {
      const point1 = pointList[v.i1];
      const point2 = pointList[v.i2];
      ctx.beginPath();
      ctx.moveTo(point1.x, point1.y);
      ctx.lineTo(point2.x, point2.y);
      ctx.stroke();
    });

    ctx.restore();

    const DEFAULT_SPECIAL_POINT_RADIUS = 4;
    const DEFAULT_BORDER = 2;
    // 特殊点绘制
    pointList.forEach((p) => {
      if (p.specialPoint) {
        // 背景
        this.drawSpecialPoint(canvas, p, DEFAULT_SPECIAL_POINT_RADIUS + DEFAULT_BORDER, color);

        // 内部白心
        this.drawSpecialPoint(canvas, p, DEFAULT_SPECIAL_POINT_RADIUS, 'white');
      }
    });
    ctx.restore();

    // 用于外层获取曲线更新后数据
    return pointList;
  }

  public static drawCircle(
    canvas: HTMLCanvasElement,
    anchorPoint: IPoint,
    radius: number,
    options: Partial<{
      startAngleDeg: number;
      endAngleDeg: number;
      thickness: number;
      color: string;
      fill: string;
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const {
      startAngleDeg = 0,
      endAngleDeg = 360,
      thickness = 1,
      color = DEFAULT_COLOR,
      fill = DEFAULT_COLOR,
    } = options;

    const startAngleRad = UnitUtils.deg2rad(startAngleDeg);
    const endAngleRad = UnitUtils.deg2rad(endAngleDeg);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = fill;
    ctx.lineWidth = thickness;
    ctx.arc(anchorPoint.x, anchorPoint.y, radius, startAngleRad, endAngleRad, false);
    ctx.stroke();
    if (fill) {
      ctx.fill();
    }
    ctx.closePath();
    ctx.restore();
  }

  public static drawCircleWithFill(
    canvas: HTMLCanvasElement,
    anchorPoint: IPoint,
    radius: number = 3,
    options: Partial<{
      color: string;
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const { color = DEFAULT_COLOR } = options;

    ctx.save();
    const startAngleRad = UnitUtils.deg2rad(0);
    const endAngleRad = UnitUtils.deg2rad(360);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(anchorPoint.x, anchorPoint.y, radius, startAngleRad, endAngleRad, false);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制特殊点 - 三角形
   *
   * @export
   * @param {CanvasRenderingContext2D} ctx
   * @param {ICoord} point
   * @param {number} [pointRadius=6]
   * @param {string} fillStyle
   * @param {boolean} [specialPoint]
   */
  public static drawSpecialPoint(
    canvas: HTMLCanvasElement,
    point: ICoordinate,
    pointRadius: number = 6,
    fillStyle: string,
  ) {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;

    const { x, y } = point;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = fillStyle;

    const newPointRadius = pointRadius * 1.5;
    const xl = (newPointRadius * Math.sqrt(3)) / 2;
    const yl = newPointRadius / 2;
    ctx.moveTo(x, y - newPointRadius);
    ctx.lineTo(x - xl, y + yl);
    ctx.lineTo(x + xl, y + yl);
    ctx.closePath();

    ctx.fill();
    ctx.restore();
  }

  public static drawPolygon(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
      isClose: boolean; // 是否闭合
      lineType: ELineTypes;
      lineDash: number[];
    }> = {},
  ) {
    const { isClose = false, lineType = ELineTypes.Line } = options;
    if (isClose === true) {
      // eslint-disable-next-line no-param-reassign
      pointList = [...pointList, pointList[0]];
    }

    if (lineType === ELineTypes.Curve) {
      // eslint-disable-next-line no-param-reassign
      pointList = PolygonUtils.createSmoothCurvePointsFromPointList([...pointList]);
    }

    this.drawLineWithPointList(canvas, pointList, {
      ...options,
      lineType: ELineTypes.Line,
    });

    // 用于外层获取曲线更新后数据
    return pointList;
  }

  public static drawPolygonWithFill(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      color: string;
      lineType: ELineTypes;
    }> = {},
  ) {
    if (pointList.length < 2) {
      return;
    }

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const { color = DEFAULT_COLOR, lineType = ELineTypes.Line } = options;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();

    if (lineType === ELineTypes.Curve) {
      // eslint-disable-next-line no-param-reassign
      pointList = PolygonUtils.createSmoothCurvePointsFromPointList([...pointList, pointList[0]]);
    }

    const [startPoint, ...otherPointList] = pointList;
    ctx.moveTo(startPoint.x, startPoint.y);
    otherPointList.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    ctx.fill();
    ctx.restore();

    // 用于外层获取曲线更新后数据
    return pointList;
  }

  public static drawPolygonWithFillAndLine(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      strokeColor: string;
      fillColor: string;
      pointColor: string;
      thickness: number;
      lineCap: CanvasLineCap;
      isClose: boolean; // 是否闭合
      lineType: ELineTypes;
    }> = {},
  ) {
    const { strokeColor, fillColor, thickness, lineCap, isClose, lineType } = options;

    const newPointList = this.drawPolygon(canvas, pointList, {
      color: strokeColor,
      thickness,
      lineCap,
      isClose,
      lineType,
    });
    this.drawPolygonWithFill(canvas, pointList, { color: fillColor, lineType });

    return newPointList;
  }

  /**
   * 绘制多边形带有关键点的多边形
   * @param canvas
   * @param pointList
   * @param options
   * @returns
   */
  public static drawPolygonWithKeyPoint(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      strokeColor: string;
      fillColor: string;
      pointColor: string;
      thickness: number;
      lineCap: CanvasLineCap;
      isClose: boolean; // 是否闭合
      lineType: ELineTypes;
      isFill: boolean;
    }> = {},
  ) {
    const { pointColor = 'white', strokeColor } = options;

    const newPointList = this.drawPolygon(canvas, pointList, options);
    newPointList.forEach((point) => {
      this.drawCircleWithFill(canvas, point, 4, { color: strokeColor });
      this.drawCircleWithFill(canvas, point, 3, { color: pointColor });
    });
    return newPointList;
  }

  // 绘制选中的多边形
  public static drawSelectedPolygonWithFillAndLine(
    canvas: HTMLCanvasElement,
    pointList: IPolygonPoint[],
    options: Partial<{
      strokeColor: string;
      fillColor: string;
      pointColor: string;
      thickness: number;
      lineCap: CanvasLineCap;
      isClose: boolean; // 是否闭合
      lineType: ELineTypes;
    }> = {},
  ) {
    const { pointColor = 'white', strokeColor } = options;

    const newPointList = this.drawPolygonWithFillAndLine(canvas, pointList, options);

    // if (isClose === false) {
    //   newPointList.pop();
    // }

    newPointList.forEach((point) => {
      this.drawCircleWithFill(canvas, point, 4, { color: strokeColor });
      this.drawCircleWithFill(canvas, point, 3, { color: pointColor });
    });
    return newPointList;
  }

  // 绘制文本
  public static drawText(
    canvas: HTMLCanvasElement,
    startPoint: IPoint | IPolygonPoint,
    text: string,
    options: Partial<{
      color: string;
      font: string;
      shadowColor: string;
      shadowOffsetX: number;
      shadowOffsetY: number;
      shadowBlur: number;
      textMaxWidth: number;
      offsetX: number;
      offsetY: number;
      textAlign: 'start' | 'center' | 'end' | 'left' | 'right';
      lineHeight: number;
    }> = {},
  ): void {
    if (!text || !startPoint) {
      return;
    }
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const {
      color = DEFAULT_COLOR,
      font = DEFAULT_FONT,
      shadowColor = '',
      shadowBlur = 0,
      shadowOffsetX = 0,
      shadowOffsetY = 0,
      textMaxWidth = 164,
      offsetX = 0,
      offsetY = 0,
      textAlign = 'start',
      lineHeight,
    } = options;

    ctx.save();
    ctx.textAlign = textAlign;
    ctx.fillStyle = color ?? 'white';
    ctx.font = font;
    ctx.shadowColor = shadowColor;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.shadowBlur = shadowBlur;
    this.wrapText(canvas, `${text}`, startPoint.x + offsetX, startPoint.y + offsetY, textMaxWidth, lineHeight);
    ctx.restore();
  }

  public static wrapText(
    canvas: HTMLCanvasElement,
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
    lineHeight?: number,
  ) {
    if (typeof text !== 'string' || typeof x !== 'number' || typeof y !== 'number') {
      return;
    }

    const context: CanvasRenderingContext2D = canvas.getContext('2d')!;
    if (typeof maxWidth === 'undefined') {
      // eslint-disable-next-line no-param-reassign
      maxWidth = (canvas && canvas.width) || 300;
    }
    if (typeof lineHeight === 'undefined' && typeof window !== 'undefined') {
      // eslint-disable-next-line no-param-reassign
      lineHeight =
        (canvas && parseInt(window.getComputedStyle(canvas).lineHeight, 10)) ||
        parseInt(window.getComputedStyle(document.body).lineHeight, 10);
    }

    const arrParagraph = text.split('\n');

    for (let i = 0; i < arrParagraph.length; i++) {
      // 字符分隔为数组
      const arrText = arrParagraph[i].split('');
      let line = '';

      for (let n = 0; n < arrText.length; n++) {
        const testLine = line + arrText[n];
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (!maxWidth) {
          // eslint-disable-next-line no-param-reassign
          maxWidth = 300;
        }

        if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, y);
          line = arrText[n];
          // eslint-disable-next-line no-param-reassign
          y += lineHeight as number;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, y);

      // eslint-disable-next-line no-param-reassign
      y += lineHeight as number;
    }
  }

  /**
   * 绘制箭头
   * @param ctx
   * @param startPoint
   * @param endPoint
   * @param options
   */
  public static drawArrow(
    ctx: CanvasRenderingContext2D,
    startPoint: IPoint | IPolygonPoint,
    endPoint: IPoint | IPolygonPoint,
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
      theta: number; // 用于控制箭头的偏移
      headLen: number; // 箭头长度
    }> = {},
  ): void {
    const { color = DEFAULT_COLOR, thickness = 1, lineCap = 'round', theta = 30, headLen = 10 } = options;
    const angle = (Math.atan2(startPoint.y - endPoint.y, startPoint.x - endPoint.x) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;
    const topX = headLen * Math.cos(angle1);
    const topY = headLen * Math.sin(angle1);
    const botX = headLen * Math.cos(angle2);
    const botY = headLen * Math.sin(angle2);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = lineCap;
    ctx.beginPath();

    ctx.moveTo(endPoint.x + topX, endPoint.y + topY);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.lineTo(endPoint.x + botX, endPoint.y + botY);

    ctx.stroke();
    ctx.restore();
  }

  public static drawArrowByCanvas(
    canvas: HTMLCanvasElement,
    startPoint: IPoint | IPolygonPoint,
    endPoint: IPoint | IPolygonPoint,
    options: Partial<{
      color: string;
      thickness: number;
      lineCap: CanvasLineCap;
      theta: number; // 用于控制箭头的偏移
      headLen: number; // 箭头长度
    }> = {},
  ): void {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    this.drawArrow(ctx, startPoint, endPoint, options);
  }
}
