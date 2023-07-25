import { lazy, memo } from 'react';
import moment from 'moment';
import pluralize from 'pluralize';
import { APP_NAME } from '../../../utils/constants';
const DeleteUserConfirmation = lazy(() => import('./DeleteUserConfirmation'));
const EditUserConfirmation = lazy(() => import('./EditUserConfirmation'));

export default function UserList({
  users,
  organizations,
}: {
  users: any[];
  organizations: any[];
}) {
  return (
    <>
      <div className="col-span-12 flex-1 rounded-sm dark:border-strokedark dark:bg-boxdark xl:col-span-4">
        <div className="flex items-start justify-between">
          <div className="mb-6 flex flex-col gap-y-1 px-7.5 ">
            <div className="flex items-center gap-x-2">
              <h4 className="text-3xl font-semibold text-black dark:text-white">
                {APP_NAME} Users
              </h4>
              <button
                type="button"
                onClick={() =>
                  document.getElementById(`new-user-modal`)?.showModal()
                }
                className="rounded-lg px-4 py-2 text-sm text-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                Add New User
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {users?.length} {pluralize('user', users.length)}
            </p>
          </div>
        </div>

        <div className="px-6">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  #
                </th>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
                <th scope="col" className="px-6 py-3">
                  Memberships
                </th>
                <th scope="col" className="px-6 py-3">
                  Created
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                return (
                  <UserItem
                    key={user.id}
                    user={user}
                    organizations={organizations}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const UserItem = memo(
  ({ user, organizations }: { user: any; organizations: any[] }) => {
    return (
      <>
        <tr
          id={`user-row-${user.id}`}
          className="border-b bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800"
        >
          <th
            scope="row"
            className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
          >
            {user.id}
          </th>
          <td className="px-6 py-4">{user.email}</td>
          <td className="px-6 py-4">{user.role}</td>
          <td className="px-6 py-4">
            <div className="no-scrollbar flex w-[200px] flex-row items-center gap-x-2 overflow-x-scroll">
              {user.memberships.map((org: any) => {
                return (
                  <div className="w-fit whitespace-nowrap rounded-full bg-blue-100 px-5 py-1 text-sm text-blue-800">
                    {org.name}
                  </div>
                );
              })}
            </div>
          </td>

          <td className="px-6 py-4">
            {moment.unix(user?.createdAt).fromNow()}
          </td>
          <td className="flex items-center gap-x-4 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                document.getElementById(`user-${user.id}-edit`)?.showModal();
              }}
              className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById(`user-${user.id}-delete`)?.showModal();
              }}
              className="rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              Delete
            </button>
          </td>
        </tr>
        {!!user && (
          <DeleteUserConfirmation key={`delete-modal-${user.id}`} user={user} />
        )}
        {!!user && (
          <EditUserConfirmation
            key={`edit-modal-${user.id}`}
            user={user}
            organizations={organizations}
          />
        )}
      </>
    );
  }
);
