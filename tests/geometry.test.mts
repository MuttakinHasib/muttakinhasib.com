import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { channelWire } from '../components/graph/geometry.ts';

describe('channelWire', () => {
  const from = { x: 240, y: 760 };
  const to = { x: 1040, y: 560 };

  it('starts at the source port and ends at the target port', () => {
    const d = channelWire({ from, to, channelY: 540 });
    assert.ok(d.startsWith('M240 760'));
    assert.ok(d.endsWith('1040 560'));
  });

  it('runs along the channel between the rise and the settle', () => {
    assert.match(channelWire({ from, to, channelY: 540 }), /336 540L944 540/);
  });
});
