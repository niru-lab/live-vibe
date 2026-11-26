/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REVIEW_CATEGORIES, distributionShares, formatRating, maxPointsFor, nightLabel, pointsForReview, ratingsComplete,
} from '../../lib/reviews';

describe('Reviews: categories', () => {
  test('the five agreed categories, wait time instead of "Dauer"', () => {
    assert.deepEqual(REVIEW_CATEGORIES.map((c) => c.key), ['overall', 'music', 'service', 'drinks', 'wait']);
    assert.equal(REVIEW_CATEGORIES.find((c) => c.key === 'wait')?.label, 'Wartezeit');
  });
  test('sending needs all five rows', () => {
    assert.equal(ratingsComplete({ overall: 5, music: 4, service: 3, drinks: 4 }), false);
    assert.equal(ratingsComplete({ overall: 5, music: 4, service: 3, drinks: 4, wait: 0 }), false);
    assert.equal(ratingsComplete({ overall: 1, music: 1, service: 1, drinks: 1, wait: 1 }), true);
  });
});

describe('Reviews: points (same for every rating)', () => {
  test('+5 base, +3 with a text from 30 characters', () => {
    assert.equal(pointsForReview(''), 5);
    assert.equal(pointsForReview('  kurz  '), 5);
    assert.equal(pointsForReview('x'.repeat(29)), 5);
    assert.equal(pointsForReview('x'.repeat(30)), 8);
  });
  test('"bis zu" for a night = n × 8 + 5 night bonus', () => {
    assert.equal(maxPointsFor(0), 0);
    assert.equal(maxPointsFor(1), 13);
    assert.equal(maxPointsFor(4), 37);
  });
});

describe('Reviews: display', () => {
  test('German number format', () => {
    assert.equal(formatRating(4.25), '4,3');
    assert.equal(formatRating(5), '5,0');
    assert.equal(formatRating(null), '–');
  });
  test('distribution bars relative to the biggest bucket', () => {
    assert.deepEqual(distributionShares([4, 2, 0, 0, 1]), [1, 0.5, 0, 0, 0.25]);
    assert.deepEqual(distributionShares([0, 0, 0, 0, 0]), [0, 0, 0, 0, 0]);
  });
  test('night label', () => assert.match(nightLabel('2026-11-27'), /^Fr\.?, 27\.11\.$/));
});
