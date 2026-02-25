// Generated from /playground
// Relative positions (0..1) over floorplan image.
export const floorplanScenePositions = [
  { id: "scene-1", x: 0.938, y: 0.4006578947368421 },
  { id: "scene-2", x: 0.5888157894736842, y: 0.28289473684210525 },
  { id: "scene-3", x: 0.6263157894736842, y: 0.5796052631578947 },
];

export const data = {
  scenes: [
    {
      id: "scene-1",
      name: "scene-1",
      imageUrl: "blob:http://localhost:5174/52d0b828-241e-4fc3-a732-c4e513ec4405", // original file: Apartment2_360_01.jpg
      equirectWidth: 4000,
      initialViewParameters: {
        pitch: 5,
        yaw: 295,
        fov: 100,
      },
      linkHotspots: [
        { yaw: -1.65732, pitch: -22.765205, target: "scene-2" },
        { yaw: -42.054088, pitch: -14.062712, target: "scene-3" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-2",
      name: "scene-2",
      imageUrl: "blob:http://localhost:5174/23a8a171-9140-4769-87c1-a4e465bc7551", // original file: Apartment2_360_02.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 178.901774, pitch: -21.890689, target: "scene-1" },
        { yaw: -79.0674, pitch: -21.006124, target: "scene-3" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-3",
      name: "scene-3",
      imageUrl: "blob:http://localhost:5174/d74a6b03-78b6-468d-99f2-31b65ebacea0", // original file: Apartment2_360_03.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 133.139627, pitch: -17.155637, target: "scene-1" },
        { yaw: 85.68115, pitch: -23.16039, target: "scene-2" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "Apartment2",
  floorplanImageUrl: "blob:http://localhost:5174/63ba9b52-7225-4941-a22a-e5fe34331615",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: false,
  },
};