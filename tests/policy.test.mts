import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type Box } from '../components/graph/geometry.ts';
import { type GraphEdge, plan } from '../components/graph/planner.ts';
import {
  announcementFor,
  clampOffset,
  downstreamOf,
  feeds,
  feedsKindOf,
  nextFocus,
  routeFor,
  upstreamOf,
} from '../components/graph/policy.ts';
import { NodeKind, type GraphNodeModel } from '../components/graph/types.ts';

const edges: GraphEdge[] = [
  { from: 'root', to: 'interactive' },
  { from: 'root', to: 'ai' },
  { from: 'root', to: 'platform' },
  { from: 'interactive', to: 'app-builder' },
  { from: 'ai', to: 'app-builder' },
  { from: 'ai', to: 'cocoding' },
  { from: 'platform', to: 'hashmato' },
];

const node = (id: string, kind: NodeKind, title: string): GraphNodeModel => ({
  id,
  kind,
  title,
  shortTitle: id,
  meta: '',
});

const nodes: GraphNodeModel[] = [
  node('root', NodeKind.ROOT, 'Hasib'),
  node('interactive', NodeKind.CAPABILITY, 'Interactive systems'),
  node('ai', NodeKind.CAPABILITY, 'AI products'),
  node('platform', NodeKind.CAPABILITY, 'Platform and architecture'),
  node('app-builder', NodeKind.PROJECT, 'App Builder'),
  node('cocoding', NodeKind.PROJECT, 'cocoding.ai'),
  node('hashmato', NodeKind.PROJECT, 'Hashmato'),
];

const columns = {
  [NodeKind.ROOT]: [nodes[0]],
  [NodeKind.CAPABILITY]: [nodes[1], nodes[2], nodes[3]],
  [NodeKind.PROJECT]: [nodes[4], nodes[5], nodes[6]],
};

describe('feeds', () => {
  it('draws every project when the root is in focus', () => {
    assert.deepEqual(feeds(columns[NodeKind.PROJECT], 'root', plan(edges, 'root')), [
      'app-builder',
      'cocoding',
      'hashmato',
    ]);
  });

  it('draws only the projects a capability feeds', () => {
    assert.deepEqual(feeds(columns[NodeKind.PROJECT], 'ai', plan(edges, 'ai')), ['app-builder', 'cocoding']);
  });

  it('always draws the focused project itself', () => {
    assert.deepEqual(feeds(columns[NodeKind.PROJECT], 'app-builder', plan(edges, 'app-builder')), ['app-builder']);
  });
});

describe('kind filtering', () => {
  it('upstreamOf picks the capabilities a project is built from', () => {
    const p = plan(edges, 'app-builder');
    assert.deepEqual(upstreamOf(p, nodes, NodeKind.CAPABILITY).map((item) => item.id), ['interactive', 'ai']);
    assert.deepEqual(upstreamOf(p, nodes, NodeKind.PROJECT), []);
  });

  it('a person focus feeds capabilities; everything else feeds projects', () => {
    assert.equal(feedsKindOf(NodeKind.ROOT), NodeKind.CAPABILITY);
    assert.equal(feedsKindOf(NodeKind.CAPABILITY), NodeKind.PROJECT);
    assert.equal(feedsKindOf(NodeKind.PROJECT), NodeKind.PROJECT);
    assert.equal(feedsKindOf(undefined), NodeKind.PROJECT);
  });

  it('downstreamOf picks the kind the focus feeds', () => {
    assert.deepEqual(downstreamOf(plan(edges, 'ai'), nodes, NodeKind.CAPABILITY).map((item) => item.id), [
      'app-builder',
      'cocoding',
    ]);
    assert.deepEqual(downstreamOf(plan(edges, 'root'), nodes, NodeKind.ROOT).map((item) => item.id), [
      'interactive',
      'ai',
      'platform',
    ]);
  });

  it('a project focus feeds nothing', () => {
    assert.deepEqual(downstreamOf(plan(edges, 'app-builder'), nodes, NodeKind.PROJECT), []);
  });
});

describe('announcementFor', () => {
  it('reads a project as built from its capabilities', () => {
    assert.equal(
      announcementFor({ nodes }, plan(edges, 'app-builder')),
      'App Builder: built from Interactive systems and AI products.',
    );
  });

  it('reads a capability as feeding its projects', () => {
    assert.equal(announcementFor({ nodes }, plan(edges, 'ai')), 'AI products: feeds App Builder and cocoding.ai.');
  });

  it('reads the root as feeding every capability, in long conjunction form', () => {
    assert.equal(
      announcementFor({ nodes }, plan(edges, 'root')),
      'Hasib: feeds Interactive systems, AI products, and Platform and architecture.',
    );
  });

  it('says nothing for an unknown focus', () => {
    assert.equal(announcementFor({ nodes }, plan(edges, 'ghost')), '');
  });
});

describe('nextFocus', () => {
  it('steps down a column and wraps to the top', () => {
    assert.equal(nextFocus(nodes[4], 'ArrowDown', columns, edges), 'cocoding');
    assert.equal(nextFocus(nodes[6], 'ArrowDown', columns, edges), 'app-builder');
  });

  it('steps up a column and wraps to the bottom', () => {
    assert.equal(nextFocus(nodes[5], 'ArrowUp', columns, edges), 'app-builder');
    assert.equal(nextFocus(nodes[4], 'ArrowUp', columns, edges), 'hashmato');
  });

  it('wraps inside a single-node column', () => {
    assert.equal(nextFocus(nodes[0], 'ArrowDown', columns, edges), 'root');
    assert.equal(nextFocus(nodes[0], 'ArrowUp', columns, edges), 'root');
  });

  it('follows wires left and right', () => {
    assert.equal(nextFocus(nodes[0], 'ArrowRight', columns, edges), 'interactive');
    assert.equal(nextFocus(nodes[2], 'ArrowRight', columns, edges), 'app-builder');
    assert.equal(nextFocus(nodes[4], 'ArrowLeft', columns, edges), 'interactive');
  });

  it('has nowhere to go past the ends of the graph', () => {
    assert.equal(nextFocus(nodes[0], 'ArrowLeft', columns, edges), undefined);
    assert.equal(nextFocus(nodes[4], 'ArrowRight', columns, edges), undefined);
  });

  it('leaves other keys alone', () => {
    assert.equal(nextFocus(nodes[0], 'Enter', columns, edges), undefined);
    assert.equal(nextFocus(nodes[0], 'Home', columns, edges), undefined);
  });
});

describe('clampOffset', () => {
  const frame = {
    dx: 0,
    dy: 0,
    left: 100,
    top: 50,
    width: 80,
    height: 40,
    stageWidth: 1000,
    gridTop: 20,
    gridHeight: 400,
  };

  it('keeps pointer travel as-is inside the bounds', () => {
    assert.deepEqual(clampOffset({ x: 10, y: 5 }, { ...frame, dx: 20, dy: 5 }), { x: 30, y: 10 });
  });

  it('clamps at the right edge of the stage', () => {
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: 5000, dy: 0 }), { x: 820, y: 0 });
  });

  it('clamps at the left edge of the stage', () => {
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: -5000, dy: 0 }), { x: -100, y: 0 });
  });

  it('clamps at the bottom of the grid', () => {
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: 0, dy: 5000 }), { x: 0, y: 330 });
  });

  it('clamps at the top of the grid', () => {
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: 0, dy: -5000 }), { x: 0, y: -30 });
  });

  it('clamps both axes at the corners', () => {
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: -5000, dy: 5000 }), { x: -100, y: 330 });
    assert.deepEqual(clampOffset({ x: 0, y: 0 }, { ...frame, dx: 5000, dy: -5000 }), { x: 820, y: -30 });
  });
});

describe('routeFor', () => {
  const from: Box = { x: 0, y: 0, w: 100, h: 40 };
  const to: Box = { x: 200, y: 100, w: 60, h: 30 };

  it('routes a horizontal S-curve between columns on desktop', () => {
    assert.equal(
      routeFor({ from, to, fromKind: NodeKind.CAPABILITY, desktop: true, trunkX: 12 }),
      'M100 20C150 20 150 115 200 115',
    );
  });

  it('splits from the root along a rail when stacked', () => {
    assert.equal(
      routeFor({ from, to, fromKind: NodeKind.ROOT, desktop: false, trunkX: 12 }),
      'M50 40V62A8 8 0 0 0 58 70H222A8 8 0 0 1 230 78V100',
    );
  });

  it('sends every other edge down the shared trunk', () => {
    assert.equal(
      routeFor({ from, to, fromKind: NodeKind.CAPABILITY, desktop: false, trunkX: 12 }),
      'M50 40V46A8 8 0 0 1 42 54H20A8 8 0 0 0 12 62V107A8 8 0 0 0 20 115H200',
    );
  });
});
