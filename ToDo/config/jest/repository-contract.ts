/**
 * Behaviour every repository implementation must have. Run against the in-memory fake in every test run,
 * and against the Firestore implementation when the Firestore emulator is available
 * (`__tests__/repositories/firestore-emulator-test.ts`).
 */

import { RepositoryError } from '@/repositories/errors';
import type { Repositories } from '@/repositories/types';

export const CLOCK_START = new Date('2026-10-18T12:00:00');

export type ContractContext = {
  repos: Repositories;
  /** Moves the clock the repositories were built with. */
  setNow: (date: Date) => void;
  /** Removes everything created for the given usernames. Needed only for implementations that persist data. */
  cleanup?: (usernames: string[]) => Promise<void>;
};

export type ContractFactory = () => ContractContext | Promise<ContractContext>;

let counter = 0;
const createdUsernames: string[] = [];

/** A fresh valid username; every one is remembered so `cleanup` can remove its data afterwards. */
export function uniqueUsername(): string {
  counter += 1;
  const name = `ct${Date.now().toString(36)}${counter}${Math.random().toString(36).slice(2, 5)}`.slice(0, 20);
  createdUsernames.push(name);
  return name;
}

async function eventually(check: () => void, timeoutMs = 3000) {
  const start = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - start > timeoutMs) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

const at = (hours: number, minutes = 0, dayOffset = 0) =>
  new Date(2026, 9, 18 + dayOffset, hours, minutes, 0, 0);

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(RepositoryError);
  await expect(promise).rejects.toMatchObject({ code });
}

export function describeRepositoryContract(label: string, factory: ContractFactory) {
  describe(`repository contract: ${label}`, () => {
    let repos: Repositories;
    let setNow: (date: Date) => void;
    let username: string;
    let categoryId: string;

    let cleanup: ContractContext['cleanup'];

    afterAll(async () => {
      if (cleanup) await cleanup(createdUsernames.splice(0));
    });

    beforeEach(async () => {
      ({ repos, setNow, cleanup } = await factory());
      setNow(CLOCK_START);
      username = uniqueUsername();
      await repos.users.create(username);
      categoryId = (await repos.categories.create(username, { name: 'Design', description: '', color: '#b7004f' })).id;
    });

    const newTask = (overrides: Record<string, unknown> = {}) => ({
      categoryId,
      name: 'Finalize Homepage Wireframes',
      description: 'Prepare component hierarchy.',
      priority: 'high' as const,
      dueAt: at(17),
      ...overrides,
    });

    describe('users', () => {
      it('creates a user and reads it back', async () => {
        const name = uniqueUsername();
        expect(await repos.users.exists(name)).toBe(false);
        const user = await repos.users.create(name, 'Rune');
        expect(user).toMatchObject({ username: name, displayName: 'Rune', createdAt: CLOCK_START, lastActiveAt: CLOCK_START });
        expect(await repos.users.exists(name)).toBe(true);
        expect(await repos.users.get(name)).toEqual(user);
      });

      it('rejects a taken username', async () => {
        await rejectsWith(repos.users.create(username), 'already-exists');
      });

      it('rejects an invalid username', async () => {
        await rejectsWith(repos.users.create('Not Valid!'), 'invalid');
      });

      it('returns null for a missing user', async () => {
        expect(await repos.users.get(uniqueUsername())).toBeNull();
      });

      it('touch updates lastActiveAt only', async () => {
        setNow(at(15));
        await repos.users.touch(username);
        const user = await repos.users.get(username);
        expect(user?.lastActiveAt).toEqual(at(15));
        expect(user?.createdAt).toEqual(CLOCK_START);
      });
    });

    describe('categories', () => {
      it('creates, lists, gets and updates', async () => {
        setNow(at(12, 1)); // later than "Design", so the list order is defined
        const created = await repos.categories.create(username, { name: ' Development ', description: 'Code', color: '#00696b' });
        expect(created).toMatchObject({ name: 'Development', description: 'Code', color: '#00696b' });
        expect((await repos.categories.list(username)).map((c) => c.name)).toEqual(['Design', 'Development']);
        expect(await repos.categories.get(username, created.id)).toEqual(created);

        setNow(at(13));
        await repos.categories.update(username, created.id, { name: 'Coding' });
        expect(await repos.categories.get(username, created.id)).toMatchObject({ name: 'Coding', updatedAt: at(13) });
      });

      it('rejects invalid input', async () => {
        await rejectsWith(repos.categories.create(username, { name: '', description: '', color: '#b7004f' }), 'invalid');
        await rejectsWith(repos.categories.update(username, categoryId, { color: 'red' }), 'invalid');
      });

      it('fails for a missing category on update', async () => {
        await rejectsWith(repos.categories.update(username, 'nope', { name: 'X' }), 'not-found');
      });

      it('cannot be removed while tasks use it, then can', async () => {
        const task = await repos.tasks.create(username, newTask());
        await rejectsWith(repos.categories.remove(username, categoryId), 'category-in-use');
        await repos.tasks.remove(username, task.id);
        await repos.categories.remove(username, categoryId);
        expect(await repos.categories.get(username, categoryId)).toBeNull();
      });

      it('keeps each user separate', async () => {
        const other = uniqueUsername();
        await repos.users.create(other);
        expect(await repos.categories.list(other)).toEqual([]);
      });

      it('streams changes until unsubscribed', async () => {
        const seen: number[] = [];
        const unsubscribe = repos.categories.subscribe(username, (items) => seen.push(items.length));
        await eventually(() => expect(seen.at(-1)).toBe(1));
        await repos.categories.create(username, { name: 'Meeting', description: '', color: '#795600' });
        await eventually(() => expect(seen.at(-1)).toBe(2));
        unsubscribe();
        await repos.categories.create(username, { name: 'Coding', description: '', color: '#5b3f44' });
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(seen.at(-1)).toBe(2);
      });
    });

    describe('tasks', () => {
      it('creates a pending task with zeroed counters and timestamps', async () => {
        const task = await repos.tasks.create(username, newTask({ description: 'x', startAt: at(16) }));
        expect(task).toMatchObject({
          categoryId,
          name: 'Finalize Homepage Wireframes',
          priority: 'high',
          status: 'pending',
          startAt: at(16),
          dueAt: at(17),
          subtaskTotal: 0,
          subtaskDone: 0,
          createdAt: CLOCK_START,
          updatedAt: CLOCK_START,
        });
        expect(task.completedAt).toBeUndefined();
        expect(await repos.tasks.get(username, task.id)).toEqual(task);
      });

      it('sets completedAt when created as done', async () => {
        const task = await repos.tasks.create(username, newTask({ status: 'done' }));
        expect(task.completedAt).toEqual(CLOCK_START);
      });

      it('rejects bad input and an unknown category', async () => {
        await rejectsWith(repos.tasks.create(username, newTask({ name: ' ' })), 'invalid');
        await rejectsWith(repos.tasks.create(username, newTask({ categoryId: 'missing' })), 'not-found');
        await rejectsWith(repos.tasks.create(username, newTask({ startAt: at(18) })), 'invalid');
      });

      it('updates fields and clears the start time', async () => {
        const task = await repos.tasks.create(username, newTask({ startAt: at(16) }));
        setNow(at(14));
        await repos.tasks.update(username, task.id, { name: 'Renamed', priority: 'urgent', startAt: null });
        const updated = await repos.tasks.get(username, task.id);
        expect(updated).toMatchObject({ name: 'Renamed', priority: 'urgent', updatedAt: at(14) });
        expect(updated?.startAt).toBeUndefined();
        expect(updated?.createdAt).toEqual(CLOCK_START);
      });

      it('moves status and manages completedAt', async () => {
        const task = await repos.tasks.create(username, newTask());
        setNow(at(13));
        await repos.tasks.setStatus(username, task.id, 'done');
        expect(await repos.tasks.get(username, task.id)).toMatchObject({ status: 'done', completedAt: at(13) });
        setNow(at(14));
        await repos.tasks.setStatus(username, task.id, 'in_process');
        const reopened = await repos.tasks.get(username, task.id);
        expect(reopened?.status).toBe('in_process');
        expect(reopened?.completedAt).toBeUndefined();
      });

      it('lists soonest due first', async () => {
        await repos.tasks.create(username, newTask({ name: 'Late', dueAt: at(18) }));
        await repos.tasks.create(username, newTask({ name: 'Early', dueAt: at(9) }));
        await repos.tasks.create(username, newTask({ name: 'Middle', dueAt: at(12, 30) }));
        expect((await repos.tasks.list(username)).map((t) => t.name)).toEqual(['Early', 'Middle', 'Late']);
      });

      it('lists by local calendar day, including midnight edges', async () => {
        await repos.tasks.create(username, newTask({ name: 'Yesterday 23:59', dueAt: at(23, 59, -1) }));
        await repos.tasks.create(username, newTask({ name: 'Today 00:00', dueAt: at(0, 0) }));
        await repos.tasks.create(username, newTask({ name: 'Today 23:59', dueAt: at(23, 59) }));
        await repos.tasks.create(username, newTask({ name: 'Tomorrow 00:00', dueAt: at(0, 0, 1) }));
        expect((await repos.tasks.listByDay(username, at(15))).map((t) => t.name)).toEqual(['Today 00:00', 'Today 23:59']);
        expect((await repos.tasks.listDueToday(username)).map((t) => t.name)).toEqual(['Today 00:00', 'Today 23:59']);
        expect((await repos.tasks.listByDay(username, at(8, 0, 1))).map((t) => t.name)).toEqual(['Tomorrow 00:00']);
      });

      it('lists by category and by stored status, soonest first', async () => {
        const other = (await repos.categories.create(username, { name: 'Meeting', description: '', color: '#795600' })).id;
        const a = await repos.tasks.create(username, newTask({ name: 'A', dueAt: at(18) }));
        await repos.tasks.create(username, newTask({ name: 'B', dueAt: at(9), categoryId: other }));
        await repos.tasks.create(username, newTask({ name: 'C', dueAt: at(10) }));
        await repos.tasks.setStatus(username, a.id, 'in_process');
        expect((await repos.tasks.listByCategory(username, categoryId)).map((t) => t.name)).toEqual(['C', 'A']);
        expect((await repos.tasks.listByStatus(username, 'in_process')).map((t) => t.name)).toEqual(['A']);
        expect((await repos.tasks.listByStatus(username, 'pending')).map((t) => t.name)).toEqual(['B', 'C']);
      });

      it('deletes the task together with its subtasks', async () => {
        const task = await repos.tasks.create(username, newTask());
        await repos.subtasks.create(username, task.id, { name: 'Sub', description: '', priority: 'low', dueAt: at(16) });
        await repos.tasks.remove(username, task.id);
        expect(await repos.tasks.get(username, task.id)).toBeNull();
        expect(await repos.subtasks.list(username, task.id)).toEqual([]);
      });

      it('moving a task earlier moves later subtasks with it; earlier ones and later moves change nothing', async () => {
        const task = await repos.tasks.create(username, newTask({ dueAt: at(17) }));
        const sub = (name: string, hours: number) =>
          repos.subtasks.create(username, task.id, { name, description: '', priority: 'low', dueAt: at(hours) });
        await sub('Early', 14);
        await sub('Middle', 16);
        await sub('Last', 17);

        setNow(at(13));
        await repos.tasks.update(username, task.id, { dueAt: at(15) });
        // All three were created at the same instant, so their list order is not defined: compare by name.
        const byName = async () =>
          (await repos.subtasks.list(username, task.id)).sort((a, b) => a.name.localeCompare(b.name));
        const moved = await byName();
        expect(moved.map((s) => [s.name, s.dueAt])).toEqual([
          ['Early', at(14)],
          ['Last', at(15)],
          ['Middle', at(15)],
        ]);
        expect(moved[0].updatedAt).toEqual(CLOCK_START); // untouched
        expect(moved[2].updatedAt).toEqual(at(13));
        expect((await repos.tasks.get(username, task.id))?.dueAt).toEqual(at(15));

        await repos.tasks.update(username, task.id, { dueAt: at(20) }); // later: nothing moves
        expect((await byName()).map((s) => s.dueAt)).toEqual([at(14), at(15), at(15)]);
      });

      it('streams changes', async () => {
        const seen: string[][] = [];
        const unsubscribe = repos.tasks.subscribe(username, (items) => seen.push(items.map((t) => t.name)));
        await eventually(() => expect(seen.at(-1)).toEqual([]));
        await repos.tasks.create(username, newTask({ name: 'First' }));
        await eventually(() => expect(seen.at(-1)).toEqual(['First']));
        unsubscribe();
      });
    });

    describe('subtasks', () => {
      let taskId: string;
      const newSubtask = (overrides: Record<string, unknown> = {}) => ({
        name: 'Draft wireframe components',
        description: 'Prepare component hierarchy.',
        priority: 'medium' as const,
        dueAt: at(14),
        ...overrides,
      });

      beforeEach(async () => {
        taskId = (await repos.tasks.create(username, newTask())).id;
      });

      it('creates a pending subtask and updates the parent counters', async () => {
        const subtask = await repos.subtasks.create(username, taskId, newSubtask());
        expect(subtask).toMatchObject({ taskId, status: 'pending', createdAt: CLOCK_START });
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 1, subtaskDone: 0 });
      });

      it('counts a subtask created as done', async () => {
        const subtask = await repos.subtasks.create(username, taskId, newSubtask({ status: 'done' }));
        expect(subtask.completedAt).toEqual(CLOCK_START);
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 1, subtaskDone: 1 });
      });

      it('toggling done adjusts subtaskDone and completedAt both ways', async () => {
        const a = await repos.subtasks.create(username, taskId, newSubtask({ name: 'A' }));
        setNow(at(12, 1)); // B is created later than A, so the list order is defined
        await repos.subtasks.create(username, taskId, newSubtask({ name: 'B' }));
        setNow(at(13));
        await repos.subtasks.setStatus(username, taskId, a.id, 'done');
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 2, subtaskDone: 1 });
        expect((await repos.subtasks.list(username, taskId))[0]).toMatchObject({ status: 'done', completedAt: at(13) });

        await repos.subtasks.setStatus(username, taskId, a.id, 'done'); // already done: no double count
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskDone: 1 });

        await repos.subtasks.setStatus(username, taskId, a.id, 'pending');
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 2, subtaskDone: 0 });
        expect((await repos.subtasks.list(username, taskId))[0].completedAt).toBeUndefined();
      });

      it('removing a subtask adjusts the counters', async () => {
        const done = await repos.subtasks.create(username, taskId, newSubtask({ status: 'done' }));
        const open = await repos.subtasks.create(username, taskId, newSubtask({ name: 'Open' }));
        await repos.subtasks.remove(username, taskId, done.id);
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 1, subtaskDone: 0 });
        await repos.subtasks.remove(username, taskId, open.id);
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 0, subtaskDone: 0 });
      });

      it('lists oldest first and updates fields', async () => {
        const first = await repos.subtasks.create(username, taskId, newSubtask({ name: 'First' }));
        setNow(at(12, 5));
        await repos.subtasks.create(username, taskId, newSubtask({ name: 'Second' }));
        expect((await repos.subtasks.list(username, taskId)).map((s) => s.name)).toEqual(['First', 'Second']);
        await repos.subtasks.update(username, taskId, first.id, { name: 'Renamed', priority: 'urgent' });
        expect((await repos.subtasks.list(username, taskId))[0]).toMatchObject({ name: 'Renamed', priority: 'urgent' });
      });

      it('fails for a missing parent task and for bad input', async () => {
        await rejectsWith(repos.subtasks.create(username, 'missing', newSubtask()), 'not-found');
        await rejectsWith(repos.subtasks.create(username, taskId, newSubtask({ name: '' })), 'invalid');
      });

      it('may be due at the same time as its task or earlier, never later', async () => {
        // the parent task is due at 17:00
        await repos.subtasks.create(username, taskId, newSubtask({ name: 'Same time', dueAt: at(17) }));
        await repos.subtasks.create(username, taskId, newSubtask({ name: 'Earlier', dueAt: at(9) }));
        await rejectsWith(repos.subtasks.create(username, taskId, newSubtask({ dueAt: at(17, 1) })), 'invalid');
        expect(await repos.subtasks.list(username, taskId)).toHaveLength(2);
      });

      it('cannot be moved past the due time of its task', async () => {
        const sub = await repos.subtasks.create(username, taskId, newSubtask({ dueAt: at(12) }));
        await repos.subtasks.update(username, taskId, sub.id, { dueAt: at(17) });
        await rejectsWith(repos.subtasks.update(username, taskId, sub.id, { dueAt: at(18) }), 'invalid');
        expect((await repos.subtasks.list(username, taskId))[0].dueAt).toEqual(at(17));
        await repos.subtasks.update(username, taskId, sub.id, { name: 'Renamed' }); // other changes are unaffected
      });

      it('treats removing a missing subtask as a no-op and rejects updating one', async () => {
        await repos.subtasks.remove(username, taskId, 'missing');
        expect(await repos.tasks.get(username, taskId)).toMatchObject({ subtaskTotal: 0 });
        await rejectsWith(repos.subtasks.update(username, taskId, 'missing', { name: 'X' }), 'not-found');
      });

      it('streams changes', async () => {
        const seen: number[] = [];
        const unsubscribe = repos.subtasks.subscribe(username, taskId, (items) => seen.push(items.length));
        await eventually(() => expect(seen.at(-1)).toBe(0));
        await repos.subtasks.create(username, taskId, newSubtask());
        await eventually(() => expect(seen.at(-1)).toBe(1));
        unsubscribe();
      });
    });
  });
}
