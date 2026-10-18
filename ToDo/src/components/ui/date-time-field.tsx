import { useState } from 'react';

import type { DateTimeFieldProps } from '@/components/ui/date-time-field-props';
import { TextField } from '@/components/ui/text-field';
import { parseDateTimeInput, toDateTimeInputValue } from '@/utils/dates';

/**
 * Phone: typed entry as "YYYY-MM-DD HH:mm". A native picker is not part of the web-first scope; the web build
 * uses the browser picker (`date-time-field.web.tsx`).
 */
export function DateTimeField({ label, accessibilityLabel, value, onChange, error, clearable }: DateTimeFieldProps) {
  const [text, setText] = useState(value ? toDateTimeInputValue(value).replace('T', ' ') : '');
  const [typedError, setTypedError] = useState<string>();

  const handleChange = (next: string) => {
    setText(next);
    if (clearable && next.trim() === '') {
      setTypedError(undefined);
      onChange(undefined);
      return;
    }
    const parsed = parseDateTimeInput(next);
    setTypedError(parsed ? undefined : 'Use the format 2026-10-24 17:00.');
    onChange(parsed);
  };

  return (
    <TextField
      label={label}
      accessibilityLabel={accessibilityLabel}
      value={text}
      onChangeText={handleChange}
      placeholder="YYYY-MM-DD HH:mm"
      icon="calendarMonth"
      error={typedError ?? error}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}
