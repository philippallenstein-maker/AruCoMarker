import { getBoardSummary } from "./pose-model.js";
import {
  initDetector,
  ensureDetector,
  detectMarkers,
  chooseReferenceMarker,
  estimateMarkerPose
} from "./detector.js";
import { drawMarkers, drawAxes, drawDebugOverlay } from "./overlay.js";
import { BOARD } from "./board-config.js";
import {
  estimateDistanceFromMarker,
  calculateNormalizedMarkerOffset,
  estimateLocalBoardPosition
} from "./positioning.js";
import { connectSocket, disconnectSocket, sendData, setSocketStateCallback } from "./websocket.js";

const statusEl = document.getElementById("status");
const wsStatusEl = document.getElementById("wsStatus");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let stream = null;
let rafId = null;
let smoothedLocalPosition = null;

const POSITION_SMOOTHING = 0.72;
const boardSummary = getBoardSummary();
const FOCAL_LENGTH_PX = 900;

setSocketStateCallback((text) => {
  if (wsStatusEl) {
    wsStatusEl.textContent = text;
  }
});

function resizeCanvasToVideo() {
  if (!video.videoWidth || !video.videoHeight) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

function smoothPosition(position) {
  if (!position) {
    smoothedLocalPosition = null;
    return null;
  }

  if (!smoothedLocalPosition) {
    smoothedLocalPosition = { ...position };
    return position;
  }

  smoothedLocalPosition = {
    x: POSITION_SMOOTHING * smoothedLocalPosition.x + (1 - POSITION_SMOOTHING) * position.x,
    y: POSITION_SMOOTHING * smoothedLocalPosition.y + (1 - POSITION_SMOOTHING) * position.y,
    z: POSITION_SMOOTHING * smoothedLocalPosition.z + (1 - POSITION_SMOOTHING) * position.z
  };

  return smoothedLocalPosition;
}

function render() {
  if (video.readyState >= 2) {
    resizeCanvasToVideo();
    ensureDetector(canvas.width);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const markers = detectMarkers(ctx, canvas);
    const referenceMarker = chooseReferenceMarker(markers);
    const referencePose = referenceMarker ? estimateMarkerPose(referenceMarker, canvas) : null;

    let distance = null;
    let offset = null;
    let localPosition = null;

    if (referenceMarker) {
      distance = estimateDistanceFromMarker(referenceMarker, BOARD.markerSize, FOCAL_LENGTH_PX);
      offset = calculateNormalizedMarkerOffset(referenceMarker, canvas);
      localPosition = estimateLocalBoardPosition(offset, distance);
      localPosition = smoothPosition(localPosition);

      if (localPosition) {
        sendData({
          type: "tracking",
          data: {
            referenceId: referenceMarker.id,
            distance,
            normX: offset?.normX ?? null,
            normY: offset?.normY ?? null,
            centerX: offset?.centerX ?? null,
            centerY: offset?.centerY ?? null,
            localX: localPosition?.x ?? null,
            localY: localPosition?.y ?? null,
            localZ: localPosition?.z ?? null,
            markerCount: markers.length,
            ts: Date.now()
          }
        });
      }
    } else {
      smoothedLocalPosition = null;
    }

    drawMarkers(ctx, markers, referenceMarker);

    if (referencePose) {
      drawAxes(ctx, canvas, referencePose);
    }

    drawDebugOverlay(ctx, boardSummary, referenceMarker, markers.length, {
      distance,
      normX: offset?.normX ?? null,
      normY: offset?.normY ?? null,
      localX: localPosition?.x ?? null,
      localY: localPosition?.y ?? null,
      localZ: localPosition?.z ?? null
    });

    if (referenceMarker) {
      statusEl.textContent = `Status: Marker erkannt – ID ${referenceMarker.id}`;
    } else {
      statusEl.textContent = "Status: Kamera läuft – kein Marker erkannt";
    }
  }

  rafId = requestAnimationFrame(render);
}

async function startCamera() {
  try {
    statusEl.textContent = "Status: Kamera startet...";

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    connectSocket();
    initDetector(canvas.width || 640, BOARD.markerSize);

    statusEl.textContent = "Status: Kamera läuft";
    render();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Status: Kamerafehler";
  }
}

function stopCamera() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  disconnectSocket();
  smoothedLocalPosition = null;
  wsStatusEl.textContent = "nicht verbunden";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  statusEl.textContent = "Status: Kamera gestoppt";
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);