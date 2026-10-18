import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { NOW } from '../../config/jest/factories';

import { CategoryForm } from '@/components/category/category-form';
import { FormLayout } from '@/components/layout/form-layout';
import { QuickAddCard } from '@/components/task/quick-add-card';
import { SubtaskForm } from '@/components/task/subtask-form';
import { TaskForm } from '@/components/task/task-form';
import { Button } from '@/components/ui/button';
import type { Category } from '@/domain/types';

const categories: Category[] = [
  { id: 'design', name: 'Design', description: '', color: '#b7004f', createdAt: NOW, updatedAt: NOW },
  { id: 'dev', name: 'Development', description: '', color: '#00696b', createdAt: NOW, updatedAt: NOW },
];

const typeInto = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('TaskForm', () => {
  it('starts with the first category selected, medium priority and a default due time', () => {
    render(<TaskForm categories={categories} now={NOW} onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: 'Design' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Medium' })).toBeSelected();
    expect(screen.getByLabelText('Date & Time')).toHaveDisplayValue('2026-10-18 17:00');
  });

  it('blocks an empty name and shows the message', () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={NOW} onSubmit={onSubmit} />);
    press('Create Task');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the task as typed, with the chosen category and priority', () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={NOW} onSubmit={onSubmit} />);
    typeInto('Task Name', '  Finalize Homepage Wireframes  ');
    typeInto('Description', 'Prepare component hierarchy.');
    press('Development');
    press('Urgent');
    press('Create Task');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      task: {
        categoryId: 'dev',
        name: 'Finalize Homepage Wireframes',
        description: 'Prepare component hierarchy.',
        priority: 'urgent',
        dueAt: new Date(2026, 9, 18, 17, 0),
      },
      subtasks: [],
    });
  });

  it('adds and removes inline subtasks, and they inherit the task priority', () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={NOW} onSubmit={onSubmit} />);
    typeInto('Task Name', 'Parent');
    press('High');
    press('Add Subtask');
    press('Add Subtask');
    expect(screen.getByLabelText('Subtask 2 name')).toBeOnTheScreen();
    press('Remove subtask 2');
    expect(screen.queryByLabelText('Subtask 2 name')).toBeNull();

    typeInto('Subtask 1 name', 'Draft components');
    press('Create Task');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].subtasks).toEqual([
      { name: 'Draft components', description: '', priority: 'high', dueAt: new Date(2026, 9, 18, 17, 0) },
    ]);
  });

  it('blocks a subtask without a name', () => {
    const onSubmit = jest.fn();
    render(<TaskForm categories={categories} now={NOW} onSubmit={onSubmit} />);
    typeInto('Task Name', 'Parent');
    press('Add Subtask');
    press('Create Task');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a category and offers to create one', () => {
    const onSubmit = jest.fn();
    const onCreateCategory = jest.fn();
    render(<TaskForm categories={[]} now={NOW} onSubmit={onSubmit} onCreateCategory={onCreateCategory} />);
    expect(screen.getByText('You have no categories yet. Create one to continue.')).toBeOnTheScreen();
    typeInto('Task Name', 'Parent');
    press('Create Task');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a category.');
    expect(onSubmit).not.toHaveBeenCalled();
    press('New');
    expect(onCreateCategory).toHaveBeenCalled();
  });

  it('honours a pre-selected category and due date', () => {
    const due = new Date(2026, 9, 20, 9, 30);
    render(<TaskForm categories={categories} now={NOW} initialCategoryId="dev" initialDueAt={due} onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: 'Development' })).toBeSelected();
    expect(screen.getByLabelText('Date & Time')).toHaveDisplayValue('2026-10-20 09:30');
  });

  it('calls onCancel', () => {
    const onCancel = jest.fn();
    render(<TaskForm categories={categories} now={NOW} onSubmit={() => {}} onCancel={onCancel} />);
    press('Cancel');
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('SubtaskForm', () => {
  const parent = { id: 'abcdef123', name: 'Website Redesign', dueAt: new Date(2026, 9, 28, 15, 0), category: { name: 'Design', color: '#b7004f' } };

  it('shows the parent task, its short id and the locked category', () => {
    render(<SubtaskForm parent={parent} now={NOW} onSubmit={() => {}} />);
    expect(screen.getByText('Website Redesign')).toBeOnTheScreen();
    expect(screen.getByText('ABCDEF')).toBeOnTheScreen();
    expect(screen.getByText('Oct 28, 2026, 3:00 PM')).toBeOnTheScreen();
    expect(screen.getByText('Inherited from parent')).toBeOnTheScreen();
    expect(screen.getByText('Design')).toBeOnTheScreen();
    expect(screen.queryByText('Development')).toBeNull();
    expect(screen.getByText('In 10 days')).toBeOnTheScreen();
  });

  it('requires a name', () => {
    const onSubmit = jest.fn();
    render(<SubtaskForm parent={parent} now={NOW} onSubmit={onSubmit} />);
    press('Add Subtask');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits name, description, priority and due date', () => {
    const onSubmit = jest.fn();
    render(<SubtaskForm parent={parent} now={NOW} onSubmit={onSubmit} />);
    typeInto('Subtask Name', 'Focus on bottom sheets');
    typeInto('Description & Specs', 'Keep 48px touch targets.');
    press('High');
    press('Add Subtask');
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Focus on bottom sheets',
      description: 'Keep 48px touch targets.',
      priority: 'high',
      dueAt: parent.dueAt,
    });
  });
});

describe('CategoryForm', () => {
  it('submits name, description and the chosen colour', () => {
    const onSubmit = jest.fn();
    render(<CategoryForm onSubmit={onSubmit} />);
    typeInto('Name', ' Meeting ');
    typeInto('Description', 'Syncs and reviews');
    fireEvent.press(screen.getByRole('radio', { name: 'Colour #795600' }));
    expect(screen.getByRole('radio', { name: 'Colour #795600' })).toBeSelected();
    press('Create Category');
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Meeting', description: 'Syncs and reviews', color: '#795600' });
  });

  it('requires a name', () => {
    const onSubmit = jest.fn();
    render(<CategoryForm onSubmit={onSubmit} />);
    press('Create Category');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can edit an existing category', () => {
    const onSubmit = jest.fn();
    render(<CategoryForm initial={{ name: 'Design', description: 'UI', color: '#00696b' }} submitLabel="Save" onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('Design');
    expect(screen.getByRole('radio', { name: 'Colour #00696b' })).toBeSelected();
    press('Save');
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Design', description: 'UI', color: '#00696b' });
  });
});

describe('QuickAddCard', () => {
  it('keeps Fast Submit disabled until there is a name and a category', () => {
    render(<QuickAddCard categories={categories} now={NOW} onSubmit={() => {}} />);
    const submit = () => screen.getByRole('button', { name: 'Fast Submit' });
    expect(submit()).toBeDisabled();
    typeInto('Quick add task name', 'Call the client');
    expect(submit()).toBeDisabled();
    press('Design');
    expect(submit()).toBeEnabled();
    typeInto('Quick add task name', '   ');
    expect(submit()).toBeDisabled();
  });

  it('creates a medium-priority task due at the end of today, then clears the name', async () => {
    const onSubmit = jest.fn();
    render(<QuickAddCard categories={categories} now={NOW} onSubmit={onSubmit} />);
    typeInto('Quick add task name', ' Call the client ');
    press('Development');
    press('Fast Submit');
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Call the client',
      description: '',
      categoryId: 'dev',
      priority: 'medium',
      dueAt: new Date(2026, 9, 18, 23, 59),
    });
    expect(await screen.findByDisplayValue('')).toBeOnTheScreen();
  });

  it('explains when there are no categories', () => {
    render(<QuickAddCard categories={[]} now={NOW} onSubmit={() => {}} />);
    expect(screen.getByText('Create a category first to add tasks.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Fast Submit' })).toBeDisabled();
  });
});

describe('FormLayout', () => {
  const layout = (
    <FormLayout
      title="New Task"
      subtitle="Details"
      badge="Draft"
      main={<Button label="Main control" />}
      side={<Button label="Side control" />}
      actions={<Button label="Save" />}
    />
  );

  it('shows title, badge, both columns and the actions on a phone', () => {
    setWindowWidth(390);
    render(layout);
    expect(screen.getByRole('header', { name: 'New Task' })).toBeOnTheScreen();
    expect(screen.getByText('Draft')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Main control' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Side control' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(1);
  });

  it('keeps one set of actions on desktop too', () => {
    setWindowWidth(1280);
    render(layout);
    expect(screen.getByRole('header', { name: 'New Task' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Side control' })).toBeOnTheScreen();
  });
});
