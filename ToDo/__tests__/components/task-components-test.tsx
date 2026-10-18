import { fireEvent, render, screen } from '@testing-library/react-native';

import { makeTask, NOW } from '../../config/jest/factories';

import { CategoryCard } from '@/components/category/category-card';
import { CategoryChip } from '@/components/category/category-chip';
import { CategoryPicker } from '@/components/category/category-picker';
import { PriorityChip } from '@/components/task/priority-chip';
import { PriorityPicker } from '@/components/task/priority-picker';
import { StatusChip } from '@/components/task/status-chip';
import { StatusPicker } from '@/components/task/status-picker';
import { SubtaskRow } from '@/components/task/subtask-row';
import { TaskCard } from '@/components/task/task-card';
import type { Subtask } from '@/domain/types';

const category = { name: 'Design', color: '#b7004f' };
// NOW is 2026-10-18 12:00 (local)
const at = (hours: number, minutes = 0, dayOffset = 0) => new Date(2026, 9, 18 + dayOffset, hours, minutes);

describe('TaskCard (row, Home)', () => {
  it('shows title, category, due time and the progress ring', () => {
    const task = makeTask({ name: 'Finalize Homepage Wireframes', dueAt: at(14), status: 'in_process', subtaskTotal: 5, subtaskDone: 2 });
    render(<TaskCard task={task} category={category} now={NOW} />);
    expect(screen.getByText('Finalize Homepage Wireframes')).toBeOnTheScreen();
    expect(screen.getByText('Design')).toBeOnTheScreen();
    expect(screen.getByText('Due 2:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('40%')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 40 });
  });

  it('has no checkbox unless it can toggle', () => {
    render(<TaskCard task={makeTask()} now={NOW} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('toggles done from the checkbox without opening the task', () => {
    const onToggleDone = jest.fn();
    const onPress = jest.fn();
    render(<TaskCard task={makeTask({ name: 'Ship it' })} now={NOW} onToggleDone={onToggleDone} onPress={onPress} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Ship it done' }));
    expect(onToggleDone).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a done task as checked, struck through and 100%', () => {
    const onToggleDone = jest.fn();
    render(<TaskCard task={makeTask({ name: 'Ship it', status: 'done', subtaskTotal: 4, subtaskDone: 1 })} now={NOW} onToggleDone={onToggleDone} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Mark Ship it not done' });
    expect(checkbox).toBeChecked();
    expect(screen.getByText('100%')).toBeOnTheScreen();
    fireEvent.press(checkbox);
    expect(onToggleDone).toHaveBeenCalledWith(false);
  });

  it('opens the task when the card is pressed, and describes itself to screen readers', () => {
    const onPress = jest.fn();
    render(<TaskCard task={makeTask({ name: 'Ship it', dueAt: at(14) })} now={NOW} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Ship it, Due 2:00 PM, 0% complete' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('says when a task is overdue', () => {
    render(<TaskCard task={makeTask({ name: 'Late', dueAt: at(9), status: 'in_process' })} now={NOW} onPress={() => {}} />);
    expect(screen.getByRole('button', { name: /Late, Due 9:00 AM, overdue/ })).toBeOnTheScreen();
  });
});

describe('TaskCard variants', () => {
  it('category variant: priority chip, due, title and a progress bar with percent', () => {
    const task = makeTask({ name: 'API Schema Review', priority: 'urgent', dueAt: at(15, 30), subtaskTotal: 4, subtaskDone: 3 });
    render(<TaskCard task={task} now={NOW} variant="category" />);
    expect(screen.getByText('Urgent')).toBeOnTheScreen();
    expect(screen.getByText('API Schema Review')).toBeOnTheScreen();
    expect(screen.getByText('75%')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'API Schema Review progress' })).toBeOnTheScreen();
  });

  it('status variant: category and priority chips with the percent', () => {
    const task = makeTask({ name: 'User Testing', priority: 'medium', subtaskTotal: 2, subtaskDone: 1 });
    render(<TaskCard task={task} category={category} now={NOW} variant="status" />);
    expect(screen.getByText('Design')).toBeOnTheScreen();
    expect(screen.getByText('Medium')).toBeOnTheScreen();
    expect(screen.getByText('• 50%')).toBeOnTheScreen();
  });
});

describe('SubtaskRow', () => {
  const subtask = (overrides: Partial<Subtask> = {}): Subtask => ({
    id: 's1',
    taskId: 't1',
    name: 'Draft wireframe components',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueAt: at(17),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

  it('shows when a pending subtask is due', () => {
    render(<SubtaskRow subtask={subtask({ dueAt: at(10, 0, 1) })} now={NOW} onToggle={() => {}} />);
    expect(screen.getByText('Tomorrow • 10:00 AM')).toBeOnTheScreen();
  });

  it('shows the completion time of a done subtask', () => {
    render(<SubtaskRow subtask={subtask({ status: 'done', completedAt: at(10, 30) })} now={NOW} onToggle={() => {}} />);
    expect(screen.getByText('Completed 10:30 AM')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles', () => {
    const onToggle = jest.fn();
    render(<SubtaskRow subtask={subtask()} now={NOW} onToggle={onToggle} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Draft wireframe components done' }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});

describe('badges', () => {
  it('PriorityChip and StatusChip show the display names', () => {
    render(
      <>
        <PriorityChip priority="urgent" />
        <StatusChip status="in_process" />
        <StatusChip status="overdue" />
        <CategoryChip name="Design" color="#b7004f" />
      </>,
    );
    expect(screen.getByText('Urgent')).toBeOnTheScreen();
    expect(screen.getByText('In Process')).toBeOnTheScreen();
    expect(screen.getByText('Overdue')).toBeOnTheScreen();
    expect(screen.getByText('Design')).toBeOnTheScreen();
  });
});

describe('PriorityPicker', () => {
  it('shows four levels with the current one selected, and changes', () => {
    const onChange = jest.fn();
    render(<PriorityPicker value="high" onChange={onChange} />);
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Low', 'Medium', 'High', 'Urgent']);
    expect(screen.getByRole('button', { name: 'High' })).toBeSelected();
    fireEvent.press(screen.getByRole('button', { name: 'Urgent' }));
    expect(onChange).toHaveBeenCalledWith('urgent');
  });
});

describe('StatusPicker', () => {
  it('changes between the stored statuses', () => {
    const onChange = jest.fn();
    render(<StatusPicker value="in_process" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'In Process' })).toBeSelected();
    fireEvent.press(screen.getByRole('radio', { name: 'Done' }));
    expect(onChange).toHaveBeenCalledWith('done');
  });

  it('shows overdue as selected but never offers it as a choice', () => {
    const onChange = jest.fn();
    render(<StatusPicker value="pending" onChange={onChange} overdue />);
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeDisabled();
    fireEvent.press(screen.getByRole('radio', { name: 'Pending' }));
    expect(onChange).toHaveBeenCalledWith('pending');
  });
});

describe('CategoryPicker', () => {
  const categories = [
    { id: 'a', name: 'Design', color: '#b7004f' },
    { id: 'b', name: 'Development', color: '#00696b' },
  ];

  it('selects exactly one category and reports changes', () => {
    const onChange = jest.fn();
    render(<CategoryPicker categories={categories} value="a" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Design' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Development' })).not.toBeSelected();
    fireEvent.press(screen.getByRole('button', { name: 'Development' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('offers "New" only when it can create', () => {
    const onCreate = jest.fn();
    const { rerender } = render(<CategoryPicker categories={categories} value="a" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'New' })).toBeNull();
    rerender(<CategoryPicker categories={categories} value="a" onChange={() => {}} onCreate={onCreate} />);
    fireEvent.press(screen.getByRole('button', { name: 'New' }));
    expect(onCreate).toHaveBeenCalled();
  });
});

describe('CategoryCard', () => {
  it('shows the name and a singular or plural task count', () => {
    const { rerender } = render(<CategoryCard category={category} taskCount={8} />);
    expect(screen.getByText('8 Tasks')).toBeOnTheScreen();
    rerender(<CategoryCard category={category} taskCount={1} />);
    expect(screen.getByText('1 Task')).toBeOnTheScreen();
  });

  it('opens when pressed and names itself with its count', () => {
    const onPress = jest.fn();
    render(<CategoryCard category={category} taskCount={2} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Design, 2 Tasks' }));
    expect(onPress).toHaveBeenCalled();
  });
});
