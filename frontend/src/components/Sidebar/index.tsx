import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import Logo from '../../images/logo/logo-light.png';
import SidebarLinkGroup from '../SidebarLinkGroup';
import paths from '../../utils/paths';
import useUser from '../../hooks/useUser';
import CreateOrganizationModal from './CreateOrganizationModal';
import OrganizationTab from './OrganizationTab';
import { SquaresFour, Plus } from '@phosphor-icons/react';

interface SidebarProps {
  organization: any;
  organizations: any[];
  workspaces: object[];
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  hasMoreWorkspaces?: boolean;
  loadMoreWorkspaces?: VoidFunction;
}

export default function Sidebar({
  organization,
  organizations,
  workspaces,
  sidebarOpen,
  setSidebarOpen,
  hasMoreWorkspaces = false,
  loadMoreWorkspaces,
}: SidebarProps) {
  const { user } = useUser();
  const { slug } = useParams();
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );

  async function continueLoadWorkspaces() {
    loadMoreWorkspaces?.();
    return true;
  }

  const sortedOrganizations = organizations.sort((a, b) => {
    if (a.slug === slug) return -1;
    if (b.slug === slug) return 1;
    return 0;
  });

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  return (
    <>
      <aside
        ref={sidebar}
        className={`max-w-72.5 absolute left-0 top-0 z-9999 flex h-screen min-w-[300px] flex-col overflow-y-hidden bg-main duration-300 ease-linear lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex">
          <NavLink
            to={paths.dashboard()}
            className="flex w-full shrink-0 justify-center"
          >
            <div className="flex w-full justify-center rounded-br-[14px] bg-main-bg">
              <img
                src={Logo}
                alt="Logo"
                className="w-full max-w-[180px] object-cover p-4"
              />
            </div>
          </NavLink>

          <button
            ref={trigger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block lg:hidden"
          >
            <svg
              color="white"
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <div className="no-scrollbar m-4 h-screen flex-grow overflow-y-auto rounded-xl border-2 border-white/20">
            <nav className="p-4 px-4 py-4 lg:px-6">
              {/* <!-- Menu Group --> */}
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex w-full items-center gap-x-1">
                    <SquaresFour
                      className="text-white/60"
                      size={20}
                      weight="bold"
                    />
                    <div className="text-xs font-medium uppercase tracking-widest text-white/60">
                      Organizations
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      document
                        .getElementById('organization-creation-modal')
                        ?.showModal();
                    }}
                  >
                    <Plus className="text-sky-400" size={17} weight="bold" />
                  </button>
                </div>

                <ul className="mb-6 flex flex-col gap-1.5">
                  {/* <!-- Menu Item Dashboard --> */}
                  <SidebarLinkGroup
                    activeCondition={
                      pathname === '/' || pathname.includes('dashboard')
                    }
                  >
                    {() => {
                      return (
                        <React.Fragment>
                          {/* <!-- Dropdown Menu Start --> */}
                          <div>
                            <ul
                              className="mb-5.5 mt-3 flex flex-col gap-3"
                              id="organization-list"
                            >
                              {sortedOrganizations.map(
                                (org: any, i: number) => {
                                  return (
                                    <OrganizationTab
                                      key={org.id}
                                      i={i}
                                      workspaces={workspaces}
                                      organization={org}
                                      hasMoreWorkspaces={hasMoreWorkspaces}
                                      loadMoreWorkspaces={loadMoreWorkspaces}
                                    />
                                  );
                                }
                              )}
                            </ul>
                          </div>
                          {/* <!-- Dropdown Menu End --> */}
                        </React.Fragment>
                      );
                    }}
                  </SidebarLinkGroup>
                  {/* <!-- Menu Item Dashboard --> */}
                </ul>
              </div>

              {/* Quick actions */}
              {/* <div>
                {!!organization && (
                  <ul className="mb-6 flex flex-col gap-1.5">
                    {user?.role === 'admin' && (
                      <>
                        <li>
                          <div
                            className={`translate transform overflow-hidden`}
                          >
                            <NavLink
                              to={paths.toolsHome(organization)}
                              className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                (pathname === '/' ||
                                  pathname.includes('all-tools')) &&
                                'bg-graydark dark:bg-meta-4'
                              }`}
                            >
                              <Package className="h-4 w-4" />
                              Tools & More
                            </NavLink>
                          </div>
                        </li>
                        <li>
                          <div
                            className={`translate transform overflow-hidden`}
                          >
                            <NavLink
                              to={paths.users()}
                              className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                (pathname === '/' ||
                                  pathname.includes('users')) &&
                                'bg-graydark dark:bg-meta-4'
                              }`}
                            >
                              <Users className="h-4 w-4" />
                              User Management
                            </NavLink>
                          </div>
                        </li>
                        <li>
                          <div
                            className={`translate transform overflow-hidden`}
                          >
                            <NavLink
                              to={paths.organizationSettings(organization)}
                              className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                (pathname === '/' ||
                                  pathname.includes(
                                    `${organization?.slug}/settings`
                                  )) &&
                                'bg-graydark dark:bg-meta-4'
                              }`}
                            >
                              <Briefcase className="h-4 w-4" />
                              Organization Settings
                            </NavLink>
                          </div>
                        </li>
                      </>
                    )}

                    {user?.role === 'admin' && (
                      <li>
                        <div className={`translate transform overflow-hidden`}>
                          <NavLink
                            to={paths.settings()}
                            className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                              (pathname === '/' ||
                                pathname.includes('system-settings')) &&
                              'bg-graydark dark:bg-meta-4'
                            }`}
                          >
                            <Tool className="h-4 w-4" />
                            System Settings
                          </NavLink>
                        </div>
                      </li>
                    )}

                    <li>
                      <div className={`translate transform overflow-hidden`}>
                        <NavLink
                          to={paths.jobs(organization)}
                          className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                            (pathname === '/' || pathname.includes('jobs')) &&
                            'bg-graydark dark:bg-meta-4'
                          }`}
                        >
                          <Radio className="h-4 w-4" />
                          Background Jobs
                        </NavLink>
                      </div>
                    </li>
                  </ul>
                )}
              </div> */}
            </nav>
          </div>

          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
      <CreateOrganizationModal />
    </>
  );
}
