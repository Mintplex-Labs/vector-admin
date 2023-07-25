import { memo, useState } from 'react';
import { Loader } from 'react-feather';
import User from '../../../../models/user';
import { APP_NAME } from '../../../../utils/constants';

const DeleteUserConfirmation = memo(({ user }: { user: any }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  if (!user) return null;

  const deleteUser = async () => {
    setLoading(true);
    setError(null);
    const { success, error } = await User.delete(user.id);
    if (success) {
      document?.getElementById(`user-row-${user.id}`)?.classList.add('hidden');
      document?.getElementById(`user-${user.id}-delete`)?.close();
    } else {
      setError(error);
    }
    setLoading(false);
  };

  return (
    <dialog id={`user-${user.id}-delete`} className="w-1/2 rounded-lg">
      <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-semibold text-red-600">Delete this user?</p>
        <p className="text-sm text-slate-800">
          Once you delete this user they will be unable to access {APP_NAME}.
        </p>
      </div>
      <div className="flex w-full flex-col overflow-y-scroll px-4">
        {error && (
          <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={deleteUser}
            className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-red-500 hover:bg-red-200 disabled:bg-red-200"
          >
            {loading ? (
              <Loader className="h-6 w-6 animate-spin" />
            ) : (
              'Yes, delete this user'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              document.getElementById(`user-${user.id}-delete`)?.close();
            }}
            className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
          >
            Nevermind
          </button>
        </div>
      </div>
    </dialog>
  );
});

export default DeleteUserConfirmation;
