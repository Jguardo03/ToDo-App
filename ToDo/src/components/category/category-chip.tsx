import { Chip } from '@/components/ui/chip';
import type { IconName } from '@/components/ui/icon';
import { withAlpha } from '@/utils/colors';

type CategoryChipProps = {
  name: string;
  /** The category's own `#rrggbb` colour. */
  color: string;
  icon?: IconName;
};

/** Read-only category badge tinted with the category's colour. */
export function CategoryChip({ name, color, icon }: CategoryChipProps) {
  return <Chip label={name} background={withAlpha(color, 0.14)} foreground={color} dot={color} icon={icon} />;
}
