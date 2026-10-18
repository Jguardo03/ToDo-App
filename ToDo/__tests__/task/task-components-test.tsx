import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { makeTask } from '../../config/jest/factories';

import { StatusList } from '@/components/task/status-list';
import { SubtaskForm } from '@/components/task/subtask-form';
import { TaskDetail } from '@/components/task/task-detail';
import { TaskForm } from '@/components/task/task-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Category, Subtask, Task } from '@/domain/types';

const now = new Date(2026, 9, 18, 12, 0);
const at = (hours: number, minutes = 0, dayOffset = 0) => new Date(2026, 9, 18 + dayOffset, hours, minutes);
const category = { name: 'Design', color: '#b7004f' };
const stamp = new Date(2026, 9, 1);
const categories: Category[] = [
  { id: 'design', name: 'Design', description: '', color: '#b7004f', createdAt: stamp, updatedAt: stamp },
  { id: 'dev', name: 'Development', description: '', color: '#00696b', createdAt: stamp, updatedAt: stamp },
];

const subtask = (id: string, name: string, status: Subtask['status'] = 'pending'): Subtask => ({
  id,
  taskId: 't1',
  name,
  description: '',
  priority: 'medium',
  status,
  dueAt: at(17),
  ...(status === 'done' ? { completedAt: at(10, 30) } : {}),
  createdAt: stamp,
  updatedAt: stamp,
});

const detailProps = {
  now,
  category,
  onBack: jest.fn(),
  onOpenMenu: jest.fn(),
  onSetStatus: jest.fn(),
  onToggleSubtask: jest.fn(),
  onOpenSubtask: jest.fn(),
  onAddSubtask: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('TaskDetail', () => {
  const task = makeTask({
    id: 'abcdef123',
    name: 'Finalize Homepage Wireframes',
    description: 'Prepare component hierarchy and color tokens.',
    priority: 'high',
    status: 'in_process',
    dueAt: at(17),
    subtaskTotal: 5,
    subtaskDone: 3,
  });
  const subtasks = [
    subtask('s1', 'Draft wireframe components', 'done'),
    subtask('s2', 'Review token contrast', 'done'),
    subtask('s3', 'Audit mobile touch targets', 'done'),
    subtask('s4', 'Prototype micro-interactions'),
    subtask('s5', 'Export Figma assets'),
  ];

  it('shows tags, id, title, due date, description, progress and lifecycle', () => {
    render(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    expect(screen.getByRole('header', { name: 'Finalize Homepage Wireframes' })).toBeOnTheScreen();
    expect(screen.getByText('Design')).toBeOnTheScreen();
    expect(screen.getByText('High')).toBeOnTheScreen();
    expect(screen.getByText('Task // abcdef')).toBeOnTheScreen();
    expect(screen.getByText('Oct 18, 2026, 5:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('Prepare component hierarchy and color tokens.')).toBeOnTheScreen();
    expect(screen.getByText('60% Completed')).toBeOnTheScreen();
    expect(screen.getByText('3 of 5 Done')).toBeOnTheScreen();
    expect(screen.getByText('3/5')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'In Process' })).toBeSelected();
  });

  it('computes progress from the visible subtasks, so a tick shows at once', () => {
    const ticked = subtasks.map((s) => (s.id === 's4' ? { ...s, status: 'done' as const } : s));
    render(<TaskDetail {...detailProps} task={task} subtasks={ticked} />);
    expect(screen.getByText('80% Completed')).toBeOnTheScreen();
    expect(screen.getByText('4 of 5 Done')).toBeOnTheScreen();
  });

  it('shows a done task as 100% with a Reopen button instead of Finish', () => {
    render(<TaskDetail {...detailProps} task={{ ...task, status: 'done' }} subtasks={subtasks} />);
    expect(screen.getByText('100% Completed')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Finish Task' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Reopen Task' }));
    expect(detailProps.onSetStatus).toHaveBeenCalledWith('pending');
  });

  it('Finish Task marks it done', () => {
    render(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    fireEvent.press(screen.getByRole('button', { name: 'Finish Task' }));
    expect(detailProps.onSetStatus).toHaveBeenCalledWith('done');
  });

  it('offers to finish when every subtask is done', () => {
    const all = subtasks.map((s) => ({ ...s, status: 'done' as const }));
    const { rerender } = render(<TaskDetail {...detailProps} task={task} subtasks={all} />);
    expect(screen.getByText('All subtasks are done. Finish the task?')).toBeOnTheScreen();
    rerender(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    expect(screen.queryByText('All subtasks are done. Finish the task?')).toBeNull();
  });

  it('shows overdue: the chip, and the lifecycle selector cannot pick it', () => {
    render(<TaskDetail {...detailProps} task={{ ...task, dueAt: at(9) }} subtasks={subtasks} />);
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Overdue' })).toBeDisabled();
  });

  it('changes status from the lifecycle selector', () => {
    render(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    fireEvent.press(screen.getByRole('radio', { name: 'Pending' }));
    expect(detailProps.onSetStatus).toHaveBeenCalledWith('pending');
  });

  it('ticks, opens and adds subtasks', () => {
    render(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Export Figma assets done' }));
    expect(detailProps.onToggleSubtask).toHaveBeenCalledWith(expect.objectContaining({ id: 's5' }), true);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Draft wireframe components not done' }));
    expect(detailProps.onToggleSubtask).toHaveBeenLastCalledWith(expect.objectContaining({ id: 's1' }), false);
    fireEvent.press(screen.getByRole('button', { name: /^Export Figma assets,/ }));
    expect(detailProps.onOpenSubtask).toHaveBeenCalledWith(expect.objectContaining({ id: 's5' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(detailProps.onAddSubtask).toHaveBeenCalled();
  });

  it('navigates back and opens the options menu', () => {
    render(<TaskDetail {...detailProps} task={task} subtasks={subtasks} />);
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    fireEvent.press(screen.getByRole('button', { name: 'Task options' }));
    expect(detailProps.onBack).toHaveBeenCalled();
    expect(detailProps.onOpenMenu).toHaveBeenCalled();
  });

  it('says so when there are no subtasks, and while they load', () => {
    const { rerender } = render(<TaskDetail {...detailProps} task={{ ...task, subtaskTotal: 0, subtaskDone: 0 }} subtasks={[]} />);
    expect(screen.getByText('No subtasks yet. Add one to break this task into steps.')).toBeOnTheScreen();
    expect(screen.queryByText(/of \d+ Done/)).toBeNull();
    rerender(<TaskDetail {...detailProps} task={task} subtasks={undefined} />);
    expect(screen.getByLabelText('Loading subtasks')).toBeOnTheScreen();
    expect(screen.getByText('60% Completed')).toBeOnTheScreen(); // from the task's own counters until the list arrives
  });

  it('shows a placeholder for an empty description and an error banner', () => {
    render(<TaskDetail {...detailProps} task={{ ...task, description: '' }} subtasks={subtasks} error="Could not save." />);
    expect(screen.getByText('No description yet.')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not save\./);
  });
});

describe('StatusList', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', name: 'Finalize Wireframes', categoryId: 'design', priority: 'high', status: 'in_process', dueAt: at(14), subtaskTotal: 4, subtaskDone: 1 }),
    makeTask({ id: 'b', name: 'API Schema Review', categoryId: 'dev', priority: 'urgent', status: 'in_process', dueAt: at(16) }),
  ];
  const props = { status: 'in_process' as const, categories, now, onBack: jest.fn(), onToggleDone: jest.fn(), onOpenTask: jest.fn(), onAddTask: jest.fn() };

  it('shows the status, its description, the count and the tasks with their chips', () => {
    render(<StatusList {...props} tasks={tasks} />);
    expect(screen.getByRole('header', { name: 'In Process' })).toBeOnTheScreen();
    expect(screen.getByText('Tasks you are working on right now.')).toBeOnTheScreen();
    expect(screen.getByText('2 Tasks')).toBeOnTheScreen();
    expect(screen.getByText('Finalize Wireframes')).toBeOnTheScreen();
    expect(screen.getByText('Development')).toBeOnTheScreen();
    expect(screen.getByText('Urgent')).toBeOnTheScreen();
  });

  it('opens and ticks tasks, goes back and adds a task', () => {
    render(<StatusList {...props} tasks={tasks} />);
    fireEvent.press(screen.getByRole('button', { name: /^API Schema Review,/ }));
    expect(props.onOpenTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark API Schema Review done' }));
    expect(props.onToggleDone).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), true);
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Add Task to Status' }));
    expect(props.onAddTask).toHaveBeenCalled();
  });

  it('says so when empty, and hides "Add Task to Status" when it is not allowed', () => {
    render(<StatusList {...props} status="overdue" tasks={[]} onAddTask={undefined} />);
    expect(screen.getByText('No overdue tasks right now.')).toBeOnTheScreen();
    expect(screen.getByText('0 Tasks')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add Task to Status' })).toBeNull();
  });

  it('shows a spinner while loading and an error when loading failed', () => {
    const { rerender } = render(<StatusList {...props} tasks={[]} loading />);
    expect(screen.getByLabelText('Loading tasks')).toBeOnTheScreen();
    rerender(<StatusList {...props} tasks={[]} error="Could not reach the database." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the database\./);
  });
});

describe('ConfirmDialog', () => {
  it('asks, and either cancels or confirms', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog visible title="Delete this task?" message="It will be gone." confirmLabel="Delete Task" onConfirm={onConfirm} onCancel={onCancel} />,
    );
    expect(screen.getByRole('header', { name: 'Delete this task?' })).toBeOnTheScreen();
    expect(screen.getByText('It will be gone.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Delete Task' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('forms in edit mode', () => {
  it('TaskForm: starts with the task filled in, hides subtasks and saves the changes', async () => {
    const onSubmit = jest.fn();
    const task = makeTask({ name: 'Old name', description: 'Old text', categoryId: 'dev', priority: 'urgent', dueAt: at(18) });
    render(<TaskForm categories={categories} now={now} initial={task} onSubmit={onSubmit} />);

    expect(screen.getByRole('header', { name: 'Edit Task' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add Subtask' })).toBeNull();
    expect(screen.getByLabelText('Task Name')).toHaveDisplayValue('Old name');
    expect(screen.getByRole('button', { name: 'Development' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Urgent' })).toBeSelected();

    fireEvent.changeText(screen.getByLabelText('Task Name'), 'New name');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Changes' }));
    });
    expect(onSubmit).toHaveBeenCalledWith({
      task: { categoryId: 'dev', name: 'New name', description: 'Old text', priority: 'urgent', dueAt: at(18) },
      subtasks: [],
    });
  });

  it('TaskForm: a starting status other than pending is sent with the new task', async () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={now} initialStatus="in_process" onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('Task Name'), 'Started already');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Task' }));
    });
    expect(onSubmit.mock.calls[0][0].task).toMatchObject({ name: 'Started already', status: 'in_process' });
  });

  it('TaskForm: a pending start sends no status (the repository defaults it)', async () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={now} initialStatus="pending" onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('Task Name'), 'Plain');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Task' }));
    });
    expect(onSubmit.mock.calls[0][0].task).not.toHaveProperty('status');
  });

  it('SubtaskForm: starts filled in, saves changes and offers delete', async () => {
    const onSubmit = jest.fn();
    const onDelete = jest.fn();
    const parent = { id: 'abc123', name: 'Parent', dueAt: at(20), category };
    render(<SubtaskForm parent={parent} now={now} initial={subtask('s1', 'Old subtask')} onSubmit={onSubmit} onDelete={onDelete} />);

    expect(screen.getByRole('header', { name: 'Edit Subtask' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Subtask Name')).toHaveDisplayValue('Old subtask');
    expect(screen.getByRole('button', { name: 'Medium' })).toBeSelected();
    fireEvent.changeText(screen.getByLabelText('Subtask Name'), 'New subtask');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save Subtask' }));
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'New subtask', priority: 'medium', dueAt: at(17) }));
    fireEvent.press(screen.getByRole('button', { name: 'Delete Subtask' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('SubtaskForm: refuses a due time after the task, and accepts the same time or earlier', async () => {
    const onSubmit = jest.fn();
    const parent = { id: 'abc123', name: 'Parent', dueAt: at(20), category };
    render(<SubtaskForm parent={parent} now={now} onSubmit={onSubmit} />);

    expect(screen.getByText("On or before the task's due time (Oct 18, 2026, 8:00 PM).")).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('Subtask Name'), 'Late one');

    fireEvent.changeText(screen.getByLabelText('Due Date & Time'), '2026-10-18 20:01');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add Subtask' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Must not be after the task's due time (Oct 18, 2026, 8:00 PM).")).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Due Date & Time'), '2026-10-18 20:00');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add Subtask' }));
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Late one', dueAt: at(20) }));
  });

  it('TaskForm: an inline subtask due after the task is refused', async () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={now} initialDueAt={at(17)} onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('Task Name'), 'Parent');
    fireEvent.press(screen.getByRole('button', { name: 'Add Subtask' }));
    fireEvent.changeText(screen.getByLabelText('Subtask 1 name'), 'Too late');
    fireEvent.changeText(screen.getByLabelText('Subtask 1 due date'), '2026-10-18 18:00');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Task' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Must not be after the task's due time (Oct 18, 2026, 5:00 PM).")).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Subtask 1 due date'), '2026-10-18 16:00');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Task' }));
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('TaskForm: only the edit form warns that subtasks move with an earlier due time', () => {
    const { unmount } = render(<TaskForm categories={categories} now={now} initial={makeTask({ dueAt: at(18) })} onSubmit={() => {}} />);
    expect(screen.getByText('Subtasks due later than this move to the new due time.')).toBeOnTheScreen();
    unmount();
    render(<TaskForm categories={categories} now={now} onSubmit={() => {}} />);
    expect(screen.queryByText('Subtasks due later than this move to the new due time.')).toBeNull();
  });

  it('SubtaskForm: has no delete button when creating', () => {
    render(<SubtaskForm parent={{ id: 'abc123', name: 'Parent', dueAt: at(20), category }} now={now} onSubmit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Delete Subtask' })).toBeNull();
  });
});
