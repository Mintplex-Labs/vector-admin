import useUser from '../../../../hooks/useUser';
import User from '../../../../models/user';
import showToast from '../../../../utils/toast';

export default function CustomLogin({ setCurrentStep, setLoading }) {
  const { user } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const data = {
      email: form.get('email'),
      password: form.get('password'),
    };
    const { success, error } = await User.update(user.id, data);

    if (success) {
      showToast('Login created successfully', 'success');
      setCurrentStep('security_settings');
    } else {
      showToast(`Error creating login: ${error}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 01/
        <span className="text-white text-opacity-40">05</span>
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
