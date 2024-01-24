import { SyntheticEvent, useRef, useState } from 'react';
import Workspace from '@/models/workspace';
import { SEARCH_MODES, ISearchTypes } from '@/utils/constants';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';

export default function SearchView({
  workspace,
  stopSearching,
  searchMode,
  setSearchMode,
  handleSearchResults,
  setLoading,
}: {
  organization: object;
  workspace: object;
  stopSearching: VoidFunction;
  searchMode: boolean;
  setSearchMode: (searchMode: boolean) => void;
  handleSearchResults: (results: any) => void;
  setLoading: (loading: boolean) => void;
}) {
  const formEl = useRef<HTMLFormElement>(null);
  const [showSearchMethods, setShowSearchMethods] = useState(false);
  const [searchBy, setSearchBy] = useState<ISearchTypes>('exactText');
  const clearSearch = () => {
    setSearchBy('exactText');
    stopSearching();
    (formEl.current as HTMLFormElement).reset();
  };
  const handleSearch = async (e: SyntheticEvent<HTMLElement, SubmitEvent>) => {
    e.preventDefault();
    setSearchMode(true);
    setLoading(true);
    const formData = new FormData(e.target as any);
    const query = formData.get('query') as string;

    const matches = await Workspace.searchDocuments(
      workspace.id,
      searchBy,
      query
    );

    setLoading(false);
    handleSearchResults(matches);
  };

  return (
    <div className="relative -mt-6 ml-6 flex w-full items-center">
      <form ref={formEl} onSubmit={handleSearch} className="flex w-full flex-1">
        <div className="flex w-full">
          <button
            onClick={() => setShowSearchMethods(!showSearchMethods)}
            className="z-10 inline-flex h-9 flex-shrink-0 items-center rounded-[100px] bg-zinc-700 px-5 text-center text-sm font-medium text-white transition-all duration-300 hover:bg-zinc-800 focus:outline-none"
            type="button"
          >
            {SEARCH_MODES['exactText'].display}
            <div
              className={`ml-2 transition-all duration-300 ${
                showSearchMethods ? '' : 'rotate-180'
              }`}
            >
              <CaretDown size={16} weight="bold" />
            </div>
          </button>
          <div
            className={`absolute left-0 top-12 z-99 w-44 divide-y divide-gray-100 rounded-lg bg-zinc-700 shadow ${
              showSearchMethods ? 'slide-down' : 'slide-up'
            }`}
            style={{
              animationDuration: '0.15s',
            }}
          >
            <ul
              className="py-2 text-sm text-white"
              aria-labelledby="dropdown-button"
            >
              {Object.keys(SEARCH_MODES).map((_key, i) => {
                const method = _key as ISearchTypes;
                return (
                  <li key={i}>
                    <button
                      onClick={() => {
                        setSearchBy(method);
                        setShowSearchMethods(false);
                        setSearchMode(false);
                      }}
                      type="button"
                      className="inline-flex w-full px-4 py-2  hover:bg-zinc-800"
                    >
                      {SEARCH_MODES[method].display}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="relative w-full">
            <input
              name="query"
              placeholder={SEARCH_MODES[searchBy].placeholder}
              className=" z-20 -ml-4 block h-9 w-full rounded-r-[100px] bg-main-2 pl-8 text-sm text-white focus:outline-none"
              required
            />
            {false ? (
              <div className="absolute right-0 top-0 mr-4.5 flex h-full p-2.5 text-sm font-medium text-white focus:outline-none">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              </div>
            ) : searchMode ? (
              <button
                onClick={clearSearch}
                className="absolute right-0 top-0 mr-4.5 flex h-full items-center justify-center p-2.5 text-sm font-medium text-white focus:outline-none"
              >
                <X
                  size={16}
                  className="text-sky-400 transition-all duration-300 hover:text-sky-700"
                  weight="bold"
                />
              </button>
            ) : (
              <button
                type="submit"
                className="absolute -right-1 top-0 mr-4.5 flex h-full items-center justify-center rounded-r-[100px] bg-[#303237] p-2.5 text-sm font-medium text-white focus:outline-none"
              >
                <MagnifyingGlass
                  className="text-sky-400 transition-all duration-300 hover:text-sky-700"
                  size={18}
                  weight="bold"
                />
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              window.document
                ?.getElementById('upload-document-modal')
                ?.showModal();
            }}
            className="ml-2 flex w-18 items-center justify-center rounded-[100px] bg-sky-400 px-2.5 text-xs"
          >
            <div className="font-bold uppercase text-black">Upload</div>
          </button>
        </div>
      </form>
    </div>
  );
}
