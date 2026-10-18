import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { STATUSES } from '@/constants/statuses';
import type { DisplayStatusKey } from '@/domain/types';

/** Placeholder: the real list of tasks in this state is built in Phase 8. It exists so the Home stat cards have somewhere to go. */
export default function StatusScreen() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const info = STATUSES[status as DisplayStatusKey];

  if (!info) return <Screen title="Not found" subtitle="There is no such status." />;
  return <Screen title={info.name} subtitle={`${info.description} The task list arrives in Phase 8.`} />;
}
