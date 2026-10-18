import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { makeTask } from '../../config/jest/factories';

import { CategoriesContent } from '@/components/category/categories-content';
import { CategoryCard } from '@/components/category/category-card';
import { CategoryDetail } from '@/components/category/category-detail';
import type { Category, Task } from '@/domain/types';

const now = new Date(2026, 9, 18, 12, 0);
const at = (hours: number, minutes = 0, dayOffset = 0) => new Date(2026, 9, 18 + dayOffset, hours, minutes);
const stamp = new Date(2026, 9, 1);

const design: Category = { id: 'design', name: 'Design', description: 'Wireframes and UI kits', color: '#b7004f', createdAt: stamp, updatedAt: stamp };
const dev: Category = { id: 'dev', name: 'Development', description: 'Building things', color: '#00696b', createdAt: stamp, updatedAt: stamp };
const tasks: Task[] = [
  makeTask({ id: 'a', categoryId: 'design', name: 'Wireframes', status: 'done', dueAt: at(10) }),
  makeTask({ id: 'b', categoryId: 'design', name: 'UI Kit', status: 'in_process', dueAt: at(16) }),
  makeTask({ id: 'c', categoryId: 'design', name: 'Old Report', status: 'pending', dueAt: at(9, 0, -1) }),
  makeTask({ id: 'd', categoryId: 'dev', name: 'API Review', status: 'pending', dueAt: at(18) }),
];

function setWindowWidth(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('CategoryCard', () => {
  it('shows a progress bar and "x / y Done" when given the done count', () => {
    render(<CategoryCard category={design} taskCount={4} doneCount={3} />);
    expect(screen.getByText('3 / 4 Done')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'Design progress' })).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 75 });
  });

  it('has no bar without a done count, or with no tasks', () => {
    const { rerender } = render(<CategoryCard category={design} taskCount={4} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    rerender(<CategoryCard category={design} taskCount={0} doneCount={0} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('CategoriesContent', () => {
  const props = { categories: [design, dev], tasks, onOpenCategory: jest.fn(), onCreate: jest.fn(async () => undefined as string | undefined) };
  beforeEach(() => {
    jest.clearAllMocks();
    setWindowWidth(390);
  });

  it('counts categories and tasks and shows each card with its task count', () => {
    render(<CategoriesContent {...props} />);
    expect(screen.getByRole('header', { name: 'Categories' })).toBeOnTheScreen();
    expect(screen.getByText('2 categories • 4 tasks')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Design, 3 Tasks' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Development, 1 Task' })).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).toBeNull(); // phone cards have no bar
  });

  it('opens a category when its card is pressed', () => {
    render(<CategoriesContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'Development, 1 Task' }));
    expect(props.onOpenCategory).toHaveBeenCalledWith(dev);
  });

  it('shows progress on the desktop cards', () => {
    setWindowWidth(1280);
    render(<CategoriesContent {...props} />);
    expect(screen.getByText('1 / 3 Done')).toBeOnTheScreen();
    expect(screen.getByLabelText('Search categories')).toBeOnTheScreen();
  });

  it('creates a category from the "New Category" card and closes the sheet on success', async () => {
    render(<CategoriesContent {...props} />);
    fireEvent.press(screen.getByRole('button', { name: 'New Category' }));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Meeting');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Category' }));
    });
    expect(props.onCreate).toHaveBeenCalledWith({ name: 'Meeting', description: '', color: '#b7004f' });
    expect(screen.queryByRole('button', { name: 'Create Category' })).toBeNull();
  });

  it('keeps the sheet open and shows the reason when saving fails', async () => {
    const onCreate = jest.fn(async () => 'Could not reach the database.' as string | undefined);
    render(<CategoriesContent {...props} onCreate={onCreate} />);
    fireEvent.press(screen.getByRole('button', { name: 'New Category' }));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Meeting');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Create Category' }));
    });
    expect(screen.getByRole('button', { name: 'Create Category' })).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the database\./);
  });

  it('searches on a phone with the search button, and says when nothing matches', () => {
    render(<CategoriesContent {...props} />);
    expect(screen.queryByPlaceholderText('Filter categories...')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Search categories' }));
    fireEvent.changeText(screen.getByPlaceholderText('Filter categories...'), 'dev');
    expect(screen.queryByRole('button', { name: 'Design, 3 Tasks' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Development, 1 Task' })).toBeOnTheScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Filter categories...'), 'zzz');
    expect(screen.getByText('No categories match your search.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Close search' }));
    expect(screen.getByRole('button', { name: 'Design, 3 Tasks' })).toBeOnTheScreen();
  });

  it('searches on desktop without a button', () => {
    setWindowWidth(1280);
    render(<CategoriesContent {...props} />);
    fireEvent.changeText(screen.getByLabelText('Search categories'), 'build');
    expect(screen.getByRole('button', { name: 'Development, 1 Task' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Design, 3 Tasks' })).toBeNull();
  });

  describe('with no categories', () => {
    const empty = { ...props, categories: [], tasks: [] };

    it('invites the first category and suggests starters', () => {
      render(<CategoriesContent {...empty} />);
      expect(screen.getByText('0 categories • 0 tasks')).toBeOnTheScreen();
      expect(screen.getByRole('header', { name: 'Organize Your Universe' })).toBeOnTheScreen();
      for (const name of ['Design', 'Development', 'Coding', 'Meeting', 'Personal']) {
        expect(screen.getByRole('button', { name })).toBeOnTheScreen();
      }
      expect(screen.queryByRole('button', { name: 'Search categories' })).toBeNull();
    });

    it('a starter creates that category at once, with a palette colour', async () => {
      render(<CategoriesContent {...empty} />);
      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Coding' }));
      });
      expect(props.onCreate).toHaveBeenCalledWith({ name: 'Coding', description: '', color: '#5b3f44' });
    });

    it('"Create First Category" opens the form', () => {
      render(<CategoriesContent {...empty} />);
      fireEvent.press(screen.getByRole('button', { name: 'Create First Category' }));
      expect(screen.getByRole('button', { name: 'Create Category' })).toBeOnTheScreen();
    });
  });

  it('shows a spinner while loading and a message when loading failed', () => {
    const { rerender } = render(<CategoriesContent {...props} categories={[]} loading />);
    expect(screen.getByLabelText('Loading categories')).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Organize Your Universe' })).toBeNull();
    rerender(<CategoriesContent {...props} error="Could not load." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not load\./);
  });
});

describe('CategoryDetail', () => {
  const detail = {
    category: design,
    tasks: tasks.filter((t) => t.categoryId === 'design'),
    now,
    onBack: jest.fn(),
    onOpenMenu: jest.fn(),
    onToggleDone: jest.fn(),
    onOpenTask: jest.fn(),
    onAddTask: jest.fn(),
  };
  beforeEach(() => jest.clearAllMocks());

  it('shows the name, description, task count, done ratio and overdue count', () => {
    render(<CategoryDetail {...detail} />);
    expect(screen.getByRole('header', { name: 'Design' })).toBeOnTheScreen();
    expect(screen.getByText('Wireframes and UI kits')).toBeOnTheScreen();
    expect(screen.getByText('3 Tasks')).toBeOnTheScreen();
    expect(screen.getByText('33%')).toBeOnTheScreen(); // 1 of 3 done
    expect(screen.getByText('1')).toBeOnTheScreen(); // 1 overdue
  });

  it('lists active tasks first (soonest due), then done tasks', () => {
    render(<CategoryDetail {...detail} />);
    const order = screen.getAllByRole('checkbox').map((box) => box.props.accessibilityLabel.replace(/^Mark | (not )?done$/g, ''));
    expect(order).toEqual(['Old Report', 'UI Kit', 'Wireframes']);
  });

  it('opens and ticks tasks, goes back, opens the menu and adds a task', () => {
    render(<CategoryDetail {...detail} />);
    fireEvent.press(screen.getByRole('button', { name: /^UI Kit,/ }));
    expect(detail.onOpenTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark UI Kit done' }));
    expect(detail.onToggleDone).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), true);
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    fireEvent.press(screen.getByRole('button', { name: 'Category options' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add Task to Category' }));
    expect(detail.onBack).toHaveBeenCalled();
    expect(detail.onOpenMenu).toHaveBeenCalled();
    expect(detail.onAddTask).toHaveBeenCalled();
  });

  it('handles an empty category, a missing description, loading and errors', () => {
    const { rerender } = render(<CategoryDetail {...detail} category={{ ...design, description: '' }} tasks={[]} />);
    expect(screen.getByText('No tasks in this category yet.')).toBeOnTheScreen();
    expect(screen.getByText('No description yet.')).toBeOnTheScreen();
    expect(screen.getByText('0%')).toBeOnTheScreen();
    expect(screen.getByText('0 Tasks')).toBeOnTheScreen();
    rerender(<CategoryDetail {...detail} tasks={[]} loading error="Could not save." />);
    expect(screen.getByLabelText('Loading tasks')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not save\./);
  });
});
