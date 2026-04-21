import { getBoardSummary } from "./pose-model.js";

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
    drawDebugOverlay();
  }

  rafId = requestAnimationFrame(render);
}

function drawDebugOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(12, 12, 360, 220);

  ctx.fillStyle = "yellow";
  ctx.font = "16px Arial";

  let y = 35;
  const lineHeight = 24;

  ctx.fillText("OpenCV / Board-Projekt – Basis läuft", 20, y);
  y += lineHeight;

  ctx.fillText(`Markergröße: ${boardSummary.markerSize.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand X: ${boardSummary.spacingX.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`Abstand Y: ${boardSummary.spacingY.toFixed(2)} m`, 20, y);
  y += lineHeight;

  ctx.fillText(`ID2 Höhe: ${boardSummary.id2Height.toFixed(2)} m`, 20, y);
  y += lineHeight + 4;

  ctx.fillText("Markerzentren lokal:", 20, y);
  y += lineHeight;

  ctx.fillText("ID2 = (0.0, 0.0, 0.0)", 20, y);
  y += lineHeight;

  ctx.fillText("ID3 = (0.8, 0.0, 0.0)", 20, y);
  y += lineHeight;

  ctx.fillText("ID0 = (0.0, 0.6, 0.0)", 20, y);
  y += lineHeight;

  ctx.fillText("ID1 = (0.8, 0.6, 0.0)", 20, y);
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