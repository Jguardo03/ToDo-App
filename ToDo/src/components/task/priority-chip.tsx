import { Chip } from '@/components/ui/chip';
import { PRIORITIES } from '@/constants/priorities';
import type { PriorityKey } from '@/domain/types';

/** Read-only priority badge ("High", "Urgent") in the colours from the mockups. */
export function PriorityChip({ priority }: { priority: PriorityKey }) {
  const info = PRIORITIES[priority];
  return <Chip label={info.name} background={info.background} foreground={info.foreground} />;
}
