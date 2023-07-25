import { memo, useState } from 'react';
import { APP_NAME } from '../../../../utils/constants';
import { Key, Mail } from 'react-feather';
import User from '../../../../models/user';

function parseMemberships(form: any) {
  const memberships = [];
  for (const key of form.keys()) {
    if (!key.includes('membership')) continue;
    if (form.get(key) === 'on') {
      memberships.push(Number(key.split('-')[1])); // org ID
    }
  }
  return memberships;
}

const EditUserConfirmation = memo(
  ({ user, organizations }: { user: any; organizations: any[] }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const form = new FormData(e.target);
      const data = {
        email: form.get('email'),
        role: form.get('role'),
        ...(!!form.get('password') ? { password: form.get('password') } : {}),
        memberships: parseMemberships(form),
      };
      const { success, error } = await User.update(user.id, data);
      if (success) document?.getElementById(`user-${user.id}-edit`)?.close();
      setError(error);
      setLoading(false);
    };

    return (
      <dialog
        id={`user-${user.id}-edit`}
        className="w-1/2 rounded-lg"
        onClick={(event) =>
          event.target == event.currentTarget && event.currentTarget?.close()
        }
      >
        <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
          <p className="text-lg font-semibold text-blue-600">Edit user</p>
          <p className="text-sm text-slate-800">
            You can update the details this user as the admin of {APP_NAME}.
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
                  placeholder="Enter your email"
                  defaultValue={user.email}
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
                  defaultValue={user.role}
                  className="rounded-lg bg-gray-50 px-4 py-2 text-xl text-gray-800 outline-none"
                >
                  <option value="admin">Administrator</option>;
                  <option value="default">Member</option>;
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2.5 block w-full font-medium text-black dark:text-white">
                Organization Memberships
              </label>
              <div className="relative">
                {organizations.map((org) => {
                  const selected = !!user.memberships.find(
                    (membership: any) => membership.organization_id == org.id
                  );
                  return (
                    <div
                      key={`organization-${org.id}`}
                      className="mb-4 flex items-center"
                    >
                      <input
                        name={`membership-${org.id}`}
                        defaultChecked={selected}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        {org.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
              >
                {loading ? 'Updating user...' : ' Update user'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    );
  }
);

export default EditUserConfirmation;
