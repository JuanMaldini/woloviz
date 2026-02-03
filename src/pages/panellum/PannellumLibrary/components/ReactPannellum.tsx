import React from "react";
import PropTypes from "prop-types";
// @ts-ignore - pannellum library doesn't have type definitions
import pannellum from "../libs/pannellum";
import { myPromise } from "../utils/utils";
import { configs } from "../utils/constants";
import "../css/pannellum.css";

let myPannellum: any = null;
let myViewers: any[] = [];

interface ReactPannellumProps {
  id: string;
  sceneId: string;
  children?: any;
  type?: string;
  imageSource?: string;
  equirectangularOptions?: Record<string, any>;
  cubeMap?: string[];
  multiRes?: Record<string, any>;
  config?: Record<string, any>;
  className?: string;
  style?: Record<string, any>;
  onPanoramaLoaded?: () => void;
  onPanoramaMouseUp?: (event: MouseEvent) => void;
  onPanoramaMouseDown?: (event: MouseEvent) => void;
}

interface ReactPannellumState {
  imageSource: string;
  equirectangularOptions: Record<string, any>;
  cubeMap: string[];
  multiRes: Record<string, any>;
}

class ReactPannellum extends React.Component<
  ReactPannellumProps,
  ReactPannellumState
> {
  static propTypes = {
    id: PropTypes.string.isRequired,
    sceneId: PropTypes.string.isRequired,
    children: PropTypes.any,
    type: PropTypes.string,
    imageSource: PropTypes.string,
    equirectangularOptions: PropTypes.shape({}),
    cubeMap: PropTypes.arrayOf(PropTypes.string),
    multiRes: PropTypes.shape({
      basePath: PropTypes.string,
      path: PropTypes.string,
      fallbackPath: PropTypes.string,
      extension: PropTypes.string,
      tileResolution: PropTypes.number,
      maxLevel: PropTypes.number,
      cubeResolution: PropTypes.number,
    }),
    config: PropTypes.shape({}),
    className: PropTypes.string,
    style: PropTypes.shape({}),
    onPanoramaLoaded: PropTypes.func,
    onPanoramaMouseUp: PropTypes.func,
    onPanoramaMouseDown: PropTypes.func,
  };

  static defaultProps = {
    type: "equirectangular",
    imageSource: "",
    equirectangularOptions: {},
    cubeMap: [],
    multiRes: {},
    className: "",
    style: configs.styles,
    config: {},
  };

  state: ReactPannellumState = {
    imageSource: "",
    equirectangularOptions: {},
    cubeMap: [],
    multiRes: {},
  };

  init = () => {
    const { imageSource, equirectangularOptions, cubeMap, multiRes } =
      this.state;
    const { sceneId, config, type } = this.props;
    myPannellum = pannellum.viewer(this.props.id, {
      default: {
        firstScene: sceneId,
      },
      scenes: {
        [sceneId]: JSON.parse(
          JSON.stringify({
            ...configs.panoramaConfigs,
            ...configs.equirectangularOptions,
            ...configs.uiText,
            ...config,
            type,
            imageSource,
            ...equirectangularOptions,
            cubeMap,
            multiRes,
          }),
        ),
      },
    });
    myViewers.push(myPannellum);
    this.props.onPanoramaLoaded &&
      myPannellum.on("load", () => this.props.onPanoramaLoaded?.());
    this.props.onPanoramaMouseDown &&
      myPannellum.on("mousedown", (event: MouseEvent) =>
        this.props.onPanoramaMouseDown?.(event),
      );
    this.props.onPanoramaMouseUp &&
      myPannellum.on("mouseup", (event: MouseEvent) =>
        this.props.onPanoramaMouseUp?.(event),
      );
  };

  initPanalleum() {
    const {
      imageSource = "",
      type,
      cubeMap = [],
      multiRes = {},
      equirectangularOptions = {},
    } = this.props;
    switch (type) {
      case "equirectangular":
        this.setState(
          {
            imageSource,
            equirectangularOptions,
            cubeMap: [],
          },
          () => this.init(),
        );
        break;
      case "cubemap":
        this.setState(
          {
            cubeMap,
            imageSource: "",
          },
          () => this.init(),
        );
        break;
      case "multires":
        this.setState(
          {
            cubeMap: [],
            imageSource: "",
            multiRes,
          },
          () => this.init(),
        );
        break;
      default:
        break;
    }
  }

  componentDidMount() {
    this.initPanalleum();
  }

  componentWillUnmount() {
    if (myPannellum) {
      this.props.onPanoramaLoaded &&
        myPannellum.off("load", this.props.onPanoramaLoaded);
      this.props.onPanoramaMouseDown &&
        myPannellum.off("mousedown", () => this.props.onPanoramaMouseDown);
      this.props.onPanoramaMouseUp &&
        myPannellum.off("mouseup", () => this.props.onPanoramaMouseUp);
    }
  }

  static isLoaded() {
    return myPannellum && myPannellum.isLoaded();
  }

  static getPitch() {
    return myPannellum && myPannellum.getPitch();
  }

  static setPitch(
    pitch: number,
    animated: number = 1000,
    callback?: Function,
    callbackArgs?: any,
  ) {
    if (myPannellum) {
      myPannellum.setPitch(pitch, animated, callback, callbackArgs);
    }
  }

  static getPitchBounds() {
    return myPannellum && myPannellum.getPitchBounds();
  }

  static setPitchBounds(bounds: any) {
    if (myPannellum) {
      myPannellum.setPitchBounds(bounds);
    }
  }

  static getYaw() {
    return myPannellum && myPannellum.getYaw();
  }

  static setYaw(
    yaw: number,
    animated: number = 1000,
    callback?: Function,
    callbackArgs?: any,
  ) {
    if (myPannellum) {
      myPannellum.setYaw(yaw, animated, callback, callbackArgs);
    }
  }

  static getYawBounds() {
    return myPannellum && myPannellum.getYawBounds();
  }

  static setYawBounds(bounds: any) {
    myPromise(myPannellum, { bounds })
      .then(({ bounds }: any) => {
        myPannellum.setYawBounds(bounds);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static getHfov() {
    return myPannellum && myPannellum.getHfov();
  }

  static setHfov(
    hfov: number,
    animated: number = 1000,
    callback?: Function,
    callbackArgs?: any,
  ) {
    if (myPannellum) {
      myPannellum.setHfov(hfov, animated, callback, callbackArgs);
    }
  }

  static getHfovBounds() {
    return myPannellum && myPannellum.getHfovBounds();
  }

  static setHfovBounds(bounds: any) {
    myPromise(myPannellum, { bounds })
      .then(({ bounds }: any) => {
        myPannellum.setHfovBounds(bounds);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static lookAt(
    pitch: number,
    yaw: number,
    hfov: number,
    animated: number = 1000,
    callback?: Function,
    callbackArgs?: any,
  ) {
    if (myPannellum) {
      myPannellum.lookAt(pitch, yaw, hfov, animated, callback, callbackArgs);
    }
  }

  static getNorthOffset() {
    return myPannellum && myPannellum.getNorthOffset();
  }

  static setNorthOffset(heading: number) {
    myPromise(myPannellum, { heading })
      .then(({ heading }: any) => {
        myPannellum.setNorthOffset(heading);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static getHorizonRoll() {
    return myPannellum && myPannellum.getHorizonRoll();
  }

  static setHorizonRoll(roll: number) {
    myPromise(myPannellum, { roll })
      .then(({ roll }: any) => {
        myPannellum.setHorizonRoll(roll);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static getHorizonPitch() {
    return myPannellum && myPannellum.getHorizonPitch();
  }

  static setHorizonPitch(pitch: number) {
    myPromise(myPannellum, { pitch })
      .then(({ pitch }: any) => {
        myPannellum.setHorizonPitch(pitch);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static startAutoRotate(speed: number, pitch?: number) {
    myPromise(myPannellum, { pitch })
      .then(({ pitch }: any) => {
        myPannellum.startAutoRotate(speed, pitch);
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  static stopAutoRotate() {
    if (myPannellum) {
      myPannellum.stopAutoRotate();
    }
  }

  static mouseEventToCoords(event: MouseEvent) {
    return myPannellum && myPannellum.mouseEventToCoords(event);
  }

  static addScene(
    sceneId: string,
    config: Record<string, any>,
    callback?: Function,
  ) {
    if (
      sceneId &&
      sceneId !== "" &&
      config &&
      JSON.stringify(config) !== "{}"
    ) {
      myPromise(myPannellum, { sceneId, config, callback })
        .then(({ sceneId, config, callback }: any) => {
          myPannellum.addScene(sceneId, config);
          callback && callback();
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      console.log(
        "sceneId cannot be empty and config.imageSource cannot be empty!!",
      );
    }
  }

  static getCurrentScene() {
    return myPannellum && myPannellum.getScene();
  }

  static getAllScenes() {
    return myPannellum && myPannellum.getAllScenes();
  }

  static removeScene(sceneId: string, callback?: Function) {
    if (sceneId && sceneId !== "") {
      myPromise(myPannellum, { sceneId })
        .then(({ sceneId }: any) => {
          myPannellum.removeScene(sceneId);
          callback && callback();
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      console.log("sceneId cannot be empty");
    }
  }

  static loadScene(
    sceneId: string,
    targetPitch?: number,
    targetYaw?: number,
    targetHfov?: number,
    fadeDone?: Function,
  ) {
    if (myPannellum && sceneId && sceneId !== "") {
      myPannellum.loadScene(
        sceneId,
        targetPitch,
        targetYaw,
        targetHfov,
        fadeDone,
      );
    }
  }

  static toggleFullscreen() {
    return myPannellum && myPannellum.toggleFullscreen();
  }

  static getConfig() {
    return myPannellum && myPannellum.getConfig();
  }

  static getContainer() {
    return myPannellum && myPannellum.getContainer();
  }

  static addHotSpot(hotspot: Record<string, any>, sceneId?: string) {
    if (JSON.stringify(hotspot) !== "{}") {
      myPromise(myPannellum, { hotspot, sceneId })
        .then(({ hotspot, sceneId }: any) => {
          myPannellum.addHotSpot(hotspot, sceneId);
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      console.log(
        "hotspot cannot be empty, please check hotspot elements needed in document: config props `hotSpots`.",
      );
    }
  }

  static removeHotSpot(hotSpotId: string, sceneId?: string) {
    if (hotSpotId !== "") {
      myPromise(myPannellum, { hotSpotId, sceneId })
        .then(({ hotSpotId, sceneId }: any) => {
          myPannellum.removeHotSpot(hotSpotId, sceneId);
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      console.log("hotspotId cannot be empty!!");
    }
  }

  static destroy() {
    return myPannellum && myPannellum.destroy();
  }

  static stopMovement() {
    return myPannellum && myPannellum.stopMovement();
  }

  static resize() {
    return myPannellum && myPannellum.resize();
  }

  static isOrientationSupported() {
    return myPannellum && myPannellum.isOrientationSupported();
  }

  static stopOrientation() {
    return myPannellum && myPannellum.stopOrientation();
  }

  static startOrientation() {
    return myPannellum && myPannellum.startOrientation();
  }

  static isOrientationActive() {
    return myPannellum && myPannellum.isOrientationActive();
  }

  static getViewer() {
    return myPannellum;
  }

  static getViewers() {
    return myViewers;
  }

  render() {
    const { style, className, id, children } = this.props;
    return (
      <div id={id} style={style} className={className} children={children} />
    );
  }
}

export default ReactPannellum;
