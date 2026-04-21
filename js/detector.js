/**
 * Einfache Marker-Erkennung für das neue Repo.
 * Nutzt weiterhin js-aruco2, damit wir im Browser direkt etwas sehen.
 *
 * WICHTIG:
 * Das ist nur die Erkennungsstufe.
 * Die eigentliche Board-/Pose-Logik kommt danach sauber oben drauf.
 */

let detector = null;

export function initDetector() {
  detector = new AR.Detector({
    dictionaryName: "ARUCO"
  });
}

export function detectMarkers(ctx, canvas) {
  if (!detector) return [];

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const detectedMarkers = detector.detect(imageData);

  return dedupeMarkersByLargestArea(detectedMarkers);
}

export function chooseReferenceMarker(markers) {
  if (!markers.length) return null;

  return [...markers].sort((a, b) => getMarkerArea(b) - getMarkerArea(a))[0];
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