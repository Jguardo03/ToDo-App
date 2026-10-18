import { useRouter } from 'expo-router';

import { SignInForm } from '@/components/session/sign-in-form';
import { useSession, type SignInMode } from '@/context/session';

export default function SignInScreen() {
  const { recent, signIn } = useSession();
  const router = useRouter();

  const submit = async (rawUsername: string, mode: SignInMode) => {
    const result = await signIn(rawUsername, mode);
    if (result.ok) router.replace('/');
    return result;
  };

  return <SignInForm recent={recent} onSubmit={submit} />;
}
