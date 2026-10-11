import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planApp, type WorkflowEdgeSpec, WorkflowKind, type WorkflowNodeSpec } from '../components/demos/app-plan.ts';

const nodes: WorkflowNodeSpec[] = [
  { id: 'prompt', label: 'Prompt', kind: WorkflowKind.TEXT_INPUT },
  { id: 'style', label: 'Style', kind: WorkflowKind.TEXT_INPUT },
  { id: 'image', label: 'Image model', kind: WorkflowKind.IMAGE },
  { id: 'upscale', label: 'Upscale', kind: WorkflowKind.EDIT },
  { id: 'video', label: 'Video', kind: WorkflowKind.VIDEO },
];

const edges: WorkflowEdgeSpec[] = [
  { source: 'prompt', target: 'image' },
  { source: 'style', target: 'image' },
  { source: 'image', target: 'upscale' },
  { source: 'upscale', target: 'video' },
];

describe('planApp', () => {
  it('derives inputs, results, and internal steps from a connected selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'style', 'image', 'upscale', 'video']) });
    assert.deepEqual(plan.inputs, ['prompt', 'style']);
    assert.deepEqual(plan.outputs, ['video']);
    assert.deepEqual(plan.internal, ['image', 'upscale']);
    assert.deepEqual(plan.external, []);
    assert.equal(plan.flows, 1);
  });

  it('reports unselected nodes that still feed the selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'image', 'upscale']) });
    assert.deepEqual(plan.external, ['style']);
    assert.deepEqual(plan.outputs, ['upscale']);
  });

  it('treats a generator with no selected upstream as an input that runs on saved settings', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['image', 'upscale']) });
    assert.deepEqual(plan.inputs, ['image']);
    assert.deepEqual(plan.outputs, ['upscale']);
  });

  it('counts unconnected flows inside one selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'video']) });
    assert.equal(plan.flows, 2);
  });

  it('returns an empty plan for an empty selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set() });
    assert.deepEqual(plan, { inputs: [], outputs: [], internal: [], external: [], flows: 0 });
  });
});
