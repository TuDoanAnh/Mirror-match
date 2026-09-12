// ============================================================================
// POLYGON COLLISION & RAYCASTING MATH LIBRARY
// ============================================================================

// 1. Ray-casting point-in-polygon test (returns true if point (px, py) is inside polygon)
export function isPointInPolygon(px, py, points) {
  if (!points || points.length < 3) return false;
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// 2. Line segment intersection between (x1,y1)->(x2,y2) and (x3,y3)->(x4,y4)
export function getSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // Parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
      ua: ua,
      ub: ub
    };
  }

  return null;
}

// 3. Checks if a line segment (x1,y1)->(x2,y2) intersects any edge of a polygon
export function isSegmentIntersectingPolygon(x1, y1, x2, y2, points) {
  if (!points || points.length < 3) return false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const x3 = points[i].x;
    const y3 = points[i].y;
    const x4 = points[j].x;
    const y4 = points[j].y;

    const hit = getSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
    if (hit) return true;
  }

  return false;
}

// 3b. Checks if point (px, py) is inside any polygon in a list of polygons
export function isPointInAnyPolygon(px, py, polygons) {
  if (!polygons || !Array.isArray(polygons)) return false;
  for (const poly of polygons) {
    const pts = poly.points || poly;
    if (isPointInPolygon(px, py, pts)) return true;
  }
  return false;
}

// 3c. Checks if line segment intersects any polygon in a list of polygons
export function isSegmentIntersectingAnyPolygon(x1, y1, x2, y2, polygons) {
  if (!polygons || !Array.isArray(polygons)) return false;
  for (const poly of polygons) {
    const pts = poly.points || poly;
    if (isSegmentIntersectingPolygon(x1, y1, x2, y2, pts)) return true;
  }
  return false;
}

// 4. Distance from point (px, py) to segment (x1,y1)->(x2,y2)
export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ddx = px - x1;
    const ddy = py - y1;
    return { distSq: ddx * ddx + ddy * ddy, closestX: x1, closestY: y1, normalX: 0, normalY: 0 };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const dX = px - closestX;
  const dY = py - closestY;
  const distSq = dX * dX + dY * dY;

  // Normal vector pointing outwards away from segment
  let len = Math.sqrt(distSq);
  let normalX = len > 0 ? dX / len : 0;
  let normalY = len > 0 ? dY / len : 0;

  return { distSq, closestX, closestY, normalX, normalY };
}

// 5. Handles smooth character collision against polygon boundaries (Edge sliding)
export function handleCharacterPolygonCollision(entity, polygonOrList, radius = 18) {
  if (!entity || !entity.body || !polygonOrList) return false;

  // If polygonOrList is an array of polygon objects (e.g. MAP_POLYGONS)
  if (Array.isArray(polygonOrList) && polygonOrList.length > 0 && polygonOrList[0].points) {
    let collided = false;
    for (const poly of polygonOrList) {
      if (poly.points && poly.points.length >= 3) {
        if (handleCharacterPolygonCollision(entity, poly.points, radius)) {
          collided = true;
        }
      }
    }
    return collided;
  }

  const points = polygonOrList;
  if (!Array.isArray(points) || points.length < 3) return false;

  const px = entity.x;
  const py = entity.y;
  let isInside = isPointInPolygon(px, py, points);

  let closestDistSq = Infinity;
  let bestNormalX = 0;
  let bestNormalY = 0;
  let bestClosestX = px;
  let bestClosestY = py;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const x1 = points[j].x;
    const y1 = points[j].y;
    const x2 = points[i].x;
    const y2 = points[i].y;

    const res = pointToSegmentDistance(px, py, x1, y1, x2, y2);
    if (res.distSq < closestDistSq) {
      closestDistSq = res.distSq;
      bestNormalX = res.normalX;
      bestNormalY = res.normalY;
      bestClosestX = res.closestX;
      bestClosestY = res.closestY;
    }
  }

  const closestDist = Math.sqrt(closestDistSq);

  if (isInside || closestDist < radius) {
    const overlap = isInside ? (radius + closestDist) : (radius - closestDist);
    if (overlap > 0) {
      if (isInside) {
        // Push out towards closest edge
        const dx = px - bestClosestX;
        const dy = py - bestClosestY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          entity.x += (dx / len) * (overlap + 2);
          entity.y += (dy / len) * (overlap + 2);
        } else {
          entity.x += radius;
        }
      } else {
        // Push out along normal
        entity.x += bestNormalX * (overlap + 1);
        entity.y += bestNormalY * (overlap + 1);
      }

      if (entity.body) {
        entity.body.reset(entity.x, entity.y);
      }
      return true;
    }
  }

  return false;
}
