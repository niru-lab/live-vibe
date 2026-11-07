/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { heatPhase, heatScore, heatMarkerSize } from '../../lib/eventHeat';

const signals = (s: Partial<{ going_count: number; post_count: number; onsite_post_count: number; nearby_count: number }>) => ({
  going_count: 0, post_count: 0, onsite_post_count: 0, nearby_count: 0, ...s,
});

describe('Discover heat bubbles grow with real signals', () => {
  test('each RSVP adds to the bubble', () => {
    assert.equal(heatScore(signals({ going_count: 4 }), 'upcoming'), 4);
  });

  test('an on-site verified photo counts three times as much as an RSVP', () => {
    assert.equal(heatScore(signals({ post_count: 1, onsite_post_count: 1 }), 'upcoming'), 3);
    assert.equal(heatScore(signals({ post_count: 1 }), 'upcoming'), 1);
  });

  test('people nearby only count from 3 people and only while the event is live', () => {
    assert.equal(heatScore(signals({ nearby_count: 2 }), 'live'), 0);
    assert.equal(heatScore(signals({ nearby_count: 3 }), 'live'), 9); // 3 × 2 × 1.5
    assert.equal(heatScore(signals({ nearby_count: 5 }), 'tonight'), 0);
  });

  test('live events glow stronger, past events fade', () => {
    assert.equal(heatScore(signals({ going_count: 10 }), 'live'), 15);
    assert.equal(heatScore(signals({ going_count: 10 }), 'past'), 4);
  });

  test('phase: live between start and end, default end 6h after start', () => {
    const now = new Date('2026-11-07T22:00:00Z');
    assert.equal(heatPhase('2026-11-07T21:00:00Z', null, now), 'live');
    assert.equal(heatPhase('2026-11-07T14:00:00Z', null, now), 'past');
    assert.equal(heatPhase('2026-11-08T06:00:00Z', null, now), 'tonight');
    assert.equal(heatPhase('2026-11-10T21:00:00Z', null, now), 'upcoming');
  });

  test('pins grow from 28px and cap at 52px', () => {
    assert.equal(heatMarkerSize(0), 28);
    assert.equal(heatMarkerSize(10000), 52);
  });
});
