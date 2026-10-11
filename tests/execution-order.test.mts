import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createsCycle, type DagEdge, executionPlan } from '../components/demos/execution-order.ts';

const nodes = ['trigger', 'kb', 'search', 'llm', 'reply'];
const edges: DagEdge[] = [
  { from: 'trigger', to: 'kb' },
  { from: 'trigger', to: 'search' },
  { from: 'kb', to: 'llm' },
  { from: 'search', to: 'llm' },
  { from: 'llm', to: 'reply' },
];

describe('executionPlan', () => {
  it('orders tasks so every edge runs source before target', () => {
    const { order } = executionPlan(nodes, edges);
    for (const { from, to } of edges) assert.ok(order.indexOf(from) < order.indexOf(to), `${from} before ${to}`);
  });

  it('assigns longest-path depth for auto-layout columns', () => {
    const { depth } = executionPlan(nodes, edges);
    assert.deepEqual(Object.fromEntries(depth), { trigger: 0, kb: 1, search: 1, llm: 2, reply: 3 });
  });

  it('breaks ties by canvas order within a layer', () => {
    assert.deepEqual(executionPlan(nodes, edges).order, ['trigger', 'kb', 'search', 'llm', 'reply']);
  });

  it('keeps disconnected nodes at depth zero', () => {
    const { depth, order } = executionPlan([...nodes, 'orphan'], edges);
    assert.equal(depth.get('orphan'), 0);
    assert.ok(order.includes('orphan'));
  });
});

describe('createsCycle', () => {
  it('rejects an edge that would loop back', () => {
    assert.equal(createsCycle(edges, { from: 'reply', to: 'kb' }), true);
  });

  it('rejects self-loops', () => {
    assert.equal(createsCycle(edges, { from: 'llm', to: 'llm' }), true);
  });

  it('accepts an edge that keeps the graph acyclic', () => {
    assert.equal(createsCycle(edges, { from: 'kb', to: 'reply' }), false);
  });
});
