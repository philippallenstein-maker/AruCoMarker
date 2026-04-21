import { getBoardSummary } from "./pose-model.js";
import { initDetector, detectMarkers, chooseReferenceMarker } from "./detector.js";
import { drawMarkers, drawDebugOverlay } from "./overlay.js";

const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let stream = null;
let rafId = null;

const boardSummary = getBoardSummary();

function resizeCanvasToVideo() {
  if (!video.videoWidth || !video.videoHeight) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

function render() {
  if (video.readyState >= 2) {
    resizeCanvasToVideo();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const markers = detectMarkers(ctx, canvas);
    const referenceMarker = chooseReferenceMarker(markers);

    drawMarkers(ctx, markers, referenceMarker);
    drawDebugOverlay(ctx, boardSummary, referenceMarker, markers.length);

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

    initDetector();

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