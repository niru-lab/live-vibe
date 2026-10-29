import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { approximateDistanceKm, isInMapArea } from '../../lib/mapArea';

describe('Search the displayed map area', () => {
  const area = { west: 9.1, east: 9.3, south: 48.7, north: 48.9 };
  test('keeps pins inside the selected viewport and excludes pins outside', () => {
    assert.equal(isInMapArea(48.8, 9.2, area), true);
    assert.equal(isInMapArea(49, 9.2, area), false);
    assert.equal(isInMapArea(48.8, 9.4, area), false);
  });
  test('clearing the area restores all coordinates', () => {
    assert.equal(isInMapArea(52.52, 13.405, null), true);
  });
  test('uses provided display coordinates, including approximate private pins', () => {
    assert.equal(isInMapArea(48.8, 9.2, area), true);
    assert.equal(isInMapArea(48.8, 9.09, area), false);
  });
  test('distance from the map center is geographically correct', () => {
    assert.equal(approximateDistanceKm([48.7758, 9.1829], [48.7758, 9.1829]), 0);
    assert.ok(Math.abs(approximateDistanceKm([0, 0], [0, 1]) - 111.19) < 0.05);
  });
});