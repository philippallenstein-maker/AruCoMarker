/**
 * Einfache Marker-Erkennung für das neue Repo.
 * Ein-Marker-Modus: nur ID2.
 */

import { VALID_MARKER_IDS } from "./board-config.js";

let detector = null;
let posit = null;
let currentCanvasWidth = null;
let markerSize = 0.1;

export function initDetector(canvasWidth, markerSizeMeters = 0.1) {
  detector = new AR.Detector({
    dictionaryName: "ARUCO"
  });

  posit = new POS.Posit(markerSizeMeters, canvasWidth);
  currentCanvasWidth = canvasWidth;
  markerSize = markerSizeMeters;
}

export function ensureDetector(canvasWidth) {
  if (!detector || !posit || currentCanvasWidth !== canvasWidth) {
    initDetector(canvasWidth, markerSize);
  }
}

export function detectMarkers(ctx, canvas) {
  if (!detector) return [];

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const detectedMarkers = detector.detect(imageData);

  const filtered = dedupeMarkersByLargestArea(detectedMarkers);
  return filtered.filter(marker => VALID_MARKER_IDS.includes(marker.id));
}

export function chooseReferenceMarker(markers) {
  if (!markers.length) return null;
  return markers[0];
}

export function estimateMarkerPose(marker, canvas) {
  if (!posit || !marker) return null;

  const positCorners = marker.corners.map(corner => ({
    x: corner.x - canvas.width / 2,
    y: canvas.height / 2 - corner.y
  }));

  const pose = posit.pose(positCorners);

  if (!pose || !pose.bestTranslation || !pose.bestRotation) {
    return null;
  }

  return {
    id: marker.id,
    translation: pose.bestTranslation,
    rotation: pose.bestRotation
  };
}

export function getMarkerArea(marker) {
  const corners = marker.corners;
  let area = 0;

  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    area += corners[i].x * corners[j].y;
    area -= corners[j].x * corners[i].y;
  }

  return Math.abs(area / 2);
}

export function getMarkerCenter(marker) {
  let x = 0;
  let y = 0;

  for (const corner of marker.corners) {
    x += corner.x;
    y += corner.y;
  }

  return {
    x: x / marker.corners.length,
    y: y / marker.corners.length
  };
}

function dedupeMarkersByLargestArea(markers) {
  const bestById = new Map();

  for (const marker of markers) {
    const area = getMarkerArea(marker);
    const existing = bestById.get(marker.id);

    if (!existing || area > existing.area) {
      bestById.set(marker.id, { marker, area });
    }
  }

  return Array.from(bestById.values()).map(entry => entry.marker);
}