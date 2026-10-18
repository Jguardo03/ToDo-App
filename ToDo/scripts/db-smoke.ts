/**
 * Smoke test against the REAL Firebase project configured in .env.local.
 * Run with: npm run db:smoke
 *
 * It creates a throw-away user ("smoke_...") with one category, task and subtask, checks the behaviour the
 * app relies on, then deletes everything it created. Exits with code 1 on the first failure.
 */

import { createRepositories, isRepositoryError } from '@/repositories';
import { getDb } from '@/services/firebase/client';
import { deleteDoc } from 'firebase/firestore';
import { userRef } from '@/repositories/firestore/paths';

const repos = createRepositories();
const username = `smoke_${Date.now().toString(36)}`.slice(0, 20);
let step = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  step += 1;
  if (!condition) {
    console.error(`FAIL ${step}. ${label}`, detail ?? '');
    throw new Error(`Smoke check failed: ${label}`);
  }
  console.log(`ok   ${step}. ${label}`);
}

async function main() {
  const at = (hours: number) => {
    const d = new Date();
    d.setHours(hours, 0, 0, 0);
    return d;
  };

  const user = await repos.users.create(username);
  check('user created', user.username === username);
  check('user exists', await repos.users.exists(username));

  try {
    await repos.users.create(username);
    check('taken username is rejected', false);
  } catch (error) {
    check('taken username is rejected', isRepositoryError(error) && error.code === 'already-exists', error);
  }

  const category = await repos.categories.create(username, { name: 'Smoke', description: 'test', color: '#b7004f' });
  check('category created', (await repos.categories.list(username)).length === 1);

  const task = await repos.tasks.create(username, {
    categoryId: category.id,
    name: 'Smoke task',
    description: 'created by db:smoke',
    priority: 'high',
    dueAt: at(17),
    startAt: at(16),
  });
  check('task created and read back', (await repos.tasks.get(username, task.id))?.name === 'Smoke task');
  check('task appears in listByDay(today)', (await repos.tasks.listByDay(username, new Date())).some((t) => t.id === task.id));
  check('task appears in listByCategory', (await repos.tasks.listByCategory(username, category.id)).length === 1);

  const subtask = await repos.subtasks.create(username, task.id, {
    name: 'Smoke subtask',
    description: '',
    priority: 'medium',
    dueAt: at(16),
  });
  check('subtask create updates parent total', (await repos.tasks.get(username, task.id))?.subtaskTotal === 1);

  await repos.subtasks.setStatus(username, task.id, subtask.id, 'done');
  const afterDone = await repos.tasks.get(username, task.id);
  check('subtask done updates parent counters', afterDone?.subtaskDone === 1 && afterDone.subtaskTotal === 1, afterDone);
  check('subtask has completedAt', (await repos.subtasks.list(username, task.id))[0]?.completedAt instanceof Date);

  await repos.tasks.setStatus(username, task.id, 'done');
  check('task done sets completedAt', (await repos.tasks.get(username, task.id))?.completedAt instanceof Date);

  try {
    await repos.categories.remove(username, category.id);
    check('category in use cannot be removed', false);
  } catch (error) {
    check('category in use cannot be removed', isRepositoryError(error) && error.code === 'category-in-use', error);
  }

  await repos.tasks.remove(username, task.id);
  check('task and its subtasks removed', (await repos.subtasks.list(username, task.id)).length === 0);
  await repos.categories.remove(username, category.id);
  check('empty category removed', (await repos.categories.list(username)).length === 0);
}

main()
  .then(() => console.log(`\nAll ${step} checks passed.`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await deleteDoc(userRef(getDb(), username));
      console.log(`cleaned up ${username}`);
    } catch (error) {
      console.error(`Could not delete ${username}; remove it in the Firebase console.`, error);
    }
    process.exit(process.exitCode ?? 0);
  });
