import { FormEvent } from 'react';
import User from '@/models/user';
import showToast from '@/utils/toast';
import { STORE_TOKEN, STORE_USER } from '@/utils/constants';

type CustomLoginProps = {
  setCurrentStep: (step: string) => void;
  setLoading: (loading: boolean) => void;
  stepIdx: number;
  stepCount: number;
};

export default function CustomLogin({
  setCurrentStep,
  setLoading,
  stepIdx,
  stepCount,
}: CustomLoginProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      email: form.get('email') as string,
      password: form.get('password') as string,
    };

    const { user, token, error } = await User.transferRootOwnership(
      data.email,
      data.password
    );

    if (!!token) {
      window.localStorage.setItem(STORE_USER, JSON.stringify(user));
      window.localStorage.setItem(STORE_TOKEN, token);
      showToast('Login created successfully', 'success', { clear: true });
      setCurrentStep('security_settings');
    } else {
      showToast(`Error creating login: ${error}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 0{stepIdx}/
        <span className="text-white text-opacity-40">0{stepCount}</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Create your custom login
      </div>
      <div className="w-[300px] text-sm font-light text-white text-opacity-90">
        This will be your account login information moving forward. The previous
        default login will become obsolete.{' '}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 mt-7">
          <div className="">
            <input
              required={true}
              type="email"
              name="email"
              placeholder="Email"
              className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="">
            <input
              required={true}
              type="password"
              name="password"
              min={8}
              placeholder="Password"
              className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
            />
          </div>
        </div>
        <div className="mb-6 w-[300px] text-center text-xs font-medium italic text-white text-opacity-90">
          If you lose your password you will never be able to recover it - so
          keep it safe.
        </div>
        <div className="mb-5">
          <button
            type="submit"
            className="h-11
               w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
