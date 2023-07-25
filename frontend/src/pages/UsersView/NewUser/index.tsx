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
      className="w-1/2 rounded-lg"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-semibold text-blue-600">Create user</p>
        <p className="text-sm text-slate-800">
          This user will have access to all organizations {APP_NAME} once
          created.
        </p>
      </div>
      <div className="my-2 flex w-full flex-col gap-y-2 p-[20px]">
        {error && (
          <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Email
            </label>
            <div className="relative">
              <input
                required={true}
                type="email"
                name="email"
                placeholder="user's email"
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />

              <span className="absolute right-4 top-4">
                <Mail className="h-[22px] w-[22px] text-gray-500" />
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              New Password
            </label>
            <div className="relative">
              <input
                required={true}
                type="password"
                name="password"
                min={8}
                placeholder={`Next ${APP_NAME} account password`}
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />

              <span className="absolute right-4 top-4">
                <Key className="h-[22px] w-[22px] text-gray-500" />
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                defaultValue={'default'}
                className="rounded-lg bg-gray-50 px-4 py-2 text-xl text-gray-800 outline-none"
              >
                <option value="admin">Administrator</option>;
                <option value="default">Member</option>;
              </select>
            </div>
          </div>

          <div className="mb-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
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
