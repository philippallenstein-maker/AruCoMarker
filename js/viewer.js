import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WS_URL } from "./config.js";
import { BOARD } from "./board-config.js";

const statusEl = document.getElementById("viewerStatus");
const wsStatusEl = document.getElementById("viewerWsStatus");
const refIdEl = document.getElementById("viewerRefId");
const xEl = document.getElementById("viewerX");
const yEl = document.getElementById("viewerY");
const zEl = document.getElementById("viewerZ");
const connectBtn = document.getElementById("viewerConnectBtn");
const disconnectBtn = document.getElementById("viewerDisconnectBtn");
const sceneContainer = document.getElementById("viewerScene");

let socket = null;
let scene;
let camera;
let renderer;
let controls;
let phoneGroup;
let phoneTarget = { x: 1.6, y: BOARD.id2Height, z: 1.2 };

// Marker wirklich mittig an die Wand
const WALL_CENTER_X = 2.1;
const ROOM_WIDTH = 4.2;
const ROOM_HEIGHT = 2.8;
const ROOM_DEPTH = 4.5;

initScene();
drawStaticBoard();
animate();

connectBtn.addEventListener("click", connectViewerSocket);
disconnectBtn.addEventListener("click", disconnectViewerSocket);
window.addEventListener("resize", handleResize);

function connectViewerSocket() {
  if (!WS_URL) {
    statusEl.textContent = "Status: Keine WS_URL gesetzt";
    wsStatusEl.textContent = "fehler";
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    statusEl.textContent = "Status: Viewer schon verbunden";
    wsStatusEl.textContent = "verbunden";
    return;
  }

  statusEl.textContent = "Status: Verbinde...";
  wsStatusEl.textContent = "verbinde...";

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    statusEl.textContent = "Status: Viewer verbunden";
    wsStatusEl.textContent = "verbunden";
  };

  socket.onerror = () => {
    statusEl.textContent = "Status: Viewer Fehler";
    wsStatusEl.textContent = "fehler";
  };

  socket.onclose = () => {
    statusEl.textContent = "Status: Viewer getrennt";
    wsStatusEl.textContent = "nicht verbunden";
    socket = null;
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type !== "tracking" || !msg.data) return;
      applyData(msg.data);
    } catch (error) {
      console.error("Viewer Parse-Fehler:", error);
    }
  };
}

function disconnectViewerSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }

  statusEl.textContent = "Status: Viewer getrennt";
  wsStatusEl.textContent = "nicht verbunden";
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef2f5);

  camera = new THREE.PerspectiveCamera(
    50,
    sceneContainer.clientWidth / sceneContainer.clientHeight,
    0.1,
    100
  );
  camera.position.set(4.8, 2.8, 6.0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  sceneContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(WALL_CENTER_X, BOARD.id2Height, 1.2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.02;
  controls.minDistance = 2.0;
  controls.maxDistance = 12;

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 4);
  scene.add(directionalLight);

  addRoom();
  addFloor();
  addWall();
  addOriginAxes();
  addPhoneObject();
}

function addRoom() {
  const roomGeometry = new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
  const roomEdges = new THREE.EdgesGeometry(roomGeometry);
  const roomLine = new THREE.LineSegments(
    roomEdges,
    new THREE.LineBasicMaterial({ color: 0x555555 })
  );

  roomLine.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, ROOM_DEPTH / 2);
  scene.add(roomLine);
}

function addFloor() {
  const floorGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a5b20,
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ROOM_WIDTH / 2, 0, ROOM_DEPTH / 2);

  scene.add(floor);
}

function addWall() {
  const wallGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    side: THREE.DoubleSide
  });

  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);

  scene.add(wall);
}

function drawStaticBoard() {
  const marker = createMarkerMesh("ID 2");
  marker.position.set(WALL_CENTER_X, BOARD.id2Height, 0.01);
  scene.add(marker);
}

function createMarkerMesh(label) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD.markerSize, BOARD.markerSize),
    new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
  );
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD.markerSize * 0.45, BOARD.markerSize * 0.45),
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  inner.position.z = 0.001;
  group.add(inner);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const lctx = labelCanvas.getContext("2d");
  lctx.fillStyle = "black";
  lctx.font = "28px Arial";
  lctx.fillText(label, 10, 40);

  const texture = new THREE.CanvasTexture(labelCanvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.scale.set(0.28, 0.07, 1);
  sprite.position.set(0, 0.11, 0.01);

  group.add(sprite);
  return group;
}

function addOriginAxes() {
  const axesHelper = new THREE.AxesHelper(0.5);
  axesHelper.position.set(WALL_CENTER_X, BOARD.id2Height, 0.08);
  scene.add(axesHelper);
}

function addPhoneObject() {
  phoneGroup = new THREE.Group();

  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1f6feb })
  );
  phoneGroup.add(phoneBody);

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 0),
    0.35,
    0x1f6feb,
    0.10,
    0.05
  );
  phoneGroup.add(arrow);

  scene.add(phoneGroup);
  phoneGroup.position.set(WALL_CENTER_X, BOARD.id2Height, 1.2);
}

function applyData(data) {
  refIdEl.textContent = data.referenceId ?? "-";
  xEl.textContent = data.localX !== null ? Number(data.localX).toFixed(2) : "-";
  yEl.textContent = data.localY !== null ? Number(data.localY).toFixed(2) : "-";
  zEl.textContent = data.localZ !== null ? Number(data.localZ).toFixed(2) : "-";

  statusEl.textContent = `Status: Live Tracking – ID ${data.referenceId ?? "-"} – Marker ${data.markerCount ?? "-"}`;

  if (
    data.localX !== null &&
    data.localY !== null &&
    data.localZ !== null
  ) {
    phoneTarget = {
      x: WALL_CENTER_X + Number(data.localX),
      y: BOARD.id2Height + Number(data.localY),
      z: Number(data.localZ)
    };
  }
}

function animate() {
  requestAnimationFrame(animate);

  phoneGroup.position.x += (phoneTarget.x - phoneGroup.position.x) * 0.15;
  phoneGroup.position.y += (phoneTarget.y - phoneGroup.position.y) * 0.15;
  phoneGroup.position.z += (phoneTarget.z - phoneGroup.position.z) * 0.15;

  controls.update();
  renderer.render(scene, camera);
}

function handleResize() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}