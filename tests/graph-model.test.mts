import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { capabilities } from '../content/capabilities.ts';
import { profile } from '../content/profile.ts';
import { projects } from '../content/projects.ts';
import { NodeKind, type GraphNodeModel } from '../components/graph/types.ts';

// graph-model.ts guards itself with `server-only`, which only resolves inside
// Next, so the test rebuilds the joins from the same content modules it reads.
// If content and graph drift apart — a mistyped capability id, a missing
// detail — one of these fails.

const ROOT_ID = 'hasib';

const nodes: GraphNodeModel[] = [
  {
    id: ROOT_ID,
    kind: NodeKind.ROOT,
    title: profile.name,
    shortTitle: profile.shortName,
    meta: profile.experience,
  },
  ...capabilities.map((capability) => ({
    id: capability.id,
    kind: NodeKind.CAPABILITY,
    title: capability.name,
    shortTitle: capability.shortName,
    meta: `${projects.filter((project) => project.capabilities.includes(capability.id)).length} projects`,
  })),
  ...projects.map((project) => ({
    id: project.slug,
    kind: NodeKind.PROJECT,
    title: project.shortTitle,
    shortTitle: project.shortTitle,
    meta: project.company,
    tone: project.tone,
  })),
];

const edges = [
  ...capabilities.map((capability) => ({ from: ROOT_ID, to: capability.id })),
  ...projects.flatMap((project) =>
    project.capabilities.map((capabilityId) => ({ from: capabilityId, to: project.slug })),
  ),
];

describe('graph model joins', () => {
  it('has one node per person, capability, and project', () => {
    const byKind = (kind: NodeKind) => nodes.filter((node) => node.kind === kind);
    assert.equal(byKind(NodeKind.ROOT).length, 1);
    assert.equal(byKind(NodeKind.CAPABILITY).length, capabilities.length);
    assert.equal(byKind(NodeKind.PROJECT).length, projects.length);
    assert.equal(nodes.length, 1 + capabilities.length + projects.length);
  });

  it('counts each capability’s projects from the content', () => {
    for (const capability of capabilities) {
      const meta = nodes.find((node) => node.id === capability.id)?.meta;
      const expected = projects.filter((project) => project.capabilities.includes(capability.id)).length;
      assert.ok(expected > 0, `${capability.id} should feed at least one project`);
      assert.equal(meta, `${expected} projects`);
    }
    assert.deepEqual(
      nodes.filter((node) => node.kind === NodeKind.CAPABILITY).map((node) => node.meta),
      ['3 projects', '4 projects', '3 projects', '3 projects'],
    );
  });

  it('opens on the root, which is always a node', () => {
    const root = nodes.find((node) => node.id === ROOT_ID);
    assert.ok(root, 'defaultFocus should exist in nodes');
    assert.equal(root?.kind, NodeKind.ROOT);
    assert.equal(root?.title, profile.name);
  });

  it('only wires nodes that exist', () => {
    const ids = new Set(nodes.map((node) => node.id));
    for (const edge of edges) {
      assert.ok(ids.has(edge.from), `unknown wire source: ${edge.from}`);
      assert.ok(ids.has(edge.to), `unknown wire target: ${edge.to}`);
    }
    const expected = capabilities.length + projects.reduce((sum, project) => sum + project.capabilities.length, 0);
    assert.equal(edges.length, expected);
  });

  it('writes an inspector detail for every node', () => {
    // Mirror of the details record in graph-model.ts, case-study links included.
    const details: Record<string, { title: string; link: { href: string } }> = {
      [ROOT_ID]: { title: profile.name, link: { href: '/about' } },
    };
    for (const capability of capabilities) {
      details[capability.id] = { title: capability.name, link: { href: '/#capabilities' } };
    }
    for (const project of projects) {
      details[project.slug] = { title: project.shortTitle, link: { href: `/work/${project.slug}` } };
    }

    for (const node of nodes) {
      const detail = details[node.id];
      assert.ok(detail, `no inspector detail for ${node.id}`);
      assert.equal(detail.title, node.title);
      assert.ok(detail.link.href.length > 0);
    }
    assert.equal(Object.keys(details).length, nodes.length);
  });
});
