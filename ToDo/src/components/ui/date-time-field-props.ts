export type DateTimeFieldProps = {
  label?: string;
  /** Used as the accessible name when there is no visible `label`. */
  accessibilityLabel?: string;
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  error?: string;
  /** Allow clearing the value (optional dates such as a start time). */
  clearable?: boolean;
};
