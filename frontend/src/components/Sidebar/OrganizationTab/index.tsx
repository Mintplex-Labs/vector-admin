import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import paths from '../../../utils/paths';
import {
  CaretDown,
  SquaresFour,
  Plus,
  MagnifyingGlass,
} from '@phosphor-icons/react';

type OrganizationTabProps = {
  organization: any;
  i: number;
};

export default function OrganizationTab({
  organization,
  workspaces,
  i,
}: OrganizationTabProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <li key={i}>
      <NavLink
        key={organization.id}
        reloadDocument={true}
        to={paths.organization(organization)}
        className={({ isActive: active }) => {
          setIsActive(active);
          return `group relative flex items-center justify-between rounded-lg bg-main-2 px-4 py-3 font-medium text-white duration-300 ease-in-out hover:text-white ${
            active ? '!text-white' : ''
          }`;
        }}
      >
        <div className="flex w-full flex-col">
          <div className="flex w-full items-center justify-between">
            <div>{organization.name}</div>
            <div
              className={`transition-all duration-300 ${
                isActive ? '' : 'rotate-180'
              }`}
            >
              <CaretDown weight="bold" />
            </div>
          </div>
        </div>
      </NavLink>
      {isActive && (
        <>
          <div className="mb-3.5 mt-4 flex items-center justify-between px-3">
            <div className="flex w-full items-center gap-x-1">
              <SquaresFour className="h-4 w-4 text-white/60" />
              <div className="text-xs font-medium uppercase tracking-widest text-white/60">
                Workspaces
              </div>
            </div>
            <button
              onClick={() => {
                document
                  .getElementById('workspace-creation-modal')
                  ?.showModal();
              }}
            >
              <Plus className="h-4 w-4 text-sky-400" weight="regular" />
            </button>
          </div>
          <div className="mx-3 rounded-full bg-main-2 p-2">
            <MagnifyingGlass className="ml-1 h-4 w-4 text-white/60" />
          </div>

          {/* Render workspaces here */}
          <div className="mx-3">
            <div className="mt-3 text-sm font-normal leading-tight text-white hover:cursor-pointer hover:underline">
              Workspace 1
            </div>
            <div className="mt-3 text-sm font-normal leading-tight text-white hover:cursor-pointer hover:underline">
              Workspace 2
            </div>
            <div className="mt-3 text-sm font-normal leading-tight text-white hover:cursor-pointer hover:underline">
              Workspace 3
            </div>
          </div>
        </>
      )}
    </li>
  );
}
