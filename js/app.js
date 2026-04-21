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

const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let stream = null;
let rafId = null;

const boardSummary = getBoardSummary();
const FOCAL_LENGTH_PX = 900;

function resizeCanvasToVideo() {
  if (!video.videoWidth || !video.videoHeight) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
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
      localPosition = estimateLocalBoardPosition(referenceMarker, offset, distance);
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
      statusEl.textContent = `Status: Marker erkannt – Referenz ${referenceMarker.id}`;
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

    console.log("AR verfügbar:", typeof AR !== "undefined");
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

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  statusEl.textContent = "Status: Kamera gestoppt";
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);