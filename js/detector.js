/**
 * Einfache Marker-Erkennung für das neue Repo.
 * Nutzt js-aruco2 im Browser.
 */

let detector = null;
let posit = null;
let currentCanvasWidth = null;
let markerSize = 0.1;

// Referenzmarker-Stabilisierung
let lastReferenceId = null;

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

  return dedupeMarkersByLargestArea(detectedMarkers);
}

/**
 * Referenzmarker stabil wählen:
 * - bisherigen Marker behalten, wenn er noch sichtbar ist
 * - nur wechseln, wenn ein anderer deutlich größer ist
 */
export function chooseReferenceMarker(markers) {
  if (!markers.length) {
    lastReferenceId = null;
    return null;
  }

  const biggest = [...markers].sort((a, b) => getMarkerArea(b) - getMarkerArea(a))[0];

  if (lastReferenceId !== null) {
    const previous = markers.find(m => m.id === lastReferenceId);

    if (previous) {
      const previousArea = getMarkerArea(previous);
      const biggestArea = getMarkerArea(biggest);

      // erst wechseln, wenn neuer Marker deutlich besser ist
      if (biggest.id !== previous.id && biggestArea > previousArea * 1.35) {
        lastReferenceId = biggest.id;
        return biggest;
      }

      return previous;
    }
  }

  lastReferenceId = biggest.id;
  return biggest;
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