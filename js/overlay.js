import { getMarkerCenter } from "./detector.js";

/**
 * Overlay-Funktionen:
 * - Markerrahmen
 * - Marker-ID
 * - Referenzmarker hervorheben
 * - Debug-Info links oben
 */

export function drawMarkers(ctx, markers, referenceMarker) {
  for (const marker of markers) {
    const corners = marker.corners;
    const isReference = referenceMarker && marker.id === referenceMarker.id;

    ctx.strokeStyle = isReference ? "#00ffff" : "#00ff00";
    ctx.lineWidth = isReference ? 5 : 3;

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);

    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }

    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = isReference ? "#00ffff" : "#00ff00";
    ctx.beginPath();
    ctx.arc(corners[0].x, corners[0].y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff3333";
    ctx.font = "20px Arial";
    ctx.fillText(
      isReference ? `REF ID: ${marker.id}` : `ID: ${marker.id}`,
      corners[0].x,
      corners[0].y - 10
    );
  }
}

export function drawDebugOverlay(ctx, boardSummary, referenceMarker, markerCount) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(12, 12, 420, 280);

  ctx.fillStyle = "yellow";
  ctx.font = "16px Arial";

  let y = 35;
  const lineHeight = 24;

  ctx.fillText("OpenCV / Board-Projekt – Erkennung läuft", 20, y);
  y += lineHeight;

  ctx.fillText(`Marker erkannt: ${markerCount}`, 20, y);
  y += lineHeight;

  ctx.fillText(`Ref-ID: ${referenceMarker ? referenceMarker.id : "-"}`, 20, y);
  y += lineHeight;

  if (referenceMarker) {
    const center = getMarkerCenter(referenceMarker);
    ctx.fillText(`Center X: ${center.x.toFixed(0)} px`, 20, y);
    y += lineHeight;
    ctx.fillText(`Center Y: ${center.y.toFixed(0)} px`, 20, y);
    y += lineHeight;
  } else {
    ctx.fillText("Center X: -", 20, y);
    y += lineHeight;
    ctx.fillText("Center Y: -", 20, y);
    y += lineHeight;
  }

  ctx.fillText(`Markergröße: ${boardSummary.markerSize.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand X: ${boardSummary.spacingX.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand Y: ${boardSummary.spacingY.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`ID2 Höhe: ${boardSummary.id2Height.toFixed(2)} m`, 20, y);
}