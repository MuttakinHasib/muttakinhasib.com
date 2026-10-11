import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planApp, type WorkflowEdgeSpec, WorkflowKind, type WorkflowNodeSpec } from '../components/demos/app-plan.ts';

const nodes: WorkflowNodeSpec[] = [
  { id: 'prompt', label: 'Prompt', kind: WorkflowKind.TEXT_INPUT },
  { id: 'style', label: 'Style', kind: WorkflowKind.TEXT_INPUT },
  { id: 'image', label: 'Image model', kind: WorkflowKind.IMAGE },
  { id: 'upscale', label: 'Upscale', kind: WorkflowKind.EDIT },
  { id: 'video', label: 'Video', kind: WorkflowKind.VIDEO },
  { id: 'caption', label: 'Caption', kind: WorkflowKind.TEXT },
];

const edges: WorkflowEdgeSpec[] = [
  { source: 'prompt', target: 'image' },
  { source: 'style', target: 'image' },
  { source: 'image', target: 'upscale' },
  { source: 'upscale', target: 'video' },
  { source: 'image', target: 'caption' },
];

describe('planApp', () => {
  it('plans entry inputs, leaf outputs, and internal steps from a connected selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'style', 'image', 'upscale', 'video']) });
    assert.deepEqual(plan.inputs, ['prompt', 'style']);
    assert.deepEqual(plan.outputs, ['video']);
    assert.deepEqual(plan.internal, ['image', 'upscale']);
    assert.equal(plan.disabledReason, null);
  });

  it('ignores edges that leave the selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'image', 'upscale']) });
    assert.deepEqual(plan.outputs, ['upscale']);
    assert.deepEqual(plan.inputs, ['prompt']);
  });

  it('can plan several outputs from one selection', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'image', 'upscale', 'video', 'caption']) });
    assert.deepEqual(plan.outputs, ['video', 'caption']);
  });

  it('drops an input that reaches no planned output', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'style', 'upscale', 'video']) });
    assert.deepEqual(plan.outputs, ['video']);
    assert.deepEqual(plan.inputs, []);
    assert.match(plan.disabledReason ?? '', /feeds a result/);
  });

  it('never plans a generator with nothing selected upstream as an output', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['image', 'caption']) });
    assert.deepEqual(plan.outputs, ['caption']);
    assert.deepEqual(plan.inputs, []);
  });

  it('is disabled for a selection that produces nothing', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['prompt', 'style']) });
    assert.match(plan.disabledReason ?? '', /produces a result/);
  });

  it('is disabled for fewer than two nodes', () => {
    const plan = planApp({ nodes, edges, selected: new Set(['video']) });
    assert.match(plan.disabledReason ?? '', /at least two/);
  });
});
