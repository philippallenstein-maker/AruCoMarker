import { WebSocketServer } from "ws";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket-Server läuft auf Port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Client verbunden");

  ws.on("message", (message) => {
    const text = message.toString();
    console.log("Nachricht empfangen:", text);

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(text);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client getrennt");
  });

  ws.on("error", (error) => {
    console.error("WebSocket-Fehler:", error);
  });
});