// Generated from /playground
// Relative positions (0..1) over floorplan image.
export const floorplanScenePositions = [
  { id: "scene-1", x: 0.899, y: 0 },
  { id: "scene-2", x: 0.593, y: 0.23 },
];

export const data = {
  scenes: [
    {
      id: "scene-1",
      name: "scene-1",
      imageUrl: "blob:http://localhost:5174/079106d6-2d44-4cf8-a1dd-43d702d6723c", // original file: camera_360_01.jpg
      equirectWidth: 4000,
      initialViewParameters: {
        pitch: 5,
        yaw: 295,
        fov: 100,
      },
      linkHotspots: [
        { yaw: -1.65732, pitch: -22.765205, target: "scene-2" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-2",
      name: "scene-2",
      imageUrl: "blob:http://localhost:5174/781ec774-12dd-4176-a3be-c228d3571761", // original file: camera_360_02.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 178.901774, pitch: -21.890689, target: "scene-1" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "Apartment-2",
  floorplanImageUrl: "blob:http://localhost:5173/991fbda9-9187-4f5b-b43a-16d79bbe92a9",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: false,
  },
};