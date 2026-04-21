import { WS_URL, SEND_INTERVAL_MS } from "./config.js";

let socket = null;
let lastSendTs = 0;

export function connectSocket({ onOpen, onClose, onError, onMessage } = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    if (onOpen) onOpen();
  };

  socket.onclose = () => {
    if (onClose) onClose();
  };

  socket.onerror = (error) => {
    if (onError) onError(error);
  };

  socket.onmessage = (event) => {
    if (onMessage) onMessage(event);
  };

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendData(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const now = Date.now();
  if (now - lastSendTs < SEND_INTERVAL_MS) return;
  lastSendTs = now;

  socket.send(JSON.stringify(payload));
}