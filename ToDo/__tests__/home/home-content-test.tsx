import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { makeTask } from '../../config/jest/factories';

import { HomeContent } from '@/components/home/home-content';
import { ScheduleList } from '@/components/home/schedule-list';
import { StatCard } from '@/components/home/stat-card';
import { ErrorBanner } from '@/components/ui/error-banner';
import type { Category, Task } from '@/domain/types';

// Sunday, Oct 18 2026, 12:00 local
const now = new Date(2026, 9, 18, 12, 0);
const at = (hours: number, minutes = 0, dayOffset = 0) => new Date(2026, 9, 18 + dayOffset, hours, minutes);

const stamp = new Date(2026, 9, 1);
const categories: Category[] = [
  { id: 'design', name: 'Design', description: '', color: '#b7004f', createdAt: stamp, updatedAt: stamp },
  { id: 'dev', name: 'Development', description: '', color: '#00696b', createdAt: stamp, updatedAt: stamp },
];

const tasks: Task[] = [
  makeTask({ id: 'a', name: 'Finalize Wireframes', categoryId: 'design', priority: 'high', status: 'in_process', dueAt: at(14), startAt: at(11), subtaskTotal: 5, subtaskDone: 2 }),
  makeTask({ id: 'b', name: 'API Schema Review', categoryId: 'dev', priority: 'urgent', status: 'pending', dueAt: at(16) }),
  makeTask({ id: 'c', name: 'Old Report', categoryId: 'design', priority: 'low', status: 'pending', dueAt: at(9, 0, -1) }),
  makeTask({ id: 'd', name: 'Ship Release', categoryId: 'dev', priority: 'medium', status: 'done', dueAt: at(10) }),
  makeTask({ id: 'e', name: 'Plan Next Week', categoryId: 'design', priority: 'low', status: 'pending', dueAt: at(9, 0, 3) }),
];

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

const props = {
  now,
  tasks,
  categories,
  onToggleDone: jest.fn(),
  onQuickAdd: jest.fn(),
  onAddTask: jest.fn(),
  onBrowseCategories: jest.fn(),
  onOpenStatus: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe('HomeContent (phone)', () => {
  beforeEach(() => setWindowWidth(390));

  it('greets with the date and the number of tasks still to do today', () => {
    render(<HomeContent {...props} />);
    expect(screen.getByRole('header', { name: "Today's Focus" })).toBeOnTheScreen();
    // today: a (in process), b (pending), d (done) -> 2 remaining
    expect(screen.getByText('Sunday, Oct 18 • 2 tasks remaining')).toBeOnTheScreen();
    expect(screen.getByText('2 remaining')).toBeOnTheScreen();
  });

  it('shows the four counts by displayed status and opens a status when pressed', () => {
    render(<HomeContent {...props} />);
    expect(screen.getByRole('button', { name: 'Overdue: 1 Tasks' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'In Process: 1 Active' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Completed: 1 Done' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pending: 2 Queued' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Overdue: 1 Tasks' }));
    expect(props.onOpenStatus).toHaveBeenCalledWith('overdue');
  });

  it("lists today's tasks only, soonest first, with their category", () => {
    render(<HomeContent {...props} />);
    expect(screen.getByRole('header', { name: 'Due Today' })).toBeOnTheScreen();
    expect(screen.getByText('3 Tasks')).toBeOnTheScreen();
    for (const name of ['Finalize Wireframes', 'API Schema Review', 'Ship Release']) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
    expect(screen.queryByText('Old Report')).toBeNull();
    expect(screen.queryByText('Plan Next Week')).toBeNull();
  });

  it('ticking a task reports the new state, and unticking a done one too', () => {
    render(<HomeContent {...props} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark API Schema Review done' }));
    expect(props.onToggleDone).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'b' }), true);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Ship Release not done' }));
    expect(props.onToggleDone).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'd' }), false);
  });

  it('shows the clear-skies state with actions when nothing is due today', () => {
    render(<HomeContent {...props} tasks={[tasks[2], tasks[4]]} />);
    expect(screen.getByRole('header', { name: 'Clear Skies Ahead!' })).toBeOnTheScreen();
    expect(screen.getByText('Sunday, Oct 18 • All caught up!')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Add First Task' }));
    expect(props.onAddTask).toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Or browse categories to organize projects' }));
    expect(props.onBrowseCategories).toHaveBeenCalled();
  });

  it('shows a spinner while loading and an error message when loading failed', () => {
    const { rerender } = render(<HomeContent {...props} tasks={[]} loading />);
    expect(screen.getByLabelText('Loading tasks')).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Clear Skies Ahead!' })).toBeNull();
    rerender(<HomeContent {...props} tasks={[]} error="Could not reach the database." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the database.');
  });

  it('has no desktop-only filters, quick add or schedule on a phone', () => {
    render(<HomeContent {...props} />);
    expect(screen.queryByRole('button', { name: 'All Categories' })).toBeNull();
    expect(screen.queryByText('Quick add')).toBeNull();
    expect(screen.queryByText("Today's Schedule")).toBeNull();
  });

  it('says "1 task remaining" in the singular', () => {
    render(<HomeContent {...props} tasks={[tasks[0]]} />);
    expect(screen.getByText('Sunday, Oct 18 • 1 task remaining')).toBeOnTheScreen();
  });
});

describe('HomeContent (desktop)', () => {
  beforeEach(() => setWindowWidth(1280));

  it('shows the completion rate on the Completed card', () => {
    render(<HomeContent {...props} />);
    // 1 of 5 tasks is done -> 20%
    expect(screen.getByRole('button', { name: 'Completed: 1 20% completion rate' })).toBeOnTheScreen();
  });

  it('filters by category and sorts by priority', () => {
    render(<HomeContent {...props} />);
    const order = () => screen.getAllByRole('checkbox').map((box) => box.props.accessibilityLabel.replace(/^Mark | (not )?done$/g, ''));

    expect(order()).toEqual(['Ship Release', 'Finalize Wireframes', 'API Schema Review']);

    fireEvent.press(screen.getByRole('button', { name: 'Priority' }));
    expect(order()).toEqual(['API Schema Review', 'Finalize Wireframes', 'Ship Release']);

    fireEvent.press(screen.getAllByRole('button', { name: 'Development' })[0]); // the filter pill (the quick-add pill comes later)
    expect(order()).toEqual(['API Schema Review', 'Ship Release']);

    fireEvent.press(screen.getByRole('button', { name: 'All Categories' }));
    expect(order()).toHaveLength(3);
  });

  it('says so when a filter hides everything', () => {
    render(<HomeContent {...props} categories={[...categories, { ...categories[0], id: 'empty', name: 'Meeting' }]} />);
    fireEvent.press(screen.getAllByRole('button', { name: 'Meeting' })[0]);
    expect(screen.getByText('No tasks match this filter.')).toBeOnTheScreen();
  });

  it('quick add submits only once a name and category are chosen', async () => {
    render(<HomeContent {...props} />);
    expect(screen.getByRole('button', { name: 'Fast Submit' })).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Quick add task name'), 'Call the client');
    fireEvent.press(screen.getAllByRole('button', { name: 'Design' }).at(-1)!); // the quick-add pill, not the filter
    expect(screen.getByRole('button', { name: 'Fast Submit' })).toBeEnabled();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Fast Submit' }));
    });
    expect(props.onQuickAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Call the client', categoryId: 'design' }));
  });

  it("shows today's schedule with time ranges and marks the current task", () => {
    render(<HomeContent {...props} />);
    expect(screen.getByRole('header', { name: "Today's Schedule" })).toBeOnTheScreen();
    expect(screen.getByText('11:00 AM - 2:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('Current')).toBeOnTheScreen();
  });
});

describe('pieces', () => {
  it('StatCard names itself with its number and presses', () => {
    const onPress = jest.fn();
    render(<StatCard status="in_process" value={12} caption="Active" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'In Process: 12 Active' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('ScheduleList says when nothing is scheduled', () => {
    render(<ScheduleList tasks={[]} categories={new Map()} now={now} />);
    expect(screen.getByText('Nothing scheduled for today.')).toBeOnTheScreen();
  });

  it('ScheduleList never marks a done task as current', () => {
    const done = makeTask({ name: 'Finished', status: 'done', startAt: at(11), dueAt: at(14) });
    render(<ScheduleList tasks={[done]} categories={new Map()} now={now} />);
    expect(screen.queryByText('Current')).toBeNull();
  });

  it('ErrorBanner shows its message and retries', () => {
    const onRetry = jest.fn();
    render(<ErrorBanner message="Could not save." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not save\./);
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
