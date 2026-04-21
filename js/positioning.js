import { getMarkerCenter } from "./detector.js";

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
 * Normierte Markerabweichung relativ zur Bildmitte.
 * -1 ... 0 ... +1
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
 * Ein-Marker-Positionsschätzung relativ zu ID2 in der Wandmitte.
 *
 * Markerzentrum = (0,0,0)
 * X = links/rechts
 * Y = oben/unten
 * Z = Abstand zur Wand
 *
 * gainX / gainY sind Kalibrierfaktoren für die seitliche Abschätzung.
 */
export function estimateLocalBoardPosition(normOffset, distance) {
  if (!normOffset || distance === null) return null;

  const gainX = 0.45;
  const gainY = 0.35;

  return {
    x: normOffset.normX * gainX,
    y: normOffset.normY * gainY,
    z: distance
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