import { createPath, pathsToPolylines } from 'canvas-sketch-util/penplot';
import Random from 'canvas-sketch-util/random';

figma.showUI(__html__, { width: 300, height: 260 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-jali') {
    main(msg.count, msg.resolution, msg.stroke, msg.tileType).then(
      () => { },
      (error) => {
        figma.ui.postMessage({ type: 'error', value: error });
      });
  } else {
    figma.closePlugin();
  }
}

type TileType = 'crossOverArcs' | 'arcs' | 'diagonals' | 'diagonalMesh' | 'overlappingArcs' | 'arcSweeps';

function main(curveCount: number = 2, resolution: number = 10, strokeWeight: number = 4, tileType: TileType): Promise<string | undefined> {
  // Make sure the selection is a single piece of text before proceeding.
  if (figma.currentPage.selection.length !== 1) {
    return Promise.reject("error: select just one frame");
  }

  const frameNode = figma.currentPage.selection[0];

  if (frameNode.type !== 'FRAME') {
    return Promise.reject("error: select a frame");
  }

  // Clear contents of the frame
  frameNode.findAll().map((node: SceneNode) => {
    if (node && !node.removed) {
      node.remove();
    }
  });

  const width = frameNode.width;
  const height = frameNode.height;
  const paths: any[] = [];
  const s = width / resolution;

  const tileTypes = {
    crossOverArcs: crossOverArcs,
    arcs: arcs,
    diagonals: diagonals,
    diagonalMesh: diagonalMesh,
    overlappingArcs: overlappingArcs,
    arcSweeps: arcSweeps(curveCount),
  };

  for (let x = 0; x < width; x += s) {
    for (let y = 0; y < height; y += s) {
      const tile = Random.pick(tileTypes[tileType]);
      paths.push(tile([x, y], s));
    }
  }

  const lines = pathsToPolylines(paths, { units: 'px' });
  const meshNodes: VectorNode[] = [];

  // Create the outline
  const jaliNode = jali([s, s], [width - s, height - s], strokeWeight);
  frameNode.appendChild(jaliNode);
  // Create the outline mask
  const maskNode = jaliNode.clone();
  maskNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  maskNode.isMask = true;
  frameNode.appendChild(maskNode);

  // Render the mesh
  lines.forEach(path => {
    const node = renderPath(path, strokeWeight);
    frameNode.appendChild(node);
    meshNodes.push(node);
  });

  const meshGroup = figma.group(meshNodes, frameNode);
  meshGroup.x = 0;
  meshGroup.y = 0;
  meshGroup.resize(width, height);

  meshGroup.expanded = false;

  return Promise.resolve('Jali complete');
};

function renderPath(pts, strokeWeight: number): VectorNode {
  const node = figma.createVector();

  const [first, ...rest] = pts;

  const path = ['M', first[0], first[1]];

  rest.forEach(pt => {
    path.push('L', pt[0], pt[1]);
  });

  node.vectorPaths = [{
    windingRule: 'EVENODD',
    data: path.join(' '),
  }];

  node.strokeWeight = strokeWeight;
  node.strokeJoin = 'ROUND';
  node.strokeCap = 'ROUND';

  return node;
}

const crossOverArcs = [
  function ([x, y], s) {
    const p = createPath();

    p.moveTo(x + s / 2, y);
    p.lineTo(x + s / 2, y + s / 4);

    p.moveTo(x + s / 2, y + s / 2 + s / 4);
    p.lineTo(x + s / 2, y + s);

    p.moveTo(x, y + s / 2);
    p.lineTo(x + s, y + s / 2);

    return p;
  },
  function ([x, y], s) {
    const p = createPath();

    p.arc(x, y, s / 2, 0, Math.PI / 2);

    p.moveTo(x + s / 2, y + s);
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);

    return p;
  },
  function ([x, y], s) {
    const p = createPath();

    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);

    p.moveTo(x + s, y + s / 2);
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);

    return p;
  },
];

const arcs = [
  function ([x, y], s) {
    const p = createPath();
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y, s / 2, 0, Math.PI / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.arc(x, y, s / 2, 0, Math.PI / 2);
    p.arc(x, y + s, s / 2, (3 * Math.PI) / 2, 0);
    p.arc(x + s, y + s, s / 2, Math.PI, (3 * Math.PI) / 2);
    p.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);
    return p;
  },
];

const diagonals = [
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s / 2, y + s);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y + s);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
];

const diagonalMesh = [
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x, y + s / 2);
    p.moveTo(x + s / 2, y + s);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s / 2, y + s);
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
  function ([x, y], s) {
    const p = createPath();
    p.moveTo(x + s / 2, y);
    p.lineTo(x + s / 2, y + s);
    p.moveTo(x, y + s / 2);
    p.lineTo(x + s, y + s / 2);
    return p;
  },
];

const overlappingArcs = [
  function ([x, y], s) {
    const r = s / 4;
    const p = createPath();
    p.arc(x, y, r, 0, Math.PI / 2);
    p.moveTo(x + 2 * r, y);
    p.arc(x, y, r * 2, 0, Math.PI / 2);
    p.moveTo(x + 3 * r, y);
    p.arc(x, y, r * 3, 0, Math.PI / 2);
    p.moveTo(x + s - r, y + s);
    p.arc(x + s, y + s, r, Math.PI, (3 * Math.PI) / 2);
    p.moveTo(x + s - 2 * r, y + s);
    p.arc(x + s, y + s, r * 2, Math.PI, (3 * Math.PI) / 2);
    p.moveTo(x + s - 3 * r, y + s);
    p.arc(x + s, y + s, r * 3, Math.PI, (3 * Math.PI) / 2);
    return p;
  },
  function ([x, y], s) {
    const r = s / 4;
    const p = createPath();
    p.arc(x + s, y, r, Math.PI / 2, Math.PI);
    p.moveTo(x + s, y + 2 * r);
    p.arc(x + s, y, r * 2, Math.PI / 2, Math.PI);
    p.moveTo(x + s, y + 3 * r);
    p.arc(x + s, y, r * 3, Math.PI / 2, Math.PI);
    p.moveTo(x + r, y + s);
    p.arc(x, y + s, r, (3 * Math.PI) / 2, 2 * Math.PI);
    p.moveTo(x + 2 * r, y + s);
    p.arc(x, y + s, r * 2, (3 * Math.PI) / 2, 2 * Math.PI);
    p.moveTo(x + 3 * r, y + s);
    p.arc(x, y + s, r * 3, (3 * Math.PI) / 2, 2 * Math.PI);
    return p;
  },
];

const arcSweeps = (count) => [
  rail(count, 'H'),
  rail(count, 'V'),
  arc(count, 'TL'),
  arc(count, 'TR'),
  arc(count, 'BL'),
  arc(count, 'BR'),
];

function rail(count, dir) {
  return ([x, y], s) => {
    const r = s / count;
    const p = createPath();

    if (dir === 'V') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + i * r, y);
        p.lineTo(x + i * r, y + s);
      }
    } else if (dir === 'H') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x, y + i * r);
        p.lineTo(x + s, y + i * r);
      }
    }

    return p;
  };
}

function arc(count, dir) {
  return ([x, y], s) => {
    const r = s / count;
    const p = createPath();

    if (dir === 'TL') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + i * r, y);
        p.arc(x, y, i * r, 0, Math.PI / 2);
      }
    } else if (dir === 'TR') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + s, y + i * r);
        p.arc(x + s, y, i * r, Math.PI / 2, Math.PI);
      }
    } else if (dir === 'BR') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x + s - i * r, y + s);
        p.arc(x + s, y + s, i * r, Math.PI, (3 * Math.PI) / 2);
      }
    } else if (dir === 'BL') {
      for (let i = 1; i < count + 1; i++) {
        p.moveTo(x, y + s - i * r);
        p.arc(x, y + s, i * r, (3 * Math.PI) / 2, 2 * Math.PI);
      }
    }

    return p;
  };
}

function jali([ox, oy]: number[], [w, h]: number[], strokeWeight: number): VectorNode {
  const node = figma.createVector();
  const l = 0.5 * h;

  node.vectorPaths = [{
    windingRule: 'EVENODD',
    data: [
      'M', ox, l,
      'L', ox, h,
      'L', w, h,
      'L', w, l,
      'C', w, 0.254 * h, w, 0.4 * l, w / 2, oy,
      'C', ox, 0.4 * l, ox, 0.254 * h, ox, l,
    ].join(' '),
  }];

  node.strokeWeight = strokeWeight;
  node.strokeJoin = 'ROUND';
  node.strokeCap = 'ROUND';

  return node;
}
