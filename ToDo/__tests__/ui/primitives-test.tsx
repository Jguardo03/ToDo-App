import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Segmented } from '@/components/ui/segmented';
import { TextArea, TextField } from '@/components/ui/text-field';

describe('Button', () => {
  it('calls onPress', () => {
    const onPress = jest.fn();
    render(<Button label="Create Task" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Create Task' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled or loading, and says so to screen readers', () => {
    const onPress = jest.fn();
    render(
      <>
        <Button label="Disabled" disabled onPress={onPress} />
        <Button label="Saving" loading onPress={onPress} />
      </>,
    );
    // A disabled button has no press handler to fire, so the test checks the state screen readers and touch see.
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving' })).toBeBusy();
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('is named by its label and presses', () => {
    const onPress = jest.fn();
    render(<IconButton icon="settings" label="Settings" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Checkbox', () => {
  it('reports the next value and exposes its checked state', () => {
    const onChange = jest.fn();
    const { rerender } = render(<Checkbox checked={false} onChange={onChange} label="Mark A done" />);
    expect(screen.getByRole('checkbox', { name: 'Mark A done' })).not.toBeChecked();
    fireEvent.press(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<Checkbox checked onChange={onChange} label="Mark A done" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
    fireEvent.press(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});

describe('Chip', () => {
  it('is plain text when it has no onPress', () => {
    render(<Chip label="High" />);
    expect(screen.getByText('High')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a selectable button when pressable', () => {
    const onPress = jest.fn();
    render(<Chip label="Design" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Design' });
    expect(chip).toBeSelected();
    fireEvent.press(chip);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('progress', () => {
  it('ProgressBar exposes a clamped percent', () => {
    const { rerender } = render(<ProgressBar value={0.6} label="Task progress" />);
    expect(screen.getByRole('progressbar', { name: 'Task progress' })).toHaveProp('accessibilityValue', {
      min: 0,
      max: 100,
      now: 60,
    });
    rerender(<ProgressBar value={4} label="Task progress" />);
    expect(screen.getByRole('progressbar')).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 100 });
    rerender(<ProgressBar value={-1} label="Task progress" />);
    expect(screen.getByRole('progressbar')).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 0 });
  });

  it('ProgressRing shows the rounded percent', () => {
    render(<ProgressRing value={0.4} label="Wireframes progress" />);
    expect(screen.getByText('40%')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'Wireframes progress' })).toBeOnTheScreen();
  });
});

describe('Segmented', () => {
  const options = [
    { value: 'a', label: 'In Process' },
    { value: 'b', label: 'Overdue', disabled: true },
    { value: 'c', label: 'Done' },
  ] as const;

  it('selects an option and ignores disabled ones', () => {
    const onChange = jest.fn();
    render(<Segmented label="Lifecycle state" options={options} value="a" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'In Process' })).toBeSelected();
    fireEvent.press(screen.getByRole('radio', { name: 'Done' }));
    expect(onChange).toHaveBeenCalledWith('c');
    fireEvent.press(screen.getByRole('radio', { name: 'Overdue' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('TextField and TextArea', () => {
  it('TextField is named by its label and reports typing', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Task Name" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Task Name'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('shows an error as an alert', () => {
    render(<TextField label="Task Name" value="" onChangeText={() => {}} error="Enter a name." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
  });

  it('TextArea shows its hint', () => {
    render(<TextArea label="Description" value="" onChangeText={() => {}} hint="Markdown ok" />);
    expect(screen.getByText('Markdown ok')).toBeOnTheScreen();
  });
});

describe('Card', () => {
  it('is a button only when it has onPress', () => {
    const onPress = jest.fn();
    const { rerender } = render(
      <Card>
        <Text>Plain</Text>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <Card onPress={onPress} accessibilityLabel="Open task">
        <Text>Plain</Text>
      </Card>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Open task' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('shows the message and its action', () => {
    render(
      <EmptyState icon="done" title="Clear Skies Ahead!" message="You are caught up.">
        <Button label="Add First Task" />
      </EmptyState>,
    );
    expect(screen.getByRole('header', { name: 'Clear Skies Ahead!' })).toBeOnTheScreen();
    expect(screen.getByText('You are caught up.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add First Task' })).toBeOnTheScreen();
  });
});

describe('BottomSheet', () => {
  it('shows its content when visible and closes from the close button', () => {
    const onClose = jest.fn();
    render(
      <BottomSheet visible onClose={onClose} title="New category">
        <Text>Inside</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Inside')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'New category' })).toBeOnTheScreen();
    fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when hidden', () => {
    render(
      <BottomSheet visible={false} onClose={() => {}} title="Hidden">
        <Text>Inside</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Inside')).toBeNull();
  });
});
