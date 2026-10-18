import { Segmented, type SegmentedOption } from '@/components/ui/segmented';
import { STATUSES } from '@/constants/statuses';
import type { DisplayStatusKey, StatusKey } from '@/domain/types';

type StatusPickerProps = {
  value: StatusKey;
  onChange: (value: StatusKey) => void;
  /** The deadline passed and the task is not done. Overdue is shown but cannot be chosen. */
  overdue?: boolean;
};

const OPTIONS: { value: DisplayStatusKey; icon: SegmentedOption<DisplayStatusKey>['icon'] }[] = [
  { value: 'in_process', icon: 'inProcess' },
  { value: 'overdue', icon: 'overdue' },
  { value: 'done', icon: 'checkCircle' },
  { value: 'pending', icon: 'pending' },
];

/** The "Lifecycle state" selector. Only pending, in process and done are stored; overdue is derived. */
export function StatusPicker({ value, onChange, overdue = false }: StatusPickerProps) {
  const options: SegmentedOption<DisplayStatusKey>[] = OPTIONS.map(({ value: key, icon }) => ({
    value: key,
    label: STATUSES[key].name,
    icon,
    disabled: key === 'overdue',
    background: STATUSES[key].background,
    foreground: STATUSES[key].foreground,
  }));

  return (
    <Segmented<DisplayStatusKey>
      label="Lifecycle state"
      options={options}
      value={overdue ? 'overdue' : value}
      onChange={(next) => {
        if (next !== 'overdue') onChange(next);
      }}
    />
  );
}
