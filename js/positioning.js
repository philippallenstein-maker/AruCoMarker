import { getMarkerCenter } from "./detector.js";
import { MARKER_CENTERS } from "./board-config.js";

/**
 * Distanz aus Markergröße in Pixeln.
 */
export function estimateDistanceFromMarker(marker, markerSizeMeters, focalLengthPx) {
  if (!marker) return null;

  const pixelSize = getMarkerPixelSize(marker);
  if (pixelSize <= 1) return null;

  return (focalLengthPx * markerSizeMeters) / pixelSize;
}

/**
 * Normierte Bildlage des Referenzmarkers.
 */
export function calculateNormalizedMarkerOffset(marker, canvas) {
  if (!marker || !canvas) return null;

  const center = getMarkerCenter(marker);

  const normX = (center.x - canvas.width / 2) / (canvas.width / 2);
  const normY = (center.y - canvas.height / 2) / (canvas.height / 2);

  return {
    centerX: center.x,
    centerY: center.y,
    normX,
    normY
  };
}

/**
 * Einfache lokale Position aus EINEM Referenzmarker.
 */
export function estimateLocalBoardPosition(referenceMarker, normOffset, distance) {
  if (!referenceMarker || !normOffset || distance === null) return null;

  const anchor = MARKER_CENTERS[referenceMarker.id];
  if (!anchor) return null;

  const gainX = 0.35;
  const gainY = 0.25;

  return {
    x: anchor.x + normOffset.normX * gainX,
    y: anchor.y + normOffset.normY * gainY,
    z: distance
  };
}

/**
 * Bessere Mehrmarker-Schätzung:
 * - Für jeden sichtbaren Marker eigene lokale Schätzung
 * - danach Mittelwert bilden
 */
export function estimateMultiMarkerBoardPosition(markers, canvas, markerSizeMeters, focalLengthPx) {
  if (!markers || !markers.length) return null;

  const gainX = 0.35;
  const gainY = 0.25;

  const estimates = [];

  for (const marker of markers) {
    const anchor = MARKER_CENTERS[marker.id];
    if (!anchor) continue;

    const center = getMarkerCenter(marker);
    const normX = (center.x - canvas.width / 2) / (canvas.width / 2);
    const normY = (center.y - canvas.height / 2) / (canvas.height / 2);
    const distance = estimateDistanceFromMarker(marker, markerSizeMeters, focalLengthPx);

    if (distance === null) continue;

    estimates.push({
      x: anchor.x + normX * gainX,
      y: anchor.y + normY * gainY,
      z: distance
    });
  }

  if (!estimates.length) return null;

  const sum = estimates.reduce(
    (acc, item) => {
      acc.x += item.x;
      acc.y += item.y;
      acc.z += item.z;
      return acc;
    },
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / estimates.length,
    y: sum.y / estimates.length,
    z: sum.z / estimates.length
  };
}

function getMarkerPixelSize(marker) {
  const c = marker.corners;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  const d1 = dist(c[0], c[1]);
  const d2 = dist(c[1], c[2]);
  const d3 = dist(c[2], c[3]);
  const d4 = dist(c[3], c[0]);

  return (d1 + d2 + d3 + d4) / 4;
}