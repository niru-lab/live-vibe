/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { claimErrorMessage, formatShortCode, tonightWindow, walletCardState } from '../../lib/offers';
import { normalizeScanInput, scanMessage, shouldProcessScan, RESCAN_COOLDOWN_MS } from '../../lib/dealScan';

const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

describe('Deal: "Heute Abend" preset', () => {
  test('afternoon → 20:00 today until 02:00 tomorrow', () => {
    const { start, end } = tonightWindow(at(2026, 11, 27, 15));
    assert.deepEqual([start.getDate(), start.getHours()], [27, 20]);
    assert.deepEqual([end.getDate(), end.getHours()], [28, 2]);
  });
  test('already 22:30 → starts now', () => {
    const now = at(2026, 11, 27, 22, 30);
    const { start, end } = tonightWindow(now);
    assert.equal(start.getTime(), now.getTime());
    assert.deepEqual([end.getDate(), end.getHours()], [28, 2]);
  });
  test('00:30 → until 02:00 the same night', () => {
    const now = at(2026, 11, 28, 0, 30);
    const { end } = tonightWindow(now);
    assert.deepEqual([end.getDate(), end.getHours()], [28, 2]);
  });
  test('01:45 → at least one hour', () => {
    const now = at(2026, 11, 28, 1, 45);
    const { end } = tonightWindow(now);
    assert.equal(end.getTime() - now.getTime(), 3_600_000);
  });
});

describe('Deal: wallet ticket state', () => {
  const now = at(2026, 11, 27, 23);
  const item = (status: string, s: Date, e: Date) => ({ status, starts_at: s.toISOString(), ends_at: e.toISOString() });
  test('running → ready', () => assert.equal(walletCardState(item('active', at(2026, 11, 27, 20), at(2026, 11, 28, 2)), now), 'ready'));
  test('later tonight → upcoming', () => assert.equal(walletCardState(item('active', at(2026, 11, 27, 23, 30), at(2026, 11, 28, 2)), now), 'upcoming'));
  test('over → expired', () => assert.equal(walletCardState(item('active', at(2026, 11, 27, 18), at(2026, 11, 27, 22)), now), 'expired'));
  test('scanned → redeemed, even while running', () => assert.equal(walletCardState(item('redeemed', at(2026, 11, 27, 20), at(2026, 11, 28, 2)), now), 'redeemed'));
});

describe('Deal: codes', () => {
  test('backup code is shown as XXX-XXX', () => assert.equal(formatShortCode('k7q4m2'), 'K7Q-4M2'));
  test('QR token (64 hex) is accepted and lower-cased', () => {
    const token = 'A'.repeat(64);
    assert.equal(normalizeScanInput(token), 'a'.repeat(64));
  });
  test('typed backup code with dash/space/lowercase is accepted', () => {
    assert.equal(normalizeScanInput(' k7q-4m2 '), 'K7Q4M2');
    assert.equal(normalizeScanInput('K7Q 4M2'), 'K7Q4M2');
  });
  test('anything else (URLs, other QR codes) is rejected before hitting the server', () => {
    assert.equal(normalizeScanInput('https://example.com'), null);
    assert.equal(normalizeScanInput('12345'), null);
  });
});

describe('Deal: scanner', () => {
  test('the same QR seen again by the camera is ignored for a few seconds', () => {
    const last = { value: 'ABC123', at: 1000 };
    assert.equal(shouldProcessScan('ABC123', last, 1000 + RESCAN_COOLDOWN_MS - 1), false);
    assert.equal(shouldProcessScan('ABC123', last, 1000 + RESCAN_COOLDOWN_MS + 1), true);
    assert.equal(shouldProcessScan('XYZ789', last, 1001), true);
  });
  test('result texts: only "ok" is green, unknown results fall back safely', () => {
    assert.equal(scanMessage('ok').ok, true);
    assert.equal(scanMessage('already_redeemed').ok, false);
    assert.equal(scanMessage('something_new').title, 'Unbekannter Code');
  });
  test('activation errors are readable', () => {
    assert.match(claimErrorMessage('deal_sold_out'), /vergriffen/);
    assert.match(claimErrorMessage('deal_age_restricted'), /18/);
  });
});
