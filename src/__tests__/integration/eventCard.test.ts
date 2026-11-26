/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm, eventDistanceLabel, eventTimeLabel, formatDistance, isEventLive, socialLine } from '../../lib/eventCard';

const now = new Date(2026, 10, 27, 23, 10); // Fr., 27.11.2026 23:10 local

describe('Event card: time label', () => {
  test('today', () => assert.equal(eventTimeLabel(new Date(2026, 10, 27, 23, 0).toISOString(), now), 'Heute, 23:00'));
  test('tomorrow', () => assert.equal(eventTimeLabel(new Date(2026, 10, 28, 22, 0).toISOString(), now), 'Morgen, 22:00'));
  test('later', () => assert.match(eventTimeLabel(new Date(2026, 10, 30, 21, 30).toISOString(), now), /^Mo\.?, 30\.11\. · 21:30$/));
});

describe('Event card: live', () => {
  test('started, no end → live for 6 h', () => {
    assert.equal(isEventLive({ starts_at: new Date(2026, 10, 27, 22, 0).toISOString() }, now), true);
    assert.equal(isEventLive({ starts_at: new Date(2026, 10, 27, 16, 0).toISOString() }, now), false);
  });
  test('not started yet → not live', () => assert.equal(isEventLive({ starts_at: new Date(2026, 10, 27, 23, 30).toISOString() }, now), false));
});

describe('Event card: distance', () => {
  const me = { lat: 48.8378, lng: 10.0933 }; // Aalen
  test('formats like the design', () => {
    assert.equal(formatDistance(1.234), '1,2 km');
    assert.equal(formatDistance(0.34), '350 m');
    assert.equal(formatDistance(0.01), '50 m');
  });
  test('roughly correct', () => {
    const d = distanceKm(me, { lat: 48.8378 + 0.009, lng: 10.0933 }); // ~1 km north
    assert.ok(d > 0.95 && d < 1.05, String(d));
  });
  test('only for public events with a known position', () => {
    const ev = { latitude: 48.84, longitude: 10.1, visibility: 'public' };
    assert.ok(eventDistanceLabel(ev, me));
    assert.equal(eventDistanceLabel({ ...ev, visibility: 'private' }, me), null);
    assert.equal(eventDistanceLabel(ev, null), null);
    assert.equal(eventDistanceLabel({ ...ev, latitude: null }, me), null);
  });
});

describe('Event card: social line', () => {
  test('live shows who is there', () => assert.equal(socialLine({ going: 248, interested: 400 }, true), '248 sind dabei'));
  test('upcoming shows the bigger number', () => {
    assert.equal(socialLine({ going: 10, interested: 124 }, false), '124 interessiert');
    assert.equal(socialLine({ going: 30, interested: 5 }, false), '30 sind dabei');
  });
  test('singular and empty', () => {
    assert.equal(socialLine({ going: 1, interested: 0 }, true), '1 ist dabei');
    assert.equal(socialLine({ going: 0, interested: 0 }, false), null);
  });
});
