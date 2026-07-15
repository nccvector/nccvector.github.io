#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 1600;
const HEIGHT = 1000;
const OUTPUT_DIR = resolve("public/images");

const palette = {
  ink: [10, 15, 18, 255],
  panel: [17, 26, 30, 255],
  grid: [35, 53, 59, 120],
  cyan: [91, 221, 208, 255],
  cyanSoft: [91, 221, 208, 72],
  paper: [232, 237, 229, 255],
  amber: [232, 178, 91, 255],
  coral: [211, 104, 89, 255],
  steel: [91, 112, 119, 255],
  ghost: [161, 193, 184, 70],
};

class Raster {
  constructor(width, height, background) {
    this.width = width;
    this.height = height;
    this.pixels = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      this.pixels.set(background, i * 4);
    }
  }

  blend(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const index = (y * this.width + x) * 4;
    const alpha = color[3] / 255;
    const inverse = 1 - alpha;
    this.pixels[index] = Math.round(color[0] * alpha + this.pixels[index] * inverse);
    this.pixels[index + 1] = Math.round(color[1] * alpha + this.pixels[index + 1] * inverse);
    this.pixels[index + 2] = Math.round(color[2] * alpha + this.pixels[index + 2] * inverse);
    this.pixels[index + 3] = 255;
  }

  circle(cx, cy, radius, color) {
    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);
    const radiusSquared = radius * radius;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radiusSquared) this.blend(x, y, color);
      }
    }
  }

  line(x1, y1, x2, y2, width, color) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(distance * 1.25));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      this.circle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
    }
  }

  polyline(points, width, color) {
    for (let i = 1; i < points.length; i += 1) {
      this.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color);
    }
  }

  polygon(points, color) {
    const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point[1]))));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...points.map((point) => point[1]))));
    for (let y = minY; y <= maxY; y += 1) {
      const intersections = [];
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          intersections.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x += 1) {
          this.blend(x, y, color);
        }
      }
    }
  }

  rotatedRect(cx, cy, width, height, angle, fill, stroke = null, strokeWidth = 0) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners = [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ].map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);
    this.polygon(corners, fill);
    if (stroke) {
      this.polyline([...corners, corners[0]], strokeWidth, stroke);
    }
    return corners;
  }

  bezier(points, steps = 140) {
    const [p0, p1, p2, p3] = points;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const u = 1 - t;
      return [
        u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0],
        u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1],
      ];
    });
  }

  grid(spacing, color) {
    for (let x = 0; x < this.width; x += spacing) this.line(x, 0, x, this.height, 1, color);
    for (let y = 0; y < this.height; y += spacing) this.line(0, y, this.width, y, 1, color);
  }

  async save(path) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, encodePng(this.width, this.height, this.pixels));
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function encodePng(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    scanlines[row] = 0;
    pixels.copy(scanlines, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawGlowPath(raster, points) {
  raster.polyline(points, 34, [91, 221, 208, 20]);
  raster.polyline(points, 18, [91, 221, 208, 48]);
  raster.polyline(points, 7, palette.cyan);
  for (let i = 0; i < points.length; i += 18) {
    raster.circle(points[i][0], points[i][1], 7, palette.paper);
  }
}

async function renderManipulator() {
  const image = new Raster(WIDTH, HEIGHT, palette.ink);
  image.grid(80, palette.grid);
  image.polygon([[0, 790], [1600, 700], [1600, 1000], [0, 1000]], [19, 31, 34, 255]);

  // The shelf-and-pole clutter echoes the real MuJoCo scene used by the UR5e lab.
  for (const [x, y, w, h] of [[915, 250, 46, 610], [1200, 185, 50, 675], [1435, 310, 42, 550]]) {
    image.rotatedRect(x, y + h / 2, w, h, 0, [45, 60, 65, 255], palette.steel, 3);
  }
  for (const [x, y, w] of [[930, 330, 270], [930, 520, 270], [930, 710, 270]]) {
    image.rotatedRect(x + w / 2, y, w, 30, 0, [37, 51, 55, 255], palette.steel, 3);
  }
  for (const [cx, cy, radius] of [[1070, 420, 72], [1070, 615, 62], [1320, 500, 78]]) {
    image.circle(cx, cy, radius + 7, [81, 104, 108, 255]);
    image.circle(cx, cy, radius, palette.ink);
  }

  const roadmap = [
    [365, 670], [510, 485], [690, 430], [820, 550], [1015, 615], [1160, 560], [1350, 470],
    [455, 715], [610, 610], [745, 720], [920, 650], [1110, 760], [1270, 690],
  ];
  const edges = [[0,1],[0,7],[1,2],[1,8],[2,3],[2,8],[3,4],[3,9],[4,5],[4,10],[5,6],[5,11],[6,12],[7,8],[8,9],[9,10],[10,11],[11,12]];
  for (const [a, b] of edges) image.line(...roadmap[a], ...roadmap[b], 2, [91, 221, 208, 28]);
  for (const point of roadmap) image.circle(point[0], point[1], 5, [91, 221, 208, 70]);

  const route = [
    ...image.bezier([[440, 650], [650, 410], [820, 700], [1015, 615]], 100),
    ...image.bezier([[1015, 615], [1150, 565], [1240, 410], [1365, 470]], 90).slice(1),
  ];
  drawGlowPath(image, route);

  const joints = [[260, 780], [340, 690], [455, 610], [570, 470], [700, 430], [790, 500], [835, 455]];
  const widths = [82, 62, 56, 44, 34, 26];
  for (let i = 1; i < joints.length; i += 1) {
    image.line(...joints[i - 1], ...joints[i], widths[i - 1], i % 2 ? palette.paper : [177, 190, 184, 255]);
    image.line(...joints[i - 1], ...joints[i], Math.max(8, widths[i - 1] * 0.17), [55, 72, 75, 255]);
  }
  for (let i = 0; i < joints.length - 1; i += 1) {
    image.circle(joints[i][0], joints[i][1], widths[Math.min(i, widths.length - 1)] * 0.57, [29, 42, 46, 255]);
    image.circle(joints[i][0], joints[i][1], widths[Math.min(i, widths.length - 1)] * 0.28, palette.amber);
  }
  image.circle(835, 455, 18, palette.cyan);

  // A translucent goal pose communicates the continuously reused roadmap destination.
  const ghost = [[1160, 810], [1190, 690], [1260, 610], [1330, 550], [1370, 490], [1400, 445]];
  for (let i = 1; i < ghost.length; i += 1) image.line(...ghost[i - 1], ...ghost[i], 28 - i * 2, palette.ghost);
  for (const point of ghost) image.circle(point[0], point[1], 13, [161, 193, 184, 90]);

  await image.save(resolve(OUTPUT_DIR, "manipulator-motion-planning.png"));
}

function checkpoint(image, cx, cy, width, height, angle, active = false) {
  image.rotatedRect(cx, cy, width, height, angle, active ? [91, 221, 208, 35] : [232, 237, 229, 18], active ? palette.cyan : [178, 194, 188, 150], 5);
}

function vehicle(image, x, y, heading, articulation) {
  const hitchX = x - Math.cos(heading) * 116;
  const hitchY = y - Math.sin(heading) * 116;
  const trailerHeading = heading + articulation;
  const trailerX = hitchX - Math.cos(trailerHeading) * 155;
  const trailerY = hitchY - Math.sin(trailerHeading) * 155;
  image.line(hitchX, hitchY, trailerX, trailerY, 12, [126, 148, 147, 255]);
  image.rotatedRect(trailerX, trailerY, 300, 136, trailerHeading, palette.paper, [106, 130, 131, 255], 5);
  image.rotatedRect(x, y, 230, 124, heading, palette.amber, [253, 215, 141, 255], 5);
  image.circle(hitchX, hitchY, 16, palette.coral);
  for (const offset of [-42, 42]) {
    const normalX = -Math.sin(heading) * offset;
    const normalY = Math.cos(heading) * offset;
    image.rotatedRect(x + normalX, y + normalY, 58, 18, heading, [32, 39, 41, 255]);
    const tnx = -Math.sin(trailerHeading) * offset;
    const tny = Math.cos(trailerHeading) * offset;
    image.rotatedRect(trailerX + tnx, trailerY + tny, 62, 18, trailerHeading, [32, 39, 41, 255]);
  }
}

async function renderTrailerTruck() {
  const image = new Raster(WIDTH, HEIGHT, palette.ink);
  image.grid(72, palette.grid);
  image.rotatedRect(1270, 520, 420, 250, -0.18, [29, 42, 44, 255], [87, 112, 113, 255], 5);
  checkpoint(image, 1265, 520, 350, 165, -0.18, true);
  checkpoint(image, 945, 670, 230, 145, 0.33);
  checkpoint(image, 660, 625, 230, 145, -0.05);

  const obstacles = [
    [365, 215, 210, 92, 0.25], [720, 250, 180, 100, -0.22], [1105, 205, 205, 95, 0.1],
    [340, 835, 190, 105, -0.12], [760, 850, 210, 90, 0.18], [1370, 820, 160, 100, -0.28],
  ];
  for (const [x, y, w, h, angle] of obstacles) {
    image.rotatedRect(x, y, w, h, angle, [105, 48, 45, 255], palette.coral, 4);
  }

  const path = [
    ...image.bezier([[275, 530], [520, 420], [710, 780], [930, 670]], 100),
    ...image.bezier([[930, 670], [1060, 610], [1055, 470], [1265, 520]], 95).slice(1),
  ];
  image.polyline(path, 82, [91, 221, 208, 18]);
  image.polyline(path, 7, palette.cyan);
  for (let i = 8; i < path.length; i += 24) {
    const [x, y] = path[i];
    const [px, py] = path[Math.max(0, i - 3)];
    const heading = Math.atan2(y - py, x - px);
    const left = [x - Math.cos(heading) * 17 + Math.sin(heading) * 11, y - Math.sin(heading) * 17 - Math.cos(heading) * 11];
    const right = [x - Math.cos(heading) * 17 - Math.sin(heading) * 11, y - Math.sin(heading) * 17 + Math.cos(heading) * 11];
    image.polygon([[x, y], left, right], palette.paper);
  }

  for (const [x, y, heading] of [[510, 505, 0.22], [815, 678, 0.05], [1050, 590, -0.2]]) {
    image.rotatedRect(x, y, 210, 112, heading, [232, 237, 229, 20], [161, 193, 184, 60], 3);
  }
  vehicle(image, 560, 535, 0.18, -0.32);

  const cusp = path[100];
  image.circle(cusp[0], cusp[1], 22, palette.coral);
  image.circle(cusp[0], cusp[1], 9, palette.paper);

  await image.save(resolve(OUTPUT_DIR, "trailer-truck-parking.png"));
}

await Promise.all([renderManipulator(), renderTrailerTruck()]);
console.log("Rendered project thumbnails in public/images");
