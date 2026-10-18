import { Chip } from '@/components/ui/chip';
import { STATUSES } from '@/constants/statuses';
import type { DisplayStatusKey } from '@/domain/types';

/** Read-only status badge. Pass the displayed status (so it can be `overdue`). */
export function StatusChip({ status }: { status: DisplayStatusKey }) {
  const info = STATUSES[status];
  return <Chip label={info.name} background={info.background} foreground={info.foreground} />;
}
