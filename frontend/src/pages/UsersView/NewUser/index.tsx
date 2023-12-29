import { memo, useState } from 'react';
import { APP_NAME } from '../../../utils/constants';
import { Key, Mail } from 'react-feather';
import User from '../../../models/user';

const NewUserModal = memo(() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.target);
    const data = {
      email: form.get('email'),
      password: form.get('password'),
      role: form.get('role'),
    };

    const { success, error } = await User.create(data);
    if (success) document?.getElementById(`new-user-modal`)?.close();
    setError(error);
    setLoading(false);
    if (success) window.location.reload();
  };

  return (
    <dialog
      id={`new-user-modal`}
      className="max-w-1/2 rounded-xl border-2 border-white/20 bg-main shadow"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="flex w-115 flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-medium text-white">Create user</p>
        <p className="text-sm text-white/60">
          This user will have access to all organizations in {APP_NAME} once
          created.
        </p>
      </div>
      <div className=" flex w-full flex-col gap-y-2 px-[20px]">
        {error && (
          <p className="my-2 w-full rounded-lg border-red-800 bg-red-600/10 px-4 py-2 text-lg text-red-600">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <div className="mb-4">
            <label className="mb-2.5 block text-sm font-medium text-white">
              Email
            </label>
            <div className="relative">
              <input
                required={true}
                type="email"
                name="email"
                placeholder="User's email"
                className="placeholder-text-white/60 w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
              />

              <span className="absolute right-4 top-2">
                <Mail className="h-[22px] w-[22px] text-gray-500" />
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block text-sm font-medium text-white">
              New Password
            </label>
            <div className="relative">
              <input
                required={true}
                type="password"
                name="password"
                min={8}
                placeholder={`${APP_NAME} account password`}
                className="placeholder-text-white/60 w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
              />

              <span className="absolute right-4 top-2">
                <Key className="h-[22px] w-[22px] text-gray-500" />
              </span>
            </div>
          </div>

          <div className="mb-4 w-1/2">
            <label className="mb-2.5 block text-sm font-medium text-white">
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                defaultValue={'default'}
                className="w-full rounded-lg border border-white/10 bg-main-2 px-4 py-2 text-white"
              >
                <option value="admin">Administrator</option>;
                <option value="default">Member</option>;
              </select>
            </div>
          </div>

          <div className="mb-5 flex w-full justify-center">
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-white px-4 py-2.5 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
            >
              {loading ? 'Creating user...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
});

export default NewUserModal;
