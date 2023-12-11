import {
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useRef,
  useState,
} from 'react';
import { Loader } from 'react-feather';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';
import Document from '../../../../models/document';
import { set } from 'lodash';

export type ISearchTypes = 'semantic' | 'exactText' | 'metadata' | 'vectorId';

const SEARCH_MODES = {
  exactText: {
    display: 'Fuzzy Text Search',
    placeholder: 'Find embedding via a fuzzy text match on your query.',
  },
  semantic: {
    display: 'Semantic Search',
    placeholder:
      'Search with natural language finding the most similar embedding by meaning. Use of this search will cost OpenAI credits to embed the query.',
  },
  metadata: {
    display: 'Metadata',
    placeholder:
      'Find embedding by exact key:value pair. Formatted as key:value_to_look_for',
  },
  vectorId: {
    display: 'Vector Id',
    placeholder: 'Find by a specific vector ID',
  },
};

export default function SearchView({
  searchMode,
  setSearchMode,
  document,
  FragmentItem,
  canEdit,
  setSearchFragments,
  setSearching,
  searching,
  searchBy,
  setSearchBy,
  searchTerm,
  setSearchTerm,
}: {
  searchMode: boolean;
  document: object;
  setSearchMode: Dispatch<SetStateAction<boolean>>;
  FragmentItem: (props: any) => JSX.Element;
  canEdit: boolean;
  setSearchFragments: Dispatch<SetStateAction<[]>>;
  setSearching: Dispatch<SetStateAction<boolean>>;
  searching: boolean;
  searchBy: ISearchTypes;
  setSearchBy: Dispatch<SetStateAction<ISearchTypes>>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
}) {
  const formEl = useRef<HTMLFormElement>(null);
  const [showSearchMethods, setShowSearchMethods] = useState(false);
  const [sourceDoc, setSourceDoc] = useState(null);

  const clearSearch = (e: SyntheticEvent<HTMLElement, SubmitEvent>) => {
    e.preventDefault();
    setSearchBy('exactText');
    setSearching(false);
    setSearchMode(false);
    setSourceDoc(null);
    (formEl.current as HTMLFormElement).reset();
  };
  const handleSearch = async (e: SyntheticEvent<HTMLElement, SubmitEvent>) => {
    e.preventDefault();
    setSearchMode(true);
    const formData = new FormData(e.target as any);
    const query = formData.get('query') as string;

    setSearching(true);
    setSearchTerm(query);

    const matches = await Document.searchEmbeddings(
      document.id,
      searchBy,
      query
    );

    const vectorIds = matches.map((fragment) => fragment.vectorId);
    const metadataForIds = await Document.metadatas(document.id, vectorIds);
    setSourceDoc(metadataForIds);
    setSearchFragments(matches);
    setSearching(false);
  };

  return (
    <>
      <div className="w-full flex-1">
        <div className="flex items-center">
          <form ref={formEl} onSubmit={handleSearch} className="w-full">
            <div className="relative flex">
              <button
                onClick={() => setShowSearchMethods(!showSearchMethods)}
                className="z-10 inline-flex h-9 flex-shrink-0 items-center rounded-[100px] bg-zinc-700 px-5 text-center text-sm font-medium text-white transition-all duration-300 hover:bg-zinc-800 focus:outline-none"
                type="button"
              >
                {SEARCH_MODES[searchBy].display}
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
                  className="z-20 -ml-4 block h-9 w-full rounded-r-[100px] bg-main-2 pl-8 text-sm text-white focus:outline-none"
                  placeholder={SEARCH_MODES[searchBy].placeholder}
                  required
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute right-0 top-0 mr-4.5 flex h-full p-2.5 text-sm font-medium text-white focus:outline-none"
                >
                  {searching ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                  ) : searchMode ? (
                    <button onClick={clearSearch}>
                      <X
                        size={16}
                        className="text-sky-400 transition-all duration-300 hover:text-sky-700"
                        weight="bold"
                      />
                    </button>
                  ) : (
                    <MagnifyingGlass
                      className="text-sky-400 transition-all duration-300 hover:text-sky-700"
                      size={18}
                      weight="bold"
                    />
                  )}
                  <span className="sr-only">Search</span>
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.document
                    ?.getElementById('upload-document-modal')
                    ?.showModal();
                }}
                className="flex w-18 items-center justify-center rounded-[100px] bg-sky-400 px-2.5 text-xs"
              >
                <div className="font-bold uppercase text-black">Upload</div>
              </button>
            </div>
          </form>
        </div>

        {/* <div hidden={!searchMode} className="h-auto w-auto">
          {searching ? (
            <div>
              <div className="flex min-h-[40vh] w-full px-8">
                <div className="flex flex h-auto w-full flex-col items-center justify-center gap-y-2 rounded-lg bg-slate-50">
                  <Loader size={15} className="animate-spin rounded-sm" />
                  <p className="text-sm">
                    Running {SEARCH_MODES[searchBy].display} for{' '}
                    <code className="bg-gray-200 px-2">"{searchTerm}"</code>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {fragments.length > 0 ? (
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Vector DB Id
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Text Chunk
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fragments.map((fragment) => {
                      return (
                        <FragmentItem
                          key={fragment.id}
                          fragment={fragment}
                          sourceDoc={sourceDoc}
                          canEdit={canEdit}
                        />
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <>
                  <div>
                    <div className="flex min-h-[40vh] w-full px-8">
                      <div className="flex flex h-auto w-full flex-col items-center justify-center gap-y-2 rounded-lg bg-slate-50">
                        {!!searchTerm ? (
                          <p className="text-sm">
                            No results on {SEARCH_MODES[searchBy].display} for{' '}
                            <code className="bg-gray-200 px-2">
                              "{searchTerm}"
                            </code>
                          </p>
                        ) : (
                          <p className="text-sm">
                            Type in a query to search for an embedding
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div> */}
      </div>

      {/* {canUpload ? (
        <UploadDocumentModal workspaces={workspaces} />
      ) : (
        <UploadModalNoKey />
      )} */}
    </>
  );
}
