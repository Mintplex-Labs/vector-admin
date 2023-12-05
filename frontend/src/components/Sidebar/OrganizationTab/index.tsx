import { NavLink, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import paths from '../../../utils/paths';
import {
  CaretDown,
  SquaresFour,
  Plus,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import truncate from 'truncate';
import Organization from '../../../models/organization';
import { debounce } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';

type OrganizationTabProps = {
  organization: any;
  i: number;
  workspaces: any;
  hasMoreWorkspaces: boolean;
  loadMoreWorkspaces: VoidFunction;
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
  const [isActive, setIsActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { slug } = useParams();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const renderWorkspaceItem = (workspace: any) => (
    <WorkspaceItem key={workspace.id} workspace={workspace} slug={slug} />
  );

  const loadMoreWorkspacesAndScrollToBottom = async () => {
    loadMoreWorkspaces();
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
          return `group relative flex items-center justify-between rounded-lg border border-transparent bg-main-2 px-4 py-3 font-medium text-white duration-300 ease-in-out hover:border-sky-400 hover:text-white ${
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
      {isActive && menuOpen && (
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
            <div className="mt-2">
              {searchResults.map((workspace, idx) => (
                <WorkspaceItem key={idx} workspace={workspace} slug={slug} />
              ))}
            </div>
          ) : searchTerm === '' ? (
            <div className="mt-2">
              <InfiniteScroll
                dataLength={
                  isSearching ? searchResults.length : workspaces.length
                }
                scrollableTarget="organization-list"
                height={200}
                next={loadMoreWorkspacesAndScrollToBottom}
                hasMore={hasMoreWorkspaces}
                loader={<LoadingWorkspaceItem />}
              >
                {isSearching
                  ? searchResults.map(renderWorkspaceItem)
                  : workspaces.map(renderWorkspaceItem)}
              </InfiniteScroll>
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex w-full items-center justify-center rounded-sm text-xs text-white/60">
                <p className="p-1">No results found.</p>
              </div>
            </div>
          )}
        </>
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
