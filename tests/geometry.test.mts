import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type Box,
  busWire,
  clamp,
  horizontalWire,
  Port,
  portPoint,
  splitWire,
  verticalWire,
} from '../components/graph/geometry.ts';

const box: Box = { x: 10, y: 20, w: 100, h: 40 };

describe('portPoint', () => {
  it('sits at the middle of each side', () => {
    assert.deepEqual(portPoint(box, Port.LEFT), { x: 10, y: 40 });
    assert.deepEqual(portPoint(box, Port.RIGHT), { x: 110, y: 40 });
    assert.deepEqual(portPoint(box, Port.TOP), { x: 60, y: 20 });
    assert.deepEqual(portPoint(box, Port.BOTTOM), { x: 60, y: 60 });
  });
});

describe('horizontalWire', () => {
  it('runs from the first point to the second with an S-curve', () => {
    assert.equal(horizontalWire({ x: 0, y: 0 }, { x: 60, y: 40 }), 'M0 0C36 0 24 40 60 40');
  });

  it('is straight when both ends line up', () => {
    assert.equal(horizontalWire({ x: 0, y: 100 }, { x: 300, y: 100 }), 'M0 100C150 100 150 100 300 100');
  });
});

describe('verticalWire', () => {
  it('runs from the first point to the second with an S-curve', () => {
    assert.equal(verticalWire({ x: 0, y: 0 }, { x: 40, y: 60 }), 'M0 0C0 30 40 30 40 60');
  });

  it('is straight when both ends line up', () => {
    assert.equal(verticalWire({ x: 50, y: 0 }, { x: 50, y: 200 }), 'M50 0C50 100 50 100 50 200');
  });
});

describe('busWire', () => {
  it('drops onto the rail, runs to the trunk, then turns into the target on rounded elbows', () => {
    assert.equal(
      busWire({ from: { x: 50, y: 40 }, to: { x: 200, y: 115 }, trunkX: 12 }),
      'M50 40V46A8 8 0 0 1 42 54H20A8 8 0 0 0 12 62V107A8 8 0 0 0 20 115H200',
    );
  });

  it('shares the rail and trunk, so wires to different targets overlap until they branch', () => {
    const from = { x: 50, y: 40 };
    const upper = busWire({ from, to: { x: 200, y: 115 }, trunkX: 12 });
    const lower = busWire({ from, to: { x: 200, y: 175 }, trunkX: 12 });
    assert.equal(upper.slice(0, upper.indexOf('V107')), lower.slice(0, lower.indexOf('V167')));
  });

  it('tightens the elbows rather than overshooting when the port sits close to the trunk', () => {
    assert.equal(
      busWire({ from: { x: 16, y: 40 }, to: { x: 30, y: 115 }, trunkX: 12 }),
      'M16 40V52A2 2 0 0 1 14 54H14A2 2 0 0 0 12 56V113A2 2 0 0 0 14 115H30',
    );
  });
});

describe('splitWire', () => {
  it('turns toward a target on the left on mirrored elbows', () => {
    assert.equal(
      splitWire({ x: 100, y: 40 }, { x: 30, y: 68 }),
      'M100 40V46A8 8 0 0 1 92 54H38A8 8 0 0 0 30 62V68',
    );
  });

  it('runs straight down when the target sits directly below', () => {
    assert.equal(splitWire({ x: 100, y: 40 }, { x: 100, y: 68 }), 'M100 40V68');
  });
});

describe('clamp', () => {
  it('holds a value inside a range, endpoints included', () => {
    assert.equal(clamp(5, [0, 10]), 5);
    assert.equal(clamp(-1, [0, 10]), 0);
    assert.equal(clamp(11, [0, 10]), 10);
    assert.equal(clamp(0, [0, 10]), 0);
    assert.equal(clamp(10, [0, 10]), 10);
  });
});
