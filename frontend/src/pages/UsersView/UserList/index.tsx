import { lazy, memo, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { CaretDown, DotsThreeVertical, Plus } from '@phosphor-icons/react';
import truncate from 'truncate';
import { debounce } from 'lodash';
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
      <div className="col-span-12 -mt-18 h-screen flex-1 rounded-sm xl:col-span-4">
        <div className="flex items-start justify-between">
          <div className="mb-6 flex flex-col gap-y-1 px-7.5 ">
            <div className="flex items-center gap-x-2">
              <div className="-mt-10 flex items-center gap-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
                >
                  <CaretDown weight="bold" size={18} />
                </button>
                <div className="z-10 text-lg font-medium text-white">
                  Members
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6">
          <table className="w-full text-left text-sm text-white">
            <thead className="border-b-2 border-white/10 bg-main text-sm font-medium uppercase text-white/50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
                <th scope="col" className="px-6 py-3">
                  Organizations
                </th>
                <th scope="col" className="px-6 py-3">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3">
                  {' '}
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
          <button
            type="button"
            onClick={() =>
              document.getElementById(`new-user-modal`)?.showModal()
            }
            className="ml-3 rounded-lg px-2 py-2 text-sm text-sky-400 hover:bg-sky-50"
          >
            <div className="flex items-center gap-x-2">
              <Plus size={18} weight="bold" />
              <div className="font-semibold">Add New User</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

const UserItem = memo(
  ({ user, organizations }: { user: any; organizations: any[] }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef();
    const tooltipRef = useRef();

    const debounceHideTooltip = useRef(
      debounce(() => setShowTooltip(false), 200)
    ).current;

    const handleMouseEnterTooltip = () => {
      debounceHideTooltip.cancel();
      setShowTooltip(true);
    };

    const handleMouseLeaveTooltip = () => {
      debounceHideTooltip();
    };

    useEffect(() => {
      return () => debounceHideTooltip.cancel();
    }, [debounceHideTooltip]);

    useEffect(() => {
      function handleClickOutside(event) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)
        ) {
          setShowMenu(false);
        }
        if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
          setShowTooltip(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const firstOrganization = user.memberships[0]?.name;
    const additionalOrganizationsCount = user.memberships.length - 1;

    return (
      <>
        <tr
          id={`user-row-${user.id}`}
          className="h-[46px] text-sm font-semibold text-white transition-all duration-300 hover:bg-white/5"
        >
          <td className="px-6 py-4">{user.email}</td>
          <td className="px-6 py-4 font-light capitalize">{user.role}</td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-x-2">
              <div className="whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-light text-white">
                {firstOrganization}
              </div>
              {additionalOrganizationsCount > 0 && (
                <div className="relative">
                  <div
                    onMouseEnter={handleMouseEnterTooltip}
                    onMouseLeave={handleMouseLeaveTooltip}
                    className="cursor-pointer whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-light text-white"
                  >
                    +{additionalOrganizationsCount}
                  </div>
                  {showTooltip && (
                    <div
                      ref={tooltipRef}
                      onMouseEnter={handleMouseEnterTooltip}
                      onMouseLeave={handleMouseLeaveTooltip}
                      className="absolute left-0 z-10 mt-2 max-h-[250px] w-48 overflow-y-auto rounded-lg border border-white/20 bg-main px-3 py-2 shadow-lg"
                    >
                      {user.memberships.slice(1).map((org, index) => (
                        <div
                          key={index}
                          className="my-2 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-light text-white"
                        >
                          {truncate(org.name, 18)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>

          <td className="px-6 py-4 font-light">
            {moment(user?.createdAt).fromNow()}
          </td>
          <td className="relative flex items-center justify-center gap-x-4 px-6 py-4">
            <button
              ref={buttonRef}
              onClick={() => setShowMenu(!showMenu)}
              className={`rounded-lg p-1 text-white transition-all duration-300 hover:bg-white/10 ${
                showMenu && 'bg-white/10'
              }`}
            >
              <DotsThreeVertical size={24} weight="bold" />
            </button>
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-11 top-full -mt-2 flex w-fit rounded-lg border border-white/20 bg-main p-4"
              >
                <div className="flex flex-col gap-y-2">
                  <button
                    onClick={() => {
                      document
                        .getElementById(`user-${user.id}-edit`)
                        ?.showModal();
                    }}
                    type="button"
                    className="w-full whitespace-nowrap rounded-md px-4 py-1.5 text-left text-white hover:bg-slate-200/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      document
                        .getElementById(`user-${user.id}-delete`)
                        ?.showModal();
                    }}
                    type="button"
                    className="w-full whitespace-nowrap rounded-md px-4 py-1.5 text-left text-white hover:bg-slate-200/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
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
