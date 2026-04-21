/**
 * Ein-Marker-Setup:
 * - nur ID2
 * - Marker hängt mittig an der Wand
 * - lokales KS direkt am Markerzentrum
 *
 * Achsen:
 * - X = links/rechts relativ zum Marker
 * - Y = oben/unten relativ zum Marker
 * - Z = Abstand vor der Wand
 */

export const BOARD = {
  markerSize: 0.10,   // 10 cm
  id2Height: 1.20     // Markerzentrum 1,20 m über Boden
};

/**
 * Nur ein Marker: ID2
 * Lokal ist das Markerzentrum der Ursprung.
 */
export const MARKER_CENTERS = {
  2: { x: 0.0, y: 0.0, z: 0.0 }
};

export const VALID_MARKER_IDS = [2];