import { WS_URL, SEND_INTERVAL_MS } from "./config.js";

let socket = null;
let lastSendTs = 0;
let socketStateCallback = null;

export function setSocketStateCallback(callback) {
  socketStateCallback = callback;
}

function notifyState(text) {
  if (typeof socketStateCallback === "function") {
    socketStateCallback(text);
  }
}

/**
 * Verbindung aufbauen.
 * Optional mit Callbacks:
 * - onOpen
 * - onClose
 * - onError
 * - onMessage
 */
export function connectSocket(options = {}) {
  const {
    onOpen = null,
    onClose = null,
    onError = null,
    onMessage = null
  } = options;

  if (!WS_URL) {
    console.warn("WS_URL fehlt");
    notifyState("keine url");
    return null;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    notifyState("verbunden");
    return socket;
  }

  console.log("Verbinde WebSocket zu:", WS_URL);
  notifyState("verbinde...");

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("WebSocket verbunden");
    notifyState("verbunden");
    if (typeof onOpen === "function") onOpen();
  };

  socket.onclose = () => {
    console.log("WebSocket getrennt");
    notifyState("nicht verbunden");
    if (typeof onClose === "function") onClose();
  };

  socket.onerror = (error) => {
    console.error("WebSocket Fehler:", error);
    notifyState("fehler");
    if (typeof onError === "function") onError(error);
  };

  socket.onmessage = (event) => {
    if (typeof onMessage === "function") onMessage(event);
  };

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
  notifyState("nicht verbunden");
}

export function sendData(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const now = Date.now();
  if (now - lastSendTs < SEND_INTERVAL_MS) return;
  lastSendTs = now;

  socket.send(JSON.stringify(payload));
}

export function getSocket() {
  return socket;
}