/**
 * Deletes the given users and everything under them (tasks, subtasks, categories) from the project in .env.local.
 * Usage: npm run db:cleanup -- <username> [<username> ...]
 *
 * Use it for leftovers of an interrupted test run. Usernames cannot be listed (the rules forbid it), so they
 * must be named. There is no confirmation step and no undo.
 */

import { deleteDoc } from 'firebase/firestore';

import { createRepositories } from '@/repositories';
import { userRef } from '@/repositories/firestore/paths';
import { getDb } from '@/services/firebase/client';

async function main(usernames: string[]) {
  if (usernames.length === 0) {
    throw new Error('Usage: npm run db:cleanup -- <username> [<username> ...]');
  }
  const repos = createRepositories();
  for (const username of usernames) {
    const tasks = await repos.tasks.list(username);
    for (const task of tasks) await repos.tasks.remove(username, task.id);
    const categories = await repos.categories.list(username);
    for (const category of categories) await repos.categories.remove(username, category.id);
    await deleteDoc(userRef(getDb(), username));
    console.log(`deleted ${username} (${tasks.length} tasks, ${categories.length} categories)`);
  }
}

main(process.argv.slice(2))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
