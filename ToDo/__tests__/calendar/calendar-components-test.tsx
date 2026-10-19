import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { makeTask } from '../../config/jest/factories';

import { CalendarContent } from '@/components/calendar/calendar-content';
import { CategoryFilter } from '@/components/calendar/category-filter';
import { MiniMonth } from '@/components/calendar/mini-month';
import { TimeBlock } from '@/components/calendar/time-block';
import { WeekStrip } from '@/components/calendar/week-strip';
import type { Category, Task } from '@/domain/types';
import { weekDays } from '@/utils/dates';

// Sunday 18 Oct 2026, ISO week 42.
const now = new Date(2026, 9, 18, 12, 0);
const today = new Date(2026, 9, 18);
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);
const stamp = new Date(2026, 9, 1);

const design: Category = { id: 'design', name: 'Design', description: '', color: '#b7004f', createdAt: stamp, updatedAt: stamp };
const dev: Category = { id: 'dev', name: 'Development', description: '', color: '#00696b', createdAt: stamp, updatedAt: stamp };
const categories = [design, dev];

const tasks: Task[] = [
  makeTask({
    id: 'a',
    categoryId: 'design',
    name: 'Optimize server response time',
    description: 'Shard **Redis** cache partitions',
    priority: 'high',
    startAt: at(18, 9),
    dueAt: at(18, 10, 15),
    subtaskTotal: 3,
    subtaskDone: 1,
  }),
  makeTask({ id: 'b', categoryId: 'dev', name: 'Team Meeting', priority: 'medium', dueAt: at(18, 23, 30) }),
  makeTask({ id: 'c', categoryId: 'design', name: 'Tomorrow task', dueAt: at(19, 9) }),
];

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('WeekStrip', () => {
  const days = weekDays(today);
  const props = { days, selected: today, today, markedDays: new Set(['2026-10-14']), onSelect: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('shows the seven days Monday first, with the selected one marked', () => {
    render(<WeekStrip {...props} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Monday, Oct 12' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Sunday, Oct 18, today' })).toBeSelected();
  });

  it('says which days have tasks and selects a day when pressed', () => {
    render(<WeekStrip {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'Wednesday, Oct 14, has tasks' }));
    expect(props.onSelect).toHaveBeenCalledWith(days[2]);
  });
});

describe('MiniMonth', () => {
  const props = { month: today, selected: today, today, markedDays: new Set(['2026-10-20']), onSelect: jest.fn(), onMonthChange: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('shows the month, its days and the neighbouring days of the first and last weeks', () => {
    render(<MiniMonth {...props} />);
    expect(screen.getByRole('header', { name: 'October 2026' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Monday, Sep 28' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sunday, Nov 1' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sunday, Oct 18' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Tuesday, Oct 20, has tasks' })).toBeOnTheScreen();
  });

  it('selects a day and asks for the previous or next month', () => {
    render(<MiniMonth {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'Tuesday, Oct 20, has tasks' }));
    expect(props.onSelect).toHaveBeenCalledWith(new Date(2026, 9, 20));
    fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(props.onMonthChange.mock.calls).toEqual([[-1], [1]]);
  });
});

describe('CategoryFilter', () => {
  const props = { categories, counts: new Map([['design', 2]]), hidden: new Set<string>(), onToggle: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('lists each category with its count and how many are active', () => {
    render(<CategoryFilter {...props} hidden={new Set(['dev'])} />);
    expect(screen.getByText('1 active')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Design, 2 tasks' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Development, 0 tasks' })).not.toBeChecked();
  });

  it('toggles a category', () => {
    render(<CategoryFilter {...props} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Development, 0 tasks' }));
    expect(props.onToggle).toHaveBeenCalledWith('dev');
  });
});

describe('TimeBlock', () => {
  it('shows category, priority, title, description, time range and subtask progress', () => {
    render(<TimeBlock task={tasks[0]} category={design} now={now} onPress={jest.fn()} />);
    expect(screen.getByText('Design')).toBeOnTheScreen();
    expect(screen.getByText('High')).toBeOnTheScreen();
    expect(screen.getByText('Optimize server response time')).toBeOnTheScreen();
    expect(screen.getByText('Shard Redis cache partitions')).toBeOnTheScreen();
    expect(screen.getByText('9:00 AM - 10:15 AM')).toBeOnTheScreen();
    expect(screen.getByText('3 subtasks')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 33 });
  });

  it('shows only the due time when there is no start, and no bar without subtasks', () => {
    render(<TimeBlock task={tasks[1]} category={dev} now={now} onPress={jest.fn()} />);
    expect(screen.getByText('11:30 PM')).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/subtask/)).toBeNull();
  });

  it('marks overdue and done tasks in its label, and offers "Add new subtask…" only when given', () => {
    const overdue = makeTask({ name: 'Late', dueAt: at(18, 9) });
    const { rerender } = render(<TimeBlock task={overdue} now={now} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Late, 9:00 AM, overdue' })).toBeOnTheScreen();
    expect(screen.queryByText('Add new subtask…')).toBeNull();

    const onAddSubtask = jest.fn();
    rerender(<TimeBlock task={{ ...overdue, status: 'done' }} now={now} onPress={jest.fn()} onAddSubtask={onAddSubtask} />);
    expect(screen.getByRole('button', { name: 'Late, 9:00 AM, done' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Add subtask to Late' }));
    expect(onAddSubtask).toHaveBeenCalled();
  });

  it('presses through to the task', () => {
    const onPress = jest.fn();
    render(<TimeBlock task={tasks[1]} now={now} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Team Meeting, 11:30 PM' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('CalendarContent on a phone', () => {
  const props = {
    now,
    tasks,
    categories,
    onOpenTask: jest.fn(),
    onAddSubtask: jest.fn(),
    onAddTask: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    setWindowWidth(390);
  });

  it('opens on today with its week number, week strip and only today’s tasks, in time order', () => {
    render(<CalendarContent {...props} />);
    expect(screen.getByRole('header', { name: 'Sunday, Oct 18' })).toBeOnTheScreen();
    expect(screen.getByText('Week 42')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    const blocks = screen.getAllByRole('button', { name: /AM|PM/ }).filter((b) => /^(Optimize|Team)/.test(b.props.accessibilityLabel ?? ''));
    expect(blocks.map((b) => b.props.accessibilityLabel)).toEqual([
      'Optimize server response time, 9:00 AM - 10:15 AM, overdue',
      'Team Meeting, 11:30 PM',
    ]);
    expect(screen.queryByText('Tomorrow task')).toBeNull();
  });

  it('a 23:30 task shows on its own day, and the next day shows the next task', () => {
    render(<CalendarContent {...props} />);
    expect(screen.getByText('Team Meeting')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: /^Monday, Oct 12/ }));
    expect(screen.queryByText('Team Meeting')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByRole('header', { name: 'Monday, Oct 19' })).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow task')).toBeOnTheScreen();
    expect(screen.queryByText('Team Meeting')).toBeNull();
  });

  it('moves a week at a time and comes back to today with the Today button', () => {
    render(<CalendarContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByRole('header', { name: 'Sunday, Oct 25' })).toBeOnTheScreen();
    expect(screen.getByText('Week 43')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Previous week' }));
    fireEvent.press(screen.getByRole('button', { name: 'Previous week' }));
    expect(screen.getByRole('header', { name: 'Sunday, Oct 11' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('header', { name: 'Sunday, Oct 18' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('dots the days that have tasks', () => {
    render(<CalendarContent {...props} />);
    expect(screen.getByRole('button', { name: 'Sunday, Oct 18, today, has tasks' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Monday, Oct 12, has tasks/ })).toBeNull();
  });

  it('opens a task from its block', () => {
    render(<CalendarContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'Team Meeting, 11:30 PM' }));
    expect(props.onOpenTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('has no desktop-only parts: Fast Book, month picker, category filter, add-subtask rows', () => {
    render(<CalendarContent {...props} />);
    expect(screen.queryByRole('button', { name: 'Fast Book' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'October 2026' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'Filter Category' })).toBeNull();
    expect(screen.queryByText('Add new subtask…')).toBeNull();
  });

  it('shows the empty state for a day with nothing, and schedules a task on that day', () => {
    render(<CalendarContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: /^Wednesday, Oct 14/ }));
    expect(screen.getByRole('header', { name: 'Nothing on the Agenda' })).toBeOnTheScreen();
    expect(screen.getByText(/Your schedule for Wednesday, Oct 14 is wide open/)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Schedule a Task' }));
    expect(props.onAddTask).toHaveBeenCalledWith(new Date(2026, 9, 14));
  });

  it('shows a spinner while loading and a message when loading failed', () => {
    const { rerender } = render(<CalendarContent {...props} tasks={[]} loading />);
    expect(screen.getByLabelText('Loading tasks')).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Nothing on the Agenda' })).toBeNull();
    rerender(<CalendarContent {...props} tasks={[]} error="Could not load." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not load\./);
  });
});

describe('CalendarContent on desktop', () => {
  const props = {
    now,
    tasks,
    categories,
    onOpenTask: jest.fn(),
    onAddSubtask: jest.fn(),
    onAddTask: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    setWindowWidth(1280);
  });

  it('adds the month picker, the category filter with the day’s counts, and Fast Book', () => {
    render(<CalendarContent {...props} />);
    expect(screen.getByRole('header', { name: 'October 2026' })).toBeOnTheScreen();
    expect(screen.getByText('2 active')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Design, 1 task' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Development, 1 task' })).toBeChecked();
    fireEvent.press(screen.getByRole('button', { name: 'Fast Book' }));
    expect(props.onAddTask).toHaveBeenCalledWith(new Date(2026, 9, 18));
  });

  it('the category filter hides and shows that category’s tasks, and says so when none are left', () => {
    render(<CalendarContent {...props} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Design, 1 task' }));
    expect(screen.getByText('1 active')).toBeOnTheScreen();
    expect(screen.queryByText('Optimize server response time')).toBeNull();
    expect(screen.getByText('Team Meeting')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Development, 1 task' }));
    expect(screen.getByText('No tasks match the category filter.')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Design, 1 task' }));
    expect(screen.getByText('Optimize server response time')).toBeOnTheScreen();
  });

  it('picking a day in the month picker moves the timeline, and its arrows change only the month shown', () => {
    render(<CalendarContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: /^Monday, Oct 19/ }));
    expect(screen.getByRole('header', { name: 'Monday, Oct 19' })).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow task')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('header', { name: 'November 2026' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Monday, Oct 19' })).toBeOnTheScreen();
  });

  it('offers "Add new subtask…" in each block', () => {
    render(<CalendarContent {...props} />);
    expect(screen.getAllByText('Add new subtask…')).toHaveLength(2);
    fireEvent.press(screen.getByRole('button', { name: 'Add subtask to Team Meeting' }));
    expect(props.onAddSubtask).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('keeps the empty state and its button on desktop', () => {
    render(<CalendarContent {...props} tasks={[]} />);
    expect(screen.getByRole('header', { name: 'Nothing on the Agenda' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Schedule a Task' }));
    expect(props.onAddTask).toHaveBeenCalledWith(new Date(2026, 9, 18));
  });
});
