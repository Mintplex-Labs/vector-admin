import { NavLink, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import paths from '../../../utils/paths';
import { CaretDown, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import truncate from 'truncate';
import Organization from '../../../models/organization';
import { debounce } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import CreateWorkspaceModal from '../../../pages/Dashboard/WorkspacesList/CreateWorkspaceModal';

type OrganizationTabProps = {
  organization: any;
  i: number;
  workspaces: any;
  hasMoreWorkspaces: boolean;
  loadMoreWorkspaces?: VoidFunction;
};

const debouncedSearch = debounce(
  async (searchTerm, setResults, setIsSearching, slug) => {
    if (!slug) return;
    setIsSearching(true);

    const { workspacesResults = [] } = await Organization.searchWorkspaces(
      slug,
      1, // Page 1
      30, // 30 results per page
      searchTerm
    );

    setResults(workspacesResults);
    setIsSearching(false);
  },
  500
);

export default function OrganizationTab({
  organization,
  workspaces,
  i,
  hasMoreWorkspaces,
  loadMoreWorkspaces,
}: OrganizationTabProps) {
  const { slug } = useParams();
  const [isActive, setIsActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const renderWorkspaceItem = (workspace: any) => (
    <WorkspaceItem key={workspace.id} workspace={workspace} slug={slug} />
  );

  const loadMoreWorkspacesAndScrollToBottom = async () => {
    loadMoreWorkspaces?.();
    const organizationList = document.getElementById('organization-list');
    if (organizationList) {
      organizationList.scrollTop = organizationList.scrollHeight;
    }
  };

  useEffect(() => {
    if (searchTerm !== '') {
      setIsSearching(true);
      debouncedSearch(searchTerm, setSearchResults, setIsSearching, slug);
    } else {
      setSearchResults(workspaces);
      setIsSearching(false);
    }
  }, [searchTerm, slug]);

  return (
    <li key={i}>
      <NavLink
        key={organization.id}
        reloadDocument={!isActive}
        to={paths.organization(organization)}
        className={({ isActive: active }) => {
          setIsActive(active);
          return `group relative flex w-full items-center justify-between rounded-lg border border-transparent bg-main-2 px-4 py-3 font-medium text-white duration-300 ease-in-out hover:border-sky-400 hover:text-white ${
            active ? 'border-sky-400 !text-white' : ''
          }`;
        }}
      >
        <div className="flex w-full flex-col" onClick={toggleMenu}>
          <div className="flex w-full items-center justify-between">
            <div className={`${isActive ? 'text-sky-400' : 'text-white/60'}`}>
              {truncate(organization.name, 19)}
            </div>
            <div
              className={`transition-all duration-300 ${
                isActive && menuOpen ? 'text-sky-400' : 'rotate-180 '
              }`}
            >
              <CaretDown weight="bold" />
            </div>
          </div>
        </div>
      </NavLink>
      {isActive && (
        <div
          className={`${
            menuOpen
              ? 'slide-down mb-4 mt-4 transition-all duration-300'
              : 'slide-up'
          }`}
          style={{
            animationDuration: '0.15s',
          }}
        >
          <div className="mb-3.5 flex items-center justify-between px-3">
            <div className="flex w-full items-center gap-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M7.20098 8.16845H13.601C14.0426 8.16845 14.401 8.52685 14.401 8.96845C14.401 9.41005 14.0426 9.76845 13.601 9.76845H7.20098C6.75938 9.76845 6.40098 9.41005 6.40098 8.96845C6.40098 8.52685 6.75938 8.16845 7.20098 8.16845ZM7.20098 2.56845H13.601C14.0426 2.56845 14.401 2.92685 14.401 3.36845C14.401 3.81005 14.0426 4.16845 13.601 4.16845H7.20098C6.75938 4.16845 6.40098 3.81005 6.40098 3.36845C6.40098 2.92685 6.75938 2.56845 7.20098 2.56845ZM4.80098 4.16845C4.80098 5.05245 5.51698 5.76845 6.40098 5.76845H14.401C15.285 5.76845 16.001 5.05245 16.001 4.16845V2.56845C16.001 1.68445 15.285 0.96845 14.401 0.96845H6.40098C5.51698 0.96845 4.80098 1.68445 4.80098 2.56845H1.60098L1.60098 0.854024H0.000976562V8.16767C0.000976562 9.05167 0.717782 9.76845 1.60178 9.76845H1.77617H4.80098C4.80098 10.6525 5.51698 11.3685 6.40098 11.3685H14.401C15.285 11.3685 16.001 10.6525 16.001 9.76845V8.16845C16.001 7.28445 15.285 6.56845 14.401 6.56845H6.40098C5.51698 6.56845 4.80098 7.28445 4.80098 8.16845H2.39778C1.95778 8.16845 1.60098 7.81158 1.60098 7.37158V4.16845H4.80098Z"
                  fill="#A8A9AB"
                />
              </svg>
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
              <Plus className="text-sky-400" size={17} weight="bold" />
            </button>
          </div>
          <div className="mx-3 flex items-center rounded-full bg-main-2 p-2">
            <MagnifyingGlass
              className="mx-1 h-4 w-4 text-white/60"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-transparent text-sm text-white/60 placeholder-white/60 focus:outline-none"
            />
          </div>

          {isSearching ? (
            <LoadingWorkspaceItem />
          ) : searchTerm !== '' && searchResults.length > 0 ? (
            <div className="mt-2 max-h-[150px] overflow-y-auto">
              {searchResults.map((workspace, idx) => (
                <WorkspaceItem key={idx} workspace={workspace} slug={slug} />
              ))}
            </div>
          ) : searchTerm !== '' && searchResults.length === 0 ? (
            <div className="mt-2">
              <div className="flex w-full items-center justify-center rounded-sm text-xs text-white/60">
                <p className="p-1">No results found.</p>
              </div>
            </div>
          ) : workspaces.length > 0 ? (
            <div className="mt-2">
              <InfiniteScroll
                dataLength={workspaces.length}
                scrollableTarget="organization-list"
                height={workspaces.length > 5 ? 150 : workspaces.length * 30}
                next={loadMoreWorkspacesAndScrollToBottom}
                hasMore={hasMoreWorkspaces}
                loader={<LoadingWorkspaceItem />}
              >
                {workspaces.map(renderWorkspaceItem)}
              </InfiniteScroll>
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex w-48 items-center justify-center rounded-sm text-xs text-white/60">
                <p className="p-1">
                  No workspaces,{' '}
                  <button
                    onClick={() => {
                      document
                        .getElementById('workspace-creation-modal')
                        ?.showModal();
                    }}
                    className="italic underline hover:cursor-pointer"
                  >
                    create
                  </button>
                  .
                </p>
              </div>
            </div>
          )}
          <CreateWorkspaceModal organization={organization} />
        </div>
      )}
    </li>
  );
}

function WorkspaceItem({ workspace, slug }: any) {
  return (
    <li className="mx-5 mt-1">
      <NavLink
        to={paths.workspace(slug, workspace.slug)}
        className={({ isActive }) => {
          return `text-sm font-normal leading-tight text-sky-400 hover:cursor-pointer hover:text-sky-400 hover:underline ${
            isActive ? 'text-sky-400' : 'text-white/60'
          }`;
        }}
      >
        {truncate(workspace.name, 24)}
      </NavLink>
    </li>
  );
}

function LoadingWorkspaceItem() {
  return (
    <div className="mt-2">
      <div className="flex w-full animate-pulse items-center justify-center rounded-sm text-xs text-white/60">
        <p className="p-1">Loading...</p>
      </div>
    </div>
  );
}
