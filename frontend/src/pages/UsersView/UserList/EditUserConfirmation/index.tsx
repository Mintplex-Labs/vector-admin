import { memo, useState } from 'react';
import { APP_NAME } from '@/utils/constants';
import { Key, Mail } from 'react-feather';
import User from '@/models/user';

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
        className="max-w-1/2 rounded-xl border-2 border-white/20 bg-main shadow"
        onClick={(event) =>
          event.target == event.currentTarget && event.currentTarget?.close()
        }
      >
        <div className="flex w-115 flex-col gap-y-1 p-[20px]">
          <p className="text-lg font-medium text-white">Edit user</p>
          <p className="text-sm text-white/60">
            You can update the details of this user as the admin of {APP_NAME}.
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
                  placeholder="Enter your email"
                  defaultValue={user.email}
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
                  defaultValue={user.role}
                  className="w-full rounded-lg border border-white/10 bg-main-2 px-4 py-2 text-white"
                >
                  <option value="admin">Administrator</option>;
                  <option value="default">Member</option>;
                </select>
              </div>
            </div>

            <div className="mb-4 max-h-40 w-full overflow-y-auto">
              <div className="sticky top-0 z-10 flex justify-between bg-main">
                <label className=" mb-2.5 block font-medium text-white">
                  Organization Memberships
                </label>
                {/* add select all and unselect all */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const checkboxes = document.querySelectorAll(
                      `input[name^="membership-"]`
                    );
                    checkboxes.forEach((checkbox) => {
                      checkbox.checked = true;
                    });
                  }}
                  className="mb-2.5 block  text-sky-400 hover:text-sky-200"
                >
                  Select All
                </button>
              </div>
              <div className="relative z-0">
                {organizations.map((org) => {
                  const selected = !!user.memberships.find(
                    (membership: any) => membership.organization_id === org.id
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
                      <label className="ml-2 text-sm font-medium text-white">
                        {org.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 flex w-full justify-center">
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-white px-4 py-2.5 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
              >
                {loading ? 'Updating user...' : 'Update user'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    );
  }
);

export default EditUserConfirmation;
