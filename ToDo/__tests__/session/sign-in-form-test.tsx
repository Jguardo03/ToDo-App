import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { SignInForm } from '@/components/session/sign-in-form';
import type { SignInResult } from '@/context/session';

const typeHandle = (value: string) => fireEvent.changeText(screen.getByLabelText('Unique handle'), value);

describe('SignInForm', () => {
  it('explains that there is no password, and that a handle is not private', () => {
    render(<SignInForm recent={[]} onSubmit={async () => ({ ok: true })} />);
    expect(screen.getByRole('header', { name: 'Welcome to ToDo' })).toBeOnTheScreen();
    expect(screen.getByText(/No password needed/)).toBeOnTheScreen();
    expect(screen.getByText(/anyone who knows it can open that list/)).toBeOnTheScreen();
  });

  it('shows "Ready" only for a valid handle', () => {
    render(<SignInForm recent={[]} onSubmit={async () => ({ ok: true })} />);
    expect(screen.queryByText('Ready')).toBeNull();
    typeHandle('ab');
    expect(screen.queryByText('Ready')).toBeNull();
    typeHandle('rune_dev');
    expect(screen.getByText('Ready')).toBeOnTheScreen();
  });

  it('submits the handle with the chosen mode', async () => {
    const onSubmit = jest.fn(async (): Promise<SignInResult> => ({ ok: true }));
    render(<SignInForm recent={[]} onSubmit={onSubmit} />);
    typeHandle('rune_dev');

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'New User' }));
    });
    expect(onSubmit).toHaveBeenLastCalledWith('rune_dev', 'new');

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Returning User' }));
    });
    expect(onSubmit).toHaveBeenLastCalledWith('rune_dev', 'returning');
  });

  it('shows the error from a failed sign-in', async () => {
    const onSubmit = jest.fn(async (): Promise<SignInResult> => ({ ok: false, error: 'That username is taken.' }));
    render(<SignInForm recent={[]} onSubmit={onSubmit} />);
    typeHandle('rune_dev');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'New User' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('That username is taken.');
  });

  it('disables both buttons while a sign-in is running', async () => {
    let finish: (result: SignInResult) => void = () => {};
    const onSubmit = jest.fn(() => new Promise<SignInResult>((resolve) => (finish = resolve)));
    render(<SignInForm recent={[]} onSubmit={onSubmit} />);
    typeHandle('rune_dev');

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Returning User' }));
    });
    expect(screen.getByRole('button', { name: 'Returning User' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'New User' })).toBeDisabled();

    await act(async () => finish({ ok: true }));
    expect(screen.getByRole('button', { name: 'New User' })).toBeEnabled();
  });

  it('lists recent handles and fills the field when one is tapped', () => {
    render(<SignInForm recent={['rune_dev', 'alex_designer']} onSubmit={async () => ({ ok: true })} />);
    expect(screen.getByText('Previously active on this device')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: '@alex_designer' }));
    expect(screen.getByLabelText('Unique handle')).toHaveDisplayValue('alex_designer');
    expect(screen.getByText('Ready')).toBeOnTheScreen();
  });

  it('hides the recent list when there is nothing to show', () => {
    render(<SignInForm recent={[]} onSubmit={async () => ({ ok: true })} />);
    expect(screen.queryByText('Previously active on this device')).toBeNull();
  });
});
