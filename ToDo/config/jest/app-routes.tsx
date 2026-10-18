import SignInScreen from '@/app/sign-in';
import TabsLayout from '@/app/(tabs)/_layout';
import CalendarScreen from '@/app/(tabs)/calendar';
import CategoriesScreen from '@/app/(tabs)/categories';
import HomeScreen from '@/app/(tabs)/index';
import CategoryScreen from '@/app/category/[id]';
import StatusScreen from '@/app/status/[status]';
import EditTaskScreen from '@/app/task/[id]/edit';
import TaskScreen from '@/app/task/[id]/index';
import NewSubtaskScreen from '@/app/task/[id]/subtask-new';
import EditSubtaskScreen from '@/app/task/[id]/subtask/[subtaskId]';
import NewTaskScreen from '@/app/task/new';

/** Every screen of the app, for `renderRouter`. Add a route here when a new screen file is added. */
export const appRoutes = {
  'sign-in': SignInScreen,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': HomeScreen,
  '(tabs)/calendar': CalendarScreen,
  '(tabs)/categories': CategoriesScreen,
  'task/new': NewTaskScreen,
  'task/[id]/index': TaskScreen,
  'task/[id]/edit': EditTaskScreen,
  'task/[id]/subtask-new': NewSubtaskScreen,
  'task/[id]/subtask/[subtaskId]': EditSubtaskScreen,
  'status/[status]': StatusScreen,
  'category/[id]': CategoryScreen,
};
