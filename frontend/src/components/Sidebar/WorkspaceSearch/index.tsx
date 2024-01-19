import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import paths from '@/utils/paths';
import Organization from '@/models/organization';
import { debounce } from 'lodash';
import truncate from 'truncate';

interface IWorkspaceItem {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  slug: string;
}

interface IWorkspaceSearchProps {
  RenderComponent: React.FC<IWorkspaceItem>;
  maxContainerHeight?: number;
  searchInputClassName?: string;
  waitingContainerClassName?: string;
  canSearch?: boolean;
  children: React.ReactNode;
}

export default function WorkspaceSearch({
  RenderComponent,
  canSearch = false,
  maxContainerHeight,
  searchInputClassName,
  waitingContainerClassName,
  children,
}: IWorkspaceSearchProps) {
  const { slug } = useParams();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSearch = async (e: any) => {
    if (!slug) return null;
    const searchTerm = e.target?.value;
    if (searchTerm !== '') {
      setIsTyping(true);
      setSearching(true);

      const { workspacesResults = [] } = await Organization.searchWorkspaces(
        slug,
        1, // Page 1
        30, // 30 results per page
        searchTerm
      );
      setResults(workspacesResults);
      setIsTyping(false);
    } else {
      setIsTyping(false);
      setSearching(false);
    }
  };

  if (!slug) return null;
  const debouncedSearch = debounce(handleSearch, 500);
  return (
    <div
      id="workspaces-sidebar"
      className={`no-scrollbar mb-5.5 mt-2 flex ${
        maxContainerHeight ? `max-h-[${maxContainerHeight}px]` : `h-auto`
      }  flex-col gap-1 overflow-auto`}
    >
      <input
        type="search"
        hidden={!canSearch}
        className={
          searchInputClassName ||
          'dark-search w-full rounded-md border border-graydark bg-transparent px-4 py-2 text-sm text-bodydark1 outline-none'
        }
        placeholder="Search for workspace"
        onChange={debouncedSearch}
        // @ts-ignore: Onsearch does not exist, it does.
        onSearch={debouncedSearch}
      />
      {searching ? (
        <>
          {isTyping ? (
            <div
              className={
                waitingContainerClassName ||
                'flex w-full animate-pulse items-center justify-center rounded-sm bg-slate-800 text-xs text-slate-500'
              }
            >
              <p className="p-1 ">Loading...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="pl-6">
              {results.map((workspace: IWorkspaceItem['workspace']) => (
                <RenderComponent
                  key={workspace.id}
                  workspace={workspace}
                  slug={slug}
                />
              ))}
            </div>
          ) : (
            <div
              className={
                waitingContainerClassName ||
                'flex h-20 w-full items-center justify-center rounded-sm bg-slate-800 text-xs text-slate-500 '
              }
            >
              <p className="p-1">No results found.</p>
            </div>
          )}
        </>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}

export function WorkspaceItem({ workspace, slug }: IWorkspaceItem) {
  return (
    <li>
      <NavLink
        key={workspace.id}
        to={paths.workspace(slug, workspace.slug)}
        className={({ isActive }) =>
          'group relative flex items-center gap-1 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
          (isActive && '!text-white')
        }
      >
        {truncate(workspace.name, 10)}
      </NavLink>
    </li>
  );
}
