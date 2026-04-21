import { connectSocket, disconnectSocket } from "./websocket.js";
import { BOARD, MARKER_CENTERS } from "./board-config.js";

const statusEl = document.getElementById("viewerStatus");
const wsStatusEl = document.getElementById("viewerWsStatus");
const refIdEl = document.getElementById("viewerRefId");
const xEl = document.getElementById("viewerX");
const yEl = document.getElementById("viewerY");
const zEl = document.getElementById("viewerZ");
const connectBtn = document.getElementById("viewerConnectBtn");
const disconnectBtn = document.getElementById("viewerDisconnectBtn");
const canvas = document.getElementById("viewerCanvas");
const ctx = canvas.getContext("2d");

let currentData = null;

function resizeCanvas() {
  canvas.width = canvas.clientWidth || 800;
  canvas.height = 500;
}

function drawViewer() {
  resizeCanvas();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eef2f5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pad = 60;
  const boardWidthPx = canvas.width - pad * 2;
  const boardHeightPx = boardWidthPx * (BOARD.spacingY / BOARD.spacingX);

  const originX = pad;
  const originY = pad + boardHeightPx;

  // Board-Rechteck
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.strokeRect(originX, originY - boardHeightPx, boardWidthPx, boardHeightPx);

  // Marker
  Object.entries(MARKER_CENTERS).forEach(([id, pos]) => {
    const x = originX + (pos.x / BOARD.spacingX) * boardWidthPx;
    const y = originY - (pos.y / BOARD.spacingY) * boardHeightPx;

    ctx.fillStyle = "#111";
    ctx.fillRect(x - 12, y - 12, 24, 24);

    ctx.fillStyle = "red";
    ctx.font = "16px Arial";
    ctx.fillText(`ID ${id}`, x + 16, y - 8);
  });

  // Kamera / Punkt
  if (currentData && currentData.localX !== null && currentData.localY !== null) {
    const camX = originX + (currentData.localX / BOARD.spacingX) * boardWidthPx;
    const camY = originY - (currentData.localY / BOARD.spacingY) * boardHeightPx;

    ctx.fillStyle = "#1f6feb";
    ctx.beginPath();
    ctx.arc(camX, camY, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function applyData(data) {
  currentData = data;

  refIdEl.textContent = data.referenceId ?? "-";
  xEl.textContent = data.localX !== null ? Number(data.localX).toFixed(2) : "-";
  yEl.textContent = data.localY !== null ? Number(data.localY).toFixed(2) : "-";
  zEl.textContent = data.localZ !== null ? Number(data.localZ).toFixed(2) : "-";

  statusEl.textContent = `Status: Live Tracking – Ref ${data.referenceId ?? "-"}`;
  drawViewer();
}

connectBtn.addEventListener("click", () => {
  connectSocket({
    onOpen: () => {
      wsStatusEl.textContent = "verbunden";
      statusEl.textContent = "Status: Viewer verbunden";
    },
    onClose: () => {
      wsStatusEl.textContent = "nicht verbunden";
      statusEl.textContent = "Status: Viewer getrennt";
    },
    onError: () => {
      wsStatusEl.textContent = "fehler";
      statusEl.textContent = "Status: Viewer Fehler";
    },
    onMessage: (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "tracking" && msg.data) {
          applyData(msg.data);
        }
      } catch (error) {
        console.error("Viewer Parse-Fehler:", error);
      }
    }
  });
});

disconnectBtn.addEventListener("click", () => {
  disconnectSocket();
  wsStatusEl.textContent = "nicht verbunden";
  statusEl.textContent = "Status: Viewer getrennt";
});

window.addEventListener("resize", drawViewer);
drawViewer();