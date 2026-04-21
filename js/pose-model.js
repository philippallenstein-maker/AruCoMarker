import { BOARD, MARKER_CENTERS, VALID_MARKER_IDS } from "./board-config.js";

export function getMarkerCorners3D(markerId) {
  const center = MARKER_CENTERS[markerId];
  if (!center) return null;

  const half = BOARD.markerSize / 2;

  return [
    { x: center.x - half, y: center.y + half, z: center.z },
    { x: center.x + half, y: center.y + half, z: center.z },
    { x: center.x + half, y: center.y - half, z: center.z },
    { x: center.x - half, y: center.y - half, z: center.z }
  ];
}

export function getBoardObjectModel() {
  const model = {};

  for (const id of VALID_MARKER_IDS) {
    model[id] = getMarkerCorners3D(id);
  }

  return model;
}

export function getAllBoardPointsFlat() {
  const points = [];

  for (const id of VALID_MARKER_IDS) {
    const corners = getMarkerCorners3D(id);
    if (!corners) continue;

    for (const corner of corners) {
      points.push({
        markerId: id,
        x: corner.x,
        y: corner.y,
        z: corner.z
      });
    }
  }

  return points;
}

export function getBoardSummary() {
  return {
    markerSize: BOARD.markerSize,
    spacingX: BOARD.spacingX,
    spacingY: BOARD.spacingY,
    id2Height: BOARD.id2Height,
    markerCenters: MARKER_CENTERS
  };
}