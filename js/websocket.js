import { WS_URL, SEND_INTERVAL_MS } from "./config.js";

let socket = null;
let lastSendTs = 0;
let onStateChange = null;

export function setSocketStateCallback(callback) {
  onStateChange = callback;
}

function notify(stateText) {
  if (typeof onStateChange === "function") {
    onStateChange(stateText);
  }
}

export function connectSocket() {
  if (!WS_URL) {
    console.warn("WS_URL fehlt");
    notify("keine url");
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    notify("verbunden");
    return;
  }

  console.log("Phone verbindet zu:", WS_URL);
  notify("verbinde...");

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("Phone WebSocket verbunden");
    notify("verbunden");
  };

  socket.onerror = (error) => {
    console.error("Phone WebSocket Fehler:", error);
    notify("fehler");
  };

  socket.onclose = () => {
    console.log("Phone WebSocket getrennt");
    notify("nicht verbunden");
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
  notify("nicht verbunden");
}

export function sendData(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const now = Date.now();
  if (now - lastSendTs < SEND_INTERVAL_MS) return;
  lastSendTs = now;

  socket.send(JSON.stringify(payload));
}