import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { edgeKey, type GraphEdge, neighbours, plan } from '../components/graph/planner.ts';

const edges: GraphEdge[] = [
  { from: 'root', to: 'interactive' },
  { from: 'root', to: 'ai' },
  { from: 'root', to: 'platform' },
  { from: 'interactive', to: 'app-builder' },
  { from: 'ai', to: 'app-builder' },
  { from: 'ai', to: 'cocoding' },
  { from: 'platform', to: 'hashmato' },
];

describe('plan', () => {
  it('traces a project back to the capabilities and person it is built from', () => {
    const result = plan(edges, 'app-builder');
    assert.deepEqual([...result.upstream].sort(), ['ai', 'interactive', 'root']);
    assert.equal(result.downstream.size, 0);
  });

  it('keeps only edges that lie on a path through the focus', () => {
    const result = plan(edges, 'app-builder');
    assert.deepEqual([...result.activeEdges].sort(), [
      'ai->app-builder',
      'interactive->app-builder',
      'root->ai',
      'root->interactive',
    ]);
    assert.equal(result.activeEdges.has('ai->cocoding'), false);
    assert.equal(result.activeEdges.has('root->platform'), false);
  });

  it('traces a capability forward to the projects it feeds', () => {
    const result = plan(edges, 'ai');
    assert.deepEqual([...result.upstream], ['root']);
    assert.deepEqual([...result.downstream].sort(), ['app-builder', 'cocoding']);
  });

  it('activates every edge from the root', () => {
    assert.equal(plan(edges, 'root').activeEdges.size, edges.length);
  });
});

describe('neighbours', () => {
  it('lists direct upstream and downstream nodes', () => {
    assert.deepEqual(neighbours(edges, 'ai'), { up: ['root'], down: ['app-builder', 'cocoding'] });
  });
});

describe('edgeKey', () => {
  it('is stable for a given edge', () => {
    assert.equal(edgeKey({ from: 'a', to: 'b' }), 'a->b');
  });
});
