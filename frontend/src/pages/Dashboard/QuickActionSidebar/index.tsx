import {
  CaretDown,
  Key,
  MagnifyingGlass,
  Plus,
  SpinnerGap,
  Toolbox,
  User,
} from '@phosphor-icons/react';
import CreateWorkspaceModal from '../WorkspacesList/CreateWorkspaceModal';
import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import paths from '../../../utils/paths';
import truncate from 'truncate';
import InfiniteScroll from 'react-infinite-scroll-component';
import { debounce } from 'lodash';
import Organization from '../../../models/organization';
import useUser from '../../../hooks/useUser';

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

export default function QuickActionsSidebar({
  knownConnector,
  organization,
  workspaces,
  totalWorkspaces = 0,
  loadMoreWorkspaces,
  hasMoreWorkspaces,
}: {
  knownConnector: any;
  organization: any;
  workspaces: any[];
  totalWorkspaces?: number;
  loadMoreWorkspaces?: VoidFunction;
  hasMoreWorkspaces: boolean;
}) {
  const { slug } = useParams();
  const { user } = useUser();
  const [quickActionsOpen, setQuickActionsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

            <NavLink to={paths.settings()}>
              <div className="mt-5 flex items-center gap-x-2 text-white hover:cursor-pointer hover:text-sky-400 hover:underline">
                <Key size={18} weight="bold" />
                <div className="text-sm font-medium">OpenAI Key</div>
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

      <div
        className="mb-4 mt-8"
        style={{
          animationDuration: '0.15s',
        }}
      >
        <div className="mb-3.5 flex items-center justify-between">
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
                fill="rgb(56 189 248)"
              />
            </svg>
            <div className="text-xs font-medium uppercase tracking-widest text-sky-400">
              Workspaces
            </div>
          </div>
          <button
            onClick={() => {
              document.getElementById('workspace-creation-modal')?.showModal();
            }}
          >
            <Plus className="text-sky-400" size={17} weight="bold" />
          </button>
        </div>
        <div className="flex items-center rounded-full bg-main-2 p-2">
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
          <div className="mt-2 max-h-[180px] overflow-y-auto">
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
              height={workspaces.length > 5 ? 180 : workspaces.length * 50}
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
    </div>
  );
}

function WorkspaceItem({ workspace, slug }: any) {
  return (
    <div className="mt-2">
      <NavLink
        to={paths.workspace(slug, workspace.slug)}
        className="inline-flex h-9 w-full items-center justify-start gap-3.5 rounded-lg border border-sky-400 p-2.5"
      >
        <div className="h-[22.43px] w-24 whitespace-nowrap font-['Satoshi'] text-base font-medium leading-snug text-sky-400">
          {truncate(workspace.name, 15)}
        </div>
      </NavLink>
    </div>
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
