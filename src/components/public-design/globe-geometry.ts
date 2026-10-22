import points from './globe-points.json';

const TILT = -.15;
const TILT_COS = Math.cos(TILT), TILT_SIN = Math.sin(TILT);
export const LAND_OPACITIES = Array.from({ length: 12 }, (_, i) => .35 + (i + .5) * .65 / 12);

function projector(angle: number) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return ([x, y, z]: number[]) => {
    const px = x * cos + z * sin, pz = z * cos - x * sin;
    const py = y * TILT_COS - pz * TILT_SIN;
    const depth = y * TILT_SIN + pz * TILT_COS;
    return { cx: 200 + px * 173, cy: 200 - py * 173, opacity: depth < 0 ? 0 : .35 + depth * .65 };
  };
}

export function projectPoint(point: number[], angle = -.45) {
  return projector(angle)(point);
}

/** Round, vector strokes batch the same land dots into twelve depth layers. */
export function landPaths(angle = -.45) {
  const paths = Array.from({ length: LAND_OPACITIES.length }, () => '');
  const project = projector(angle);
  for (const point of points) {
    const p = project(point);
    if (!p.opacity) continue;
    const layer = Math.min(paths.length - 1, Math.floor((p.opacity - .35) / .65 * paths.length));
    paths[layer] += `M${p.cx.toFixed(2)} ${p.cy.toFixed(2)}h.01`;
  }
  return paths;
}
