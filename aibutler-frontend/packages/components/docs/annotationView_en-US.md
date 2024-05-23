English | [简体中文](./annotationView.md)

# AnnotationView

Integrate basic annotation rendering, and only need simple configuration to render the required annotation information.

## Examples

```ts
import { AnnotationView } from '@labelu/components';

const src = ''; // 可访问的图片路径

const DefaultComponent = () => {
  return <AnnotationView src={src} />;
};

export default DefaultComponent;
```

## API

| Params | Description | Require | Type | default |
| --- | --- | --- | --- | :-: |
| src | img path | Yes | string | - |
| size | size of canvas | No | ISize | {width: 1280, height: 720,} |
| annotations | the set of annotations | No | IAnnotationData[] | [] |
| style | annotation style | No | IBasicStyle | {} |
| zoomChange | listen the change of zoom | No | (zoom: number) => void | - |
| backgroundStyle | canvas background Style | No | CSSProperties | {} |
| onChange | listen the change of annotation | No | (type: 'hover' \| 'selected', ids: string[]) => void; | - |
| showLoading | show loading | No | boolean | false |

### Type

```ts
interface ISize {
  width: number;
  height: number;
}

interface IBasicStyle {
  stroke?: string; // border color
  fill?: string; // fill color
  thickness?: number;
}

interface IGraphicsBasicConfig extends IBasicStyle {
  hiddenText?: boolean;
  isReference?: boolean;
}

interface IAnnotationData {
  type: 'rect' | 'polygon' | 'line' | 'point';
  annotation: IBasicRect & IBasicPolygon & IBasicLine & IPoint;
}

interface IBasicRect extends IGraphicsBasicConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IBasicPolygon extends IGraphicsBasicConfig {
  id: string;
  pointList: IPoint[];

  showDirection?: boolean;
  specialPoint?: boolean; // 顶点是否特殊点
  specialEdge?: boolean; // 顶点与a其下一个顶点连成的边是否为特殊边

  lineType?: ELineTypes;
}

type IBasicLine = IBasicPolygon;

interface IPoint extends IGraphicsBasicConfig {
  id: string;
  x: number;
  y: number;
  radius?: number;
}

interface IBasicText {
  id: string;
  x: number;
  y: number;
  text: string; // Use \n for line feed
  textMaxWidth?: number;

  color?: string;
  background?: string;
  lineHeight?: number;
  font?: string; // canvas-font https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
}
```
