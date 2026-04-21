import { getMarkerCenter } from "./detector.js";

const AXIS_LENGTH_METERS = 0.06;

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

export function drawAxes(ctx, canvas, markerPose) {
  if (!markerPose) return;

  const origin = projectPoint(canvas, markerPose.rotation, markerPose.translation, {
    x: 0,
    y: 0,
    z: 0
  });

  const xAxis = projectPoint(canvas, markerPose.rotation, markerPose.translation, {
    x: AXIS_LENGTH_METERS,
    y: 0,
    z: 0
  });

  const yAxis = projectPoint(canvas, markerPose.rotation, markerPose.translation, {
    x: 0,
    y: AXIS_LENGTH_METERS,
    z: 0
  });

  const zAxisRaw = projectPoint(canvas, markerPose.rotation, markerPose.translation, {
    x: 0,
    y: 0,
    z: AXIS_LENGTH_METERS
  });

  const zAxis = {
    x: origin.x + (origin.x - zAxisRaw.x),
    y: origin.y + (origin.y - zAxisRaw.y)
  };

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(xAxis.x, xAxis.y);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(yAxis.x, yAxis.y);
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(zAxis.x, zAxis.y);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 4;
  ctx.stroke();
}

export function drawDebugOverlay(ctx, boardSummary, referenceMarker, markerCount, debugData = {}) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.fillRect(12, 12, 430, 390);

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

  ctx.fillText(
    `Distanz: ${debugData.distance !== null && debugData.distance !== undefined ? debugData.distance.toFixed(2) : "-"} m`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `Norm X: ${debugData.normX !== null && debugData.normX !== undefined ? debugData.normX.toFixed(2) : "-"}`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `Norm Y: ${debugData.normY !== null && debugData.normY !== undefined ? debugData.normY.toFixed(2) : "-"}`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `Local X: ${debugData.localX !== null && debugData.localX !== undefined ? debugData.localX.toFixed(2) : "-"}`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `Local Y: ${debugData.localY !== null && debugData.localY !== undefined ? debugData.localY.toFixed(2) : "-"}`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `Local Z: ${debugData.localZ !== null && debugData.localZ !== undefined ? debugData.localZ.toFixed(2) : "-"}`,
    20,
    y
  );
  y += lineHeight;

  ctx.fillText(`Markergröße: ${boardSummary.markerSize.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand X: ${boardSummary.spacingX.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand Y: ${boardSummary.spacingY.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`ID2 Höhe: ${boardSummary.id2Height.toFixed(2)} m`, 20, y);
}

function projectPoint(canvas, rotation, translation, point3D) {
  const X =
    rotation[0][0] * point3D.x +
    rotation[0][1] * point3D.y +
    rotation[0][2] * point3D.z +
    translation[0];

  const Y =
    rotation[1][0] * point3D.x +
    rotation[1][1] * point3D.y +
    rotation[1][2] * point3D.z +
    translation[1];

  const Z =
    rotation[2][0] * point3D.x +
    rotation[2][1] * point3D.y +
    rotation[2][2] * point3D.z +
    translation[2];

  const focal = canvas.width;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  return {
    x: cx + (focal * X / Z),
    y: cy - (focal * Y / Z)
  };
}