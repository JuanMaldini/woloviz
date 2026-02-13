// Generated from /playground
// Relative positions (0..1) over floorplan image.
export const floorplanScenePositions = [
  { id: "scene-1", x: 0.3, y: 0.25 },
  { id: "scene-2", x: 0, y: 0.05 },
];

export const data = {
  scenes: [
    {
      id: "scene-1",
      name: "scene-1",
      imageUrl: "blob:http://localhost:5173/2bb3bbf4-a706-408f-b0a3-3b9167e17d5a",
      equirectWidth: 4000,
      initialViewParameters: {
        pitch: 10,
        yaw: 90,
        fov: 100,
      },
      linkHotspots: [
        { yaw: 80.049569, pitch: -38.538231, target: "scene-2" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-2",
      name: "scene-2",
      imageUrl: "blob:http://localhost:5173/0edbb38f-ff62-4c17-850e-65a2d0c5bbf4",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: -77.401863, pitch: -39.979007, target: "scene-1" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "tourn-name",
  floorplanImageUrl: "blob:http://localhost:5173/1711ea30-8670-4e49-8d94-857705e9dbf7",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: false,
  },
};