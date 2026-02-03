import { PureComponent } from "react";

export interface PannellumProps {
  id?: string;
  width?: string;
  height?: string;
  image?: string;
  haov?: number;
  vaov?: number;
  vOffset?: number;
  yaw?: number;
  pitch?: number;
  hfov?: number;
  minHfov?: number;
  maxHfov?: number;
  minPitch?: number;
  maxPitch?: number;
  minYaw?: number;
  maxYaw?: number;
  autoRotate?: number;
  compass?: boolean;
  preview?: string;
  previewTitle?: string;
  previewAuthor?: string;
  title?: string;
  author?: string;
  autoLoad?: boolean;
  orientationOnByDefault?: boolean;
  showZoomCtrl?: boolean;
  doubleClickZoom?: boolean;
  keyboardZoom?: boolean;
  mouseZoom?: boolean;
  draggable?: boolean;
  disableKeyboardCtrl?: boolean;
  showFullscreenCtrl?: boolean;
  showControls?: boolean;
  onLoad?: () => void;
  onScenechange?: () => void;
  onScenechangefadedone?: () => void;
  onError?: (error?: any) => void;
  onErrorcleared?: () => void;
  onMousedown?: (event: MouseEvent) => void;
  onMouseup?: (event: MouseEvent) => void;
  onTouchstart?: (event: TouchEvent) => void;
  onTouchend?: (event: TouchEvent) => void;
  hotspotDebug?: boolean;
  tooltip?: (hotSpotDiv: HTMLElement, args: any) => void;
  tooltipArg?: any;
  handleClick?: (e: any, args: any) => void;
  handleClickArg?: any;
  cssClass?: string;
  onRender?: (event: any) => void;
  children?: any;
}

declare class Pannellum extends PureComponent<PannellumProps> {
  panorama: any;
  imageNode: HTMLDivElement;
  renderImage(state: string): void;
  getViewer(): any;
  forceRender(): void;
}

export default Pannellum;
