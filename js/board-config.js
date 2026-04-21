/**
 * Feste Geometrie des Marker-Boards.
 *
 * Lokales Board-Koordinatensystem:
 * - Ursprung bei ID2 unten links
 * - X nach rechts
 * - Y nach oben
 * - Z nach vorne aus dem Board heraus
 */

export const BOARD = {
  markerSize: 0.10,      // 10 cm
  spacingX: 0.80,        // Abstand ID2 -> ID3
  spacingY: 0.60,        // Abstand ID2 -> ID0
  id2Height: 1.20        // reale Höhe von ID2 über Boden
};

/**
 * Marker-Mittelpunkte im lokalen Board-Koordinatensystem.
 */
export const MARKER_CENTERS = {
  2: { x: 0.0, y: 0.0, z: 0.0 },
  3: { x: 0.8, y: 0.0, z: 0.0 },
  0: { x: 0.0, y: 0.6, z: 0.0 },
  1: { x: 0.8, y: 0.6, z: 0.0 }
};

/**
 * Reihenfolge der Marker im Projekt.
 */
export const VALID_MARKER_IDS = [2, 3, 0, 1];

/**
 * Lokale Bodenhöhe relativ zu ID2.
 */
export const FLOOR_Y_LOCAL = -BOARD.id2Height;