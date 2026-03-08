/**
 * Face Shape Classifier using face-api.js 68-point landmarks
 *
 * Landmark indices (approximate):
 *   0-16  : jawline (left to right)
 *   17-21 : left eyebrow
 *   22-26 : right eyebrow
 *   27-30 : nose bridge
 *   31-35 : nose base
 *   36-41 : left eye
 *   42-47 : right eye
 *   48-60 : outer lips
 *   61-67 : inner lips
 */

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Returns the euclidean distance between two landmark points by index.
 */
function ld(pts, i, j) {
  return dist(pts[i], pts[j]);
}

/**
 * Classify face shape from 68-point landmarks array.
 * @param {Array<{x: number, y: number}>} pts
 * @returns {{ shape: string, emoji: string, description: string }}
 */
export function classifyFaceShape(pts) {
  if (!pts || pts.length < 68) return { shape: 'Unknown', emoji: '❓', description: '' };

  // Key measurements
  const foreheadWidth = ld(pts, 0, 16);        // temple to temple (approx)
  const cheekboneWidth = ld(pts, 1, 15);        // widest across cheeks
  const midFaceWidth = ld(pts, 3, 13);          // mid-face width
  const jawWidth = ld(pts, 5, 11);              // jaw width
  const chinWidth = ld(pts, 6, 10);             // chin width

  const faceHeight = ld(pts, 8, 27);            // chin to nose bridge (lower face height)
  const fullHeight = ld(pts, 8, 19);            // chin to brow midpoint (face height estimate)

  // Derived ratios
  const widthToHeight = cheekboneWidth / fullHeight;
  const jawToForehead = jawWidth / foreheadWidth;
  const jawToCheek = jawWidth / cheekboneWidth;
  const chinToJaw = chinWidth / jawWidth;
  const foreheadToCheek = foreheadWidth / cheekboneWidth;

  // ── Classification rules ──────────────────────────────────────────────────
  // DIAMOND: cheekbones >> forehead AND >> jaw, narrow chin
  if (foreheadToCheek < 0.82 && jawToCheek < 0.82 && cheekboneWidth > foreheadWidth && cheekboneWidth > jawWidth) {
    return {
      shape: 'Diamond',
      emoji: '💎',
      description: 'Wide cheekbones, narrow forehead & jaw',
    };
  }

  // HEART: forehead >= cheek, jaw significantly narrower, pointed chin
  if (foreheadToCheek >= 0.95 && jawToCheek < 0.80 && chinToJaw < 0.72) {
    return {
      shape: 'Heart',
      emoji: '❤️',
      description: 'Wider forehead, narrow jaw, pointed chin',
    };
  }

  // OBLONG / RECTANGULAR: tall narrow face
  if (widthToHeight < 0.72) {
    if (Math.abs(foreheadToCheek - 1) < 0.08 && Math.abs(jawToCheek - 1) < 0.1) {
      return {
        shape: 'Rectangular',
        emoji: '▭',
        description: 'Long face with similar widths across forehead, cheeks & jaw',
      };
    }
    return {
      shape: 'Oblong',
      emoji: '🫙',
      description: 'Long, narrow face with rounded edges',
    };
  }

  // SQUARE: face as wide as it is tall, strong angular jaw
  if (widthToHeight >= 0.88 && jawToCheek >= 0.87) {
    return {
      shape: 'Square',
      emoji: '⬜',
      description: 'Equal width and height, strong angular jawline',
    };
  }

  // ROUND: short and wide, jaw ≈ cheeks, minimal angles
  if (widthToHeight >= 0.82 && jawToCheek >= 0.78 && widthToHeight < 0.92) {
    return {
      shape: 'Round',
      emoji: '⭕',
      description: 'Wide cheeks, rounded jawline, similar width and height',
    };
  }

  // OVAL: height > width, cheekbones widest, jaw narrower than forehead
  return {
    shape: 'Oval',
    emoji: '🥚',
    description: 'Balanced face with slightly wider cheekbones',
  };
}

/**
 * Color palette for each face shape badge.
 */
export const shapeColors = {
  Oval:        { bg: '#6C63FF', text: '#fff' },
  Round:       { bg: '#FF6584', text: '#fff' },
  Square:      { bg: '#43BCCD', text: '#fff' },
  Heart:       { bg: '#F72585', text: '#fff' },
  Oblong:      { bg: '#7FB069', text: '#fff' },
  Rectangular: { bg: '#F4A261', text: '#fff' },
  Diamond:     { bg: '#9B5DE5', text: '#fff' },
  Unknown:     { bg: '#555',    text: '#ccc' },
};
