import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import Logo from '../images/logo/logo.png';
import SidebarLinkGroup from './SidebarLinkGroup';
import paths from '../utils/paths';
import { Box, ChevronUp, Command, Radio, Tool, Users } from 'react-feather';
import Organization from '../models/organization';
import PreLoader from './Preloader';
import useUser from '../hooks/useUser';
import InfiniteScroll from 'react-infinite-scroll-component';

interface SidebarProps {
  organization: any;
  organizations: any[];
  workspaces: object[];
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  hasMoreWorkspaces?: boolean;
  loadMoreWorkspaces?: VoidFunction;
}

const Sidebar = ({
  organization,
  organizations,
  workspaces,
  sidebarOpen,
  setSidebarOpen,
  hasMoreWorkspaces = false,
  loadMoreWorkspaces,
}: SidebarProps) => {
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    console.log(search);

    console.log(
      await Organization.searchWorkspaces('mintplex-labs', 1, 10, search)
    );
  };

  return (
    <>
      <aside
        ref={sidebar}
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-slate-900 duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <NavLink to={paths.dashboard()}>
            <img src={Logo} alt="Logo" />
          </NavLink>

          <button
            ref={trigger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block lg:hidden"
          >
            <svg
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
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            {/* <!-- Menu Group --> */}
            <div>
              <div className="mb-4 ml-4 flex flex w-full items-center justify-between">
                <h3 className="text-sm font-semibold text-bodydark2">MENU</h3>
                <button
                  onClick={() => {
                    document
                      .getElementById('organization-creation-modal')
                      ?.showModal();
                  }}
                  type="button"
                  className="rounded-lg px-4 px-4 py-1 py-1 text-sm font-semibold text-bodydark2 hover:bg-slate-800 hover:text-slate-200"
                >
                  + New Org
                </button>
              </div>

              <ul className="mb-6 flex flex-col gap-1.5">
                {/* <!-- Menu Item Dashboard --> */}
                <SidebarLinkGroup
                  activeCondition={
                    pathname === '/' || pathname.includes('dashboard')
                  }
                >
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <NavLink
                          to="#"
                          className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                            (pathname === '/' ||
                              pathname.includes('dashboard')) &&
                            'bg-graydark dark:bg-meta-4'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            sidebarExpanded
                              ? handleClick()
                              : setSidebarExpanded(true);
                          }}
                        >
                          <Command className="h-4 w-4" />
                          Organizations
                          <ChevronUp
                            className={`absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-current ${
                              open && 'rotate-180'
                            }`}
                          />
                        </NavLink>
                        {/* <!-- Dropdown Menu Start --> */}
                        <div
                          className={`translate transform overflow-hidden ${
                            !open && 'hidden'
                          }`}
                        >
                          <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                            {organizations.map((org: any, i: number) => {
                              return (
                                <li key={i}>
                                  <NavLink
                                    key={org.uid}
                                    to={paths.organization(org)}
                                    className={({ isActive }) =>
                                      'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                      (isActive && '!text-white')
                                    }
                                  >
                                    {org.name}
                                  </NavLink>
                                </li>
                              );
                            })}
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

            {!!slug && workspaces?.length > 0 && (
              <div>
                <ul className="mb-6 flex flex-col gap-1.5">
                  {/* <!-- Menu Item Dashboard --> */}
                  <SidebarLinkGroup
                    activeCondition={pathname.includes('dashboard')}
                  >
                    {(handleClick, open) => {
                      return (
                        <React.Fragment>
                          <NavLink
                            to="#"
                            className={`group relative flex items-center gap-2.5 rounded-t-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                              (pathname === '/' ||
                                pathname.includes('dashboard')) &&
                              'bg-graydark dark:bg-meta-4'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              sidebarExpanded
                                ? handleClick()
                                : setSidebarExpanded(true);
                            }}
                          >
                            <Box className="h-4 w-4" />
                            Workspaces
                            <ChevronUp
                              className={`absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 fill-current ${
                                open && 'rotate-180'
                              }`}
                            />
                          </NavLink>
                          {/* <!-- Dropdown Menu Start --> */}
                          <div
                            className={`translate transform overflow-hidden ${
                              !open && 'hidden'
                            }`}
                          >
                            <input
                              type="text"
                              className="w-full rounded-b-sm bg-graydark px-4 py-2 text-bodydark1"
                              placeholder="Search..."
                              onChange={(e) => {
                                handleSearch(e);
                              }}
                            />
                            <ul
                              id="workspaces-sidebar"
                              className="no-scrollbar mb-5.5 mt-4 flex flex-col gap-2.5 pl-6"
                            >
                              <InfiniteScroll
                                dataLength={workspaces.length}
                                next={continueLoadWorkspaces}
                                hasMore={hasMoreWorkspaces}
                                height={200}
                                scrollableTarget="workspaces-sidebar"
                                scrollThreshold={0.8}
                                loader={
                                  <div className="ml-2 flex h-[30px] w-3/4 animate-pulse items-center justify-center rounded-sm bg-slate-800 px-4">
                                    <p className="text-xs text-slate-500 ">
                                      loading...
                                    </p>
                                  </div>
                                }
                              >
                                {workspaces?.map(
                                  (workspace: any, i: number) => {
                                    return (
                                      <li key={i}>
                                        <NavLink
                                          key={workspace.uid}
                                          to={paths.workspace(
                                            slug,
                                            workspace.slug
                                          )}
                                          className={({ isActive }) =>
                                            'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                            (isActive && '!text-white')
                                          }
                                        >
                                          {workspace.name}
                                        </NavLink>
                                      </li>
                                    );
                                  }
                                )}
                              </InfiniteScroll>
                            </ul>
                            {/* <NavLink
                              to="/api-docs"
                              target="_blank"
                              className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4`}
                            >
                              <Code className="h-4 w-4" />
                              API Documentation
                            </NavLink> */}
                          </div>
                          {/* <!-- Dropdown Menu End --> */}
                        </React.Fragment>
                      );
                    }}
                  </SidebarLinkGroup>
                  {/* <!-- Menu Item Dashboard --> */}
                </ul>
              </div>
            )}

            <div>
              {!!organization && (
                <ul className="mb-6 flex flex-col gap-1.5">
                  {user?.role === 'admin' && (
                    <li>
                      <div className={`translate transform overflow-hidden`}>
                        <NavLink
                          to={paths.users()}
                          className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                            (pathname === '/' || pathname.includes('users')) &&
                            'bg-graydark dark:bg-meta-4'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          User Management
                        </NavLink>
                      </div>
                    </li>
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
            </div>
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
      <CreateOrganizationModal />
    </>
  );
};

export default Sidebar;

const CreateOrganizationModal = () => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { organization } = await Organization.create(e.target.name.value);
    if (!organization) {
      setLoading(false);
      return false;
    }

    window.location.replace(paths.organization(organization));
  };

  return (
    <dialog id="organization-creation-modal" className="w-1/3 rounded-lg">
      <div className="w-full rounded-sm bg-white p-[20px] dark:border-strokedark dark:bg-boxdark">
        <div className="px-6.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Create a New Organization
          </h3>
        </div>
        {loading ? (
          <div className="px-6.5">
            <div className="mb-4.5 flex w-full justify-center">
              <PreLoader />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6.5">
              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  Organization Name
                </label>
                <input
                  required={true}
                  type="text"
                  name="name"
                  placeholder="My Organization"
                  autoComplete="off"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded bg-blue-500 p-3 font-medium text-white"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('organization-creation-modal')
                      ?.close();
                  }}
                  className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
              <p className="my-2 rounded-lg border border-orange-800 bg-orange-100 p-2 text-center text-sm text-orange-800">
                Once your organization exists you can start workspaces and
                documents.
                <br />
                <b>YOU CANNOT DELETE ORGANIZATIONS.</b>
              </p>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
