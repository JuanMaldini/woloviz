/**
 * Ordered list of tours to preload in the background.
 * The background queue respects this order.
 *
 * - getData: lazy dynamic import so modules are only loaded when needed.
 * - getFloorplanUrl: returns the floorplan asset URL for inclusion in the manifest.
 *
 * To disable background preloading for a tour, remove its entry or set enabled: false.
 * To change the preload priority, reorder the array.
 */
export const TOUR_PRELOAD_CONFIG = [
  {
    id: "apartment-1",
    getData: () => import("../Apartment1/Apartment1").then((m) => m.data),
    getFloorplanUrl: () =>
      new URL("/projects/Apartment1/Apartment1-Floorplan.png", import.meta.url)
        .href,
  },
  {
    id: "apartment-2",
    getData: () => import("../Apartment2/Apartment2").then((m) => m.data),
    getFloorplanUrl: () =>
      new URL("/projects/Apartment2/Apartment2_360_top.jpg", import.meta.url)
        .href,
  },
  {
    id: "apartment-3",
    getData: () => import("../Apartment3/Apartment3").then((m) => m.data),
    getFloorplanUrl: () =>
      new URL("/projects/Sampleaib/Floorplan.png", import.meta.url).href,
  },
];
