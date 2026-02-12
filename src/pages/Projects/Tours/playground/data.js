// Generated from /playground
// Percentage-based positions so markers stay aligned on resize.
export const floorplanScenePositions = [
  { id: "escena-1", x: 100, y: 100 },
  { id: "escena-2", x: 60, y: 60 },
];

export const data = {
  scenes: [
    {
      id: "escena-1",
      name: "escena 1",
      imageUrl: "/projects/Sampleai/Sample_AI09_01.jpg",
      equirectWidth: 4000,
      initialViewParameters: {
        pitch: 0,
        yaw: 10,
        fov: 110,
      },
      linkHotspots: [
        { yaw: 100, pitch: 100, target: "escena-2" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "escena-2",
      name: "escena 2",
      imageUrl: "/projects/Sampleai/Sample_AI09_02.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 50, pitch: 50, target: "escena-1" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "Sample AI Tour",
  floorplanImageUrl: "/projects/Sampleai/Floorplan.png",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: true,
  },
};