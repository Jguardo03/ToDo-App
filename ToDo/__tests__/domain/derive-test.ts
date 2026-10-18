import { makeTask, minutesFromNow, NOW } from '../../config/jest/factories';

import {
  applyStatus,
  categoryStats,
  completionRate,
  countRemaining,
  counterDelta,
  displayStatus,
  isOverdue,
  progress,
  progressPercent,
  selectDueToday,
  sortByPriority,
  statusCounts,
} from '@/domain/derive';

describe('isOverdue', () => {
  it('is true when the due time has passed and the task is not done', () => {
    expect(isOverdue({ status: 'pending', dueAt: minutesFromNow(-1) }, NOW)).toBe(true);
    expect(isOverdue({ status: 'in_process', dueAt: minutesFromNow(-1) }, NOW)).toBe(true);
  });

  it('is false when due exactly now (the deadline has not passed yet)', () => {
    expect(isOverdue({ status: 'pending', dueAt: NOW }, NOW)).toBe(false);
  });

  it('is false for a future due time', () => {
    expect(isOverdue({ status: 'pending', dueAt: minutesFromNow(1) }, NOW)).toBe(false);
  });

  it('is never true for a done task, however late it is', () => {
    expect(isOverdue({ status: 'done', dueAt: minutesFromNow(-10_000) }, NOW)).toBe(false);
  });
});

describe('displayStatus', () => {
  it('replaces the stored status with overdue once the deadline passed', () => {
    expect(displayStatus({ status: 'pending', dueAt: minutesFromNow(-5) }, NOW)).toBe('overdue');
    expect(displayStatus({ status: 'in_process', dueAt: minutesFromNow(-5) }, NOW)).toBe('overdue');
  });

  it('keeps the stored status otherwise', () => {
    expect(displayStatus({ status: 'pending', dueAt: minutesFromNow(5) }, NOW)).toBe('pending');
    expect(displayStatus({ status: 'in_process', dueAt: minutesFromNow(5) }, NOW)).toBe('in_process');
    expect(displayStatus({ status: 'done', dueAt: minutesFromNow(-5) }, NOW)).toBe('done');
  });
});

describe('progress', () => {
  it('is done / total when the task has subtasks', () => {
    const task = makeTask({ status: 'in_process', subtaskTotal: 5, subtaskDone: 3 });
    expect(progress(task)).toBeCloseTo(0.6);
    expect(progressPercent(task)).toBe(60);
  });

  it('is 0 with no subtasks until the task is done', () => {
    expect(progress(makeTask({ subtaskTotal: 0 }))).toBe(0);
    expect(progress(makeTask({ subtaskTotal: 0, status: 'done' }))).toBe(1);
  });

  it('is 100% for a done task even if subtasks are left', () => {
    expect(progressPercent(makeTask({ status: 'done', subtaskTotal: 5, subtaskDone: 3 }))).toBe(100);
  });

  it('rounds the percent and never leaves 0..1', () => {
    expect(progressPercent(makeTask({ subtaskTotal: 3, subtaskDone: 1 }))).toBe(33);
    expect(progress(makeTask({ subtaskTotal: 2, subtaskDone: 5 }))).toBe(1);
  });
});

describe('statusCounts', () => {
  it('counts each task once, by displayed status', () => {
    const tasks = [
      makeTask({ status: 'pending', dueAt: minutesFromNow(30) }),
      makeTask({ status: 'pending', dueAt: minutesFromNow(-30) }), // overdue
      makeTask({ status: 'in_process', dueAt: minutesFromNow(30) }),
      makeTask({ status: 'in_process', dueAt: minutesFromNow(-30) }), // overdue
      makeTask({ status: 'done', dueAt: minutesFromNow(-30) }),
    ];
    expect(statusCounts(tasks, NOW)).toEqual({ pending: 1, in_process: 1, done: 1, overdue: 2 });
  });

  it('returns zeros for no tasks', () => {
    expect(statusCounts([], NOW)).toEqual({ pending: 0, in_process: 0, done: 0, overdue: 0 });
  });
});

describe('categoryStats', () => {
  it('computes total, done, overdue and the done ratio', () => {
    const tasks = [
      makeTask({ status: 'done' }),
      makeTask({ status: 'done' }),
      makeTask({ status: 'pending', dueAt: minutesFromNow(-1) }),
      makeTask({ status: 'in_process' }),
    ];
    expect(categoryStats(tasks, NOW)).toEqual({ total: 4, done: 2, overdue: 1, doneRatio: 0.5 });
  });

  it('has a zero ratio for an empty category', () => {
    expect(categoryStats([], NOW)).toEqual({ total: 0, done: 0, overdue: 0, doneRatio: 0 });
  });
});

describe('applyStatus', () => {
  it('sets completedAt when a task becomes done', () => {
    expect(applyStatus({ status: 'in_process' }, 'done', NOW)).toEqual({ status: 'done', completedAt: NOW });
  });

  it('clears completedAt when a task leaves done', () => {
    expect(applyStatus({ status: 'done', completedAt: NOW }, 'in_process', minutesFromNow(5))).toEqual({
      status: 'in_process',
      completedAt: undefined,
    });
  });

  it('keeps the original completion time when it stays done', () => {
    const earlier = minutesFromNow(-90);
    expect(applyStatus({ status: 'done', completedAt: earlier }, 'done', NOW).completedAt).toBe(earlier);
  });

  it('does not set completedAt for non-done statuses', () => {
    expect(applyStatus({ status: 'pending' }, 'in_process', NOW).completedAt).toBeUndefined();
  });
});

describe('counterDelta', () => {
  it('adds one to the total for a new subtask, and one to done when it starts done', () => {
    expect(counterDelta(undefined, { status: 'pending' })).toEqual({ total: 1, done: 0 });
    expect(counterDelta(undefined, { status: 'done' })).toEqual({ total: 1, done: 1 });
  });

  it('removes one from the total, and from done when the removed subtask was done', () => {
    expect(counterDelta({ status: 'pending' }, undefined)).toEqual({ total: -1, done: 0 });
    expect(counterDelta({ status: 'done' }, undefined)).toEqual({ total: -1, done: -1 });
  });

  it('moves done by one when a subtask enters or leaves done, and not at all otherwise', () => {
    expect(counterDelta({ status: 'pending' }, { status: 'done' })).toEqual({ total: 0, done: 1 });
    expect(counterDelta({ status: 'done' }, { status: 'in_process' })).toEqual({ total: 0, done: -1 });
    expect(counterDelta({ status: 'done' }, { status: 'done' })).toEqual({ total: 0, done: 0 });
    expect(counterDelta({ status: 'pending' }, { status: 'in_process' })).toEqual({ total: 0, done: 0 });
  });
});

describe('Home helpers', () => {
  const at = (hours: number, minutes = 0, dayOffset = 0) => new Date(2026, 9, 18 + dayOffset, hours, minutes);

  it('selectDueToday keeps only today (any status), soonest first, without changing the input', () => {
    const input = [
      makeTask({ id: 'late', dueAt: at(18) }),
      makeTask({ id: 'yesterday', dueAt: at(23, 59, -1) }),
      makeTask({ id: 'tomorrow', dueAt: at(0, 0, 1) }),
      makeTask({ id: 'early', dueAt: at(9), status: 'done' }),
      makeTask({ id: 'midnight', dueAt: at(0, 0) }),
    ];
    const copy = [...input];
    expect(selectDueToday(input, NOW).map((t) => t.id)).toEqual(['midnight', 'early', 'late']);
    expect(input).toEqual(copy);
  });

  it('countRemaining counts tasks that are not done', () => {
    expect(countRemaining([{ status: 'done' }, { status: 'pending' }, { status: 'in_process' }])).toBe(2);
    expect(countRemaining([])).toBe(0);
  });

  it('sortByPriority puts urgent first and keeps soonest-due order within a level', () => {
    const input = [
      makeTask({ id: 'low', priority: 'low', dueAt: at(9) }),
      makeTask({ id: 'high-late', priority: 'high', dueAt: at(18) }),
      makeTask({ id: 'urgent', priority: 'urgent', dueAt: at(20) }),
      makeTask({ id: 'high-early', priority: 'high', dueAt: at(10) }),
    ];
    expect(sortByPriority(input).map((t) => t.id)).toEqual(['urgent', 'high-early', 'high-late', 'low']);
    expect(input.map((t) => t.id)).toEqual(['low', 'high-late', 'urgent', 'high-early']);
  });

  it('completionRate is done / all as a whole percent, 0 when empty', () => {
    expect(completionRate([])).toBe(0);
    expect(completionRate([{ status: 'done' }, { status: 'pending' }, { status: 'pending' }])).toBe(33);
    expect(completionRate([{ status: 'done' }])).toBe(100);
  });
});
