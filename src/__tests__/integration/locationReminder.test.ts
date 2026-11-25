/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_REMINDER_STATE, LOCATION_REMINDER, markReminderDismissed, markReminderShown, registerOpen, reminderAllowed,
} from '../../lib/locationReminder';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const t0 = Date.parse('2026-11-25T20:00:00Z');

describe('Location reminder: 2nd app open within an hour', () => {
  test('first open never triggers', () => {
    assert.equal(registerOpen(EMPTY_REMINDER_STATE, t0).secondOpenWithinWindow, false);
  });

  test('second open 20 min later triggers', () => {
    const first = registerOpen(EMPTY_REMINDER_STATE, t0).state;
    assert.equal(registerOpen(first, t0 + 20 * MIN).secondOpenWithinWindow, true);
  });

  test('switching back within 2 min is not a new open', () => {
    const first = registerOpen(EMPTY_REMINDER_STATE, t0).state;
    const quick = registerOpen(first, t0 + 1 * MIN);
    assert.equal(quick.secondOpenWithinWindow, false);
    assert.equal(quick.state.lastOpenAt, t0);
  });

  test('second open after more than an hour does not trigger', () => {
    const first = registerOpen(EMPTY_REMINDER_STATE, t0).state;
    assert.equal(registerOpen(first, t0 + 61 * MIN).secondOpenWithinWindow, false);
  });

  test('at most one reminder per 7 days', () => {
    const shown = markReminderShown(EMPTY_REMINDER_STATE, t0);
    assert.equal(reminderAllowed(shown, t0 + 6 * DAY), false);
    assert.equal(reminderAllowed(shown, t0 + 7 * DAY), true);
  });

  test('stops after 3× "Nicht jetzt"', () => {
    let s = EMPTY_REMINDER_STATE;
    for (let i = 0; i < LOCATION_REMINDER.maxDismissals; i++) s = markReminderDismissed(s);
    assert.equal(reminderAllowed(s, t0 + 365 * DAY), false);
  });
});
