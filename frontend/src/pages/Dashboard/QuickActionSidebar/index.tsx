import {
  CaretDown,
  Key,
  ShieldCheckered,
  SpinnerGap,
  Toolbox,
  User,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import paths from '../../../utils/paths';
import useUser from '../../../hooks/useUser';

export default function QuickActionsSidebar({
  organization,
}: {
  organization: any;
}) {
  const { user } = useUser();
  const [quickActionsOpen, setQuickActionsOpen] = useState(true);

  return (
    <div className="-mt-14 w-[217px]">
      <button
        onClick={() => setQuickActionsOpen(!quickActionsOpen)}
        className="w-full text-white/80"
      >
        <div className="flex items-center justify-between">
          <div className="font-['Plus Jakarta Sans'] whitespace-nowrap text-xs font-semibold uppercase leading-tight tracking-wide text-white text-opacity-80">
            quick actions
          </div>
          <div
            className={`${
              quickActionsOpen ? '' : 'rotate-180'
            } transition-all duration-300`}
          >
            <CaretDown size={18} weight="bold" />
          </div>
        </div>
      </button>

      <div
        className={`${
          quickActionsOpen
            ? 'slide-down mb-4 mt-4 transition-all duration-300'
            : 'slide-up'
        }`}
        style={{
          animationDuration: '0.15s',
        }}
      >
        {user?.role === 'admin' && (
          <>
            <NavLink to={paths.settings()}>
              <div className="mt-5 flex items-center gap-x-2 text-white hover:cursor-pointer hover:text-sky-400 hover:underline">
                <ShieldCheckered size={18} weight="fill" />
                <div className="text-sm font-medium">System Settings</div>
              </div>
            </NavLink>

            <NavLink to={paths.toolsHome(organization)}>
              <div className="mt-5 flex items-center gap-x-2 text-white hover:cursor-pointer hover:text-sky-400 hover:underline">
                <Toolbox size={18} weight="bold" />
                <div className="text-sm font-medium">Tools</div>
              </div>
            </NavLink>

            <NavLink to={paths.users()}>
              <div className="mt-5 flex items-center gap-x-2 text-white hover:cursor-pointer hover:text-sky-400 hover:underline">
                <User size={18} weight="bold" />
                <div className="text-sm font-medium">Add User</div>
              </div>
            </NavLink>
          </>
        )}
        <NavLink to={paths.jobs(organization)}>
          <div className="mt-5 flex items-center gap-x-2 text-white hover:cursor-pointer hover:text-sky-400 hover:underline">
            <SpinnerGap size={18} weight="bold" />
            <div className="text-sm font-medium">Background Jobs</div>
          </div>
        </NavLink>
      </div>
    </div>
  );
}
