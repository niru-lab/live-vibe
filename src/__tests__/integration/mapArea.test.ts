import { describe, expect, test } from 'bun:test';
import { approximateDistanceKm, isInMapArea } from '../../lib/mapArea';

describe('Search the displayed map area', () => {
  const area = { west: 9.1, east: 9.3, south: 48.7, north: 48.9 };
  test('keeps pins inside the selected viewport and excludes pins outside', () => {
    expect(isInMapArea(48.8, 9.2, area)).toBe(true);
    expect(isInMapArea(49, 9.2, area)).toBe(false);
    expect(isInMapArea(48.8, 9.4, area)).toBe(false);
  });
  test('clearing the area restores all coordinates', () => {
    expect(isInMapArea(52.52, 13.405, null)).toBe(true);
  });
  test('uses provided display coordinates, including approximate private pins', () => {
    expect(isInMapArea(48.8, 9.2, area)).toBe(true);
    expect(isInMapArea(48.8, 9.09, area)).toBe(false);
  });
  test('distance from the map center is geographically correct', () => {
    expect(approximateDistanceKm([48.7758, 9.1829], [48.7758, 9.1829])).toBe(0);
    expect(approximateDistanceKm([0, 0], [0, 1])).toBeCloseTo(111.19, 1);
  });
});