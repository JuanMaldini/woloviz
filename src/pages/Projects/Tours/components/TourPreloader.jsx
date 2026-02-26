import { useEffect } from "react";
import {
  startBackgroundQueue,
  cancelBackgroundQueue,
} from "../utils/tourPreloadManager";

/**
 * TourPreloader — null-render component that starts the background asset queue.
 *
 * Mount it on any page where you want preloading to begin silently in background.
 * Set `enabled={false}` to disable without removing the component.
 *
 * @param {{ enabled?: boolean }} props
 */
const TourPreloader = ({ enabled = true }) => {
  useEffect(() => {
    if (!enabled) {
      console.log(
        "[TourPreload] TourPreloader mounted but disabled (enabled=false)",
      );
      return undefined;
    }

    console.log(
      "[TourPreload] TourPreloader mounted — triggering background queue",
    );
    startBackgroundQueue();

    return () => {
      console.log("[TourPreload] TourPreloader unmounted — cancelling queue");
      cancelBackgroundQueue();
    };
  }, [enabled]);

  return null;
};

export default TourPreloader;
