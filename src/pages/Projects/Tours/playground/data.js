// Generated from /playground
// Relative positions (0..1) over floorplan image.
export const floorplanScenePositions = [
  { id: "scene-1", x: 0.938, y: 0.4006578947368421 },
  { id: "scene-2", x: 0.5888157894736842, y: 0.28289473684210525 },
  { id: "scene-3", x: 0.776, y: 0.5796052631578947 },
  { id: "scene-4", x: 0.5, y: 0.5 },
];

export const data = {
  scenes: [
    {
      id: "scene-1",
      name: "scene1",
      imageUrl: "blob:http://localhost:5173/1081bf84-e9c3-45f3-86e5-ac70cc0f5e0c", // original file: Apartment2_360_01.jpg
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
      name: "scene2",
      imageUrl: "blob:http://localhost:5173/a42efe70-c6c7-470d-9c6a-8d916bbcde68", // original file: Apartment2_360_02.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 178.901774, pitch: -21.890689, target: "scene-1" },
        { yaw: -79.0674, pitch: -21.006124, target: "scene-3" },
        { yaw: -99.495114, pitch: -15.770656, target: "scene-4" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-3",
      name: "scene3",
      imageUrl: "blob:http://localhost:5173/f1abef98-d2eb-4ef7-b483-56059d77e450", // original file: Apartment2_360_03.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 133.139627, pitch: -17.155637, target: "scene-1" },
        { yaw: 85.68115, pitch: -23.16039, target: "scene-2" },
        { yaw: -114.628321, pitch: -38.19572, target: "scene-4" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-4",
      name: "scene4",
      imageUrl: "blob:http://localhost:5173/0410f943-286f-41c3-bad5-cda5baf3e089", // original file: Apartment2_360_04.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 117.383696, pitch: -12.720225, target: "scene-1" },
        { yaw: 79.303294, pitch: -15.399052, target: "scene-2" },
        { yaw: 51.74327, pitch: -34.171095, target: "scene-3" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "Apartment2",
  floorplanImageUrl: "blob:http://localhost:5173/657f50f8-ab04-481e-a639-8c181159d20a",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: false,
  },
};