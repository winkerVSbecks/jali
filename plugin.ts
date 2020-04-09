import { createPath, pathsToPolylines } from 'canvas-sketch-util/penplot';
import Random from 'canvas-sketch-util/random';

figma.showUI(__html__, { width: 300, height: 240 })

figma.ui.onmessage = msg => {
  if (msg.type === 'create-jali') {
    main(msg.count, msg.resolution, msg.stroke).then(() => {
      figma.closePlugin();
    }, (error) => {
      figma.ui.postMessage({ type: 'error', value: error });
    });
  } else {
    figma.closePlugin();
  }
}


function main(curveCount: number = 2, resolution: number = 10, strokeWeight: number = 4): Promise<string | undefined> {
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

  for (let x = 0; x < width; x += s) {
    for (let y = 0; y < height; y += s) {
      const tile = Random.pick(arcSweeps(curveCount));
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
