import { useEffect } from "react";
import { IoAdd, IoChevronDown, IoChevronForward, IoChevronUp, IoRemove } from "react-icons/io5";

const METHOD_DEFINITIONS = [
  { id: "viewUp", methodName: "upElement", axis: "y", velocitySign: -1 },
  { id: "viewDown", methodName: "downElement", axis: "y", velocitySign: 1 },
  { id: "viewLeft", methodName: "leftElement", axis: "x", velocitySign: -1 },
  { id: "viewRight", methodName: "rightElement", axis: "x", velocitySign: 1 },
  { id: "viewIn", methodName: "inElement", axis: "zoom", velocitySign: -1 },
  { id: "viewOut", methodName: "outElement", axis: "zoom", velocitySign: 1 },
];

const ViewControlButtons = ({
  rootRef,
  viewer,
  Marzipano,
  enabled = true,
  velocity = 0.7,
  friction = 3,
}) => {
  useEffect(() => {
    if (enabled) {
      document.body.classList.add("view-control-buttons");
    } else {
      document.body.classList.remove("view-control-buttons");
    }

    return () => {
      document.body.classList.remove("view-control-buttons");
    };
  }, [enabled]);

  useEffect(() => {
    const root = rootRef?.current;

    if (!root || !viewer || !Marzipano || !enabled) {
      return undefined;
    }

    const controls = viewer.controls();
    const registeredMethods = [];

    METHOD_DEFINITIONS.forEach(({ id, methodName, axis, velocitySign }) => {
      const element = root.querySelector(`#${id}`);
      if (!element) {
        return;
      }

      controls.registerMethod(
        methodName,
        new Marzipano.ElementPressControlMethod(
          element,
          axis,
          velocitySign * velocity,
          friction,
        ),
        true,
      );
      registeredMethods.push(methodName);
    });

    return () => {
      if (typeof controls.unregisterMethod === "function") {
        registeredMethods.forEach((methodName) => {
          controls.unregisterMethod(methodName);
        });
      }
    };
  }, [rootRef, viewer, Marzipano, enabled, velocity, friction]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        id="viewUp"
        className="viewControlButton viewControlButton-1"
        aria-label="View up"
      >
        <IoChevronUp className="icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        id="viewDown"
        className="viewControlButton viewControlButton-2"
        aria-label="View down"
      >
        <IoChevronDown className="icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        id="viewLeft"
        className="viewControlButton viewControlButton-3"
        aria-label="View left"
      >
        <IoChevronForward
          className="icon"
          aria-hidden="true"
          style={{ transform: "rotate(180deg)" }}
        />
      </button>
      <button
        type="button"
        id="viewRight"
        className="viewControlButton viewControlButton-4"
        aria-label="View right"
      >
        <IoChevronForward className="icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        id="viewIn"
        className="viewControlButton viewControlButton-5"
        aria-label="Zoom in"
      >
        <IoAdd className="icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        id="viewOut"
        className="viewControlButton viewControlButton-6"
        aria-label="Zoom out"
      >
        <IoRemove className="icon" aria-hidden="true" />
      </button>
    </>
  );
};

export default ViewControlButtons;
