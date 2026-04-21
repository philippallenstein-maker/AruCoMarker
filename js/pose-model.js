import { BOARD, MARKER_CENTERS, VALID_MARKER_IDS } from "./board-config.js";

/**
 * Hilfsfunktionen für die 3D-Geometrie des Boards.
 *
 * Ziel:
 * - echte Objektpunkte des Markerboards definieren
 * - später direkt für solvePnP / Board-Pose nutzbar
 */

/**
 * Gibt die 4 Ecken eines Markers im lokalen Board-KS zurück.
 *
 * Reihenfolge:
 * 0 = oben links
 * 1 = oben rechts
 * 2 = unten rechts
 * 3 = unten links
 */
export function getMarkerCorners3D(markerId) {
  const center = MARKER_CENTERS[markerId];
  if (!center) return null;

  const half = BOARD.markerSize / 2;

  return [
    { x: center.x - half, y: center.y + half, z: center.z }, // oben links
    { x: center.x + half, y: center.y + half, z: center.z }, // oben rechts
    { x: center.x + half, y: center.y - half, z: center.z }, // unten rechts
    { x: center.x - half, y: center.y - half, z: center.z }  // unten links
  ];
}

/**
 * Gibt alle Markerobjektpunkte als Map zurück.
 */
export function getBoardObjectModel() {
  const model = {};

  for (const id of VALID_MARKER_IDS) {
    model[id] = getMarkerCorners3D(id);
  }

  return model;
}

/**
 * Flache Liste aller Objektpunkte.
 * Praktisch für späteres Matching mit Bildpunkten.
 */
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

/**
 * Hilfsfunktion für Debug:
 * Textdarstellung des Boards.
 */
export function getBoardSummary() {
  return {
    markerSize: BOARD.markerSize,
    spacingX: BOARD.spacingX,
    spacingY: BOARD.spacingY,
    id2Height: BOARD.id2Height,
    markerCenters: MARKER_CENTERS
  };
}