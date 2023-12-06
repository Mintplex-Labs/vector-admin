import {
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Search, Loader } from 'react-feather';
import Document from '../../../../models/document';

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
}: {
  searchMode: boolean;
  document: object;
  setSearchMode: Dispatch<SetStateAction<boolean>>;
  FragmentItem: (props: any) => JSX.Element;
  canEdit: boolean;
}) {
  const formEl = useRef<HTMLFormElement>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchMethods, setShowSearchMethods] = useState(false);
  const [searchBy, setSearchBy] = useState<ISearchTypes>('exactText');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fragments, setFragments] = useState([]);
  const [sourceDoc, setSourceDoc] = useState(null);

  const clearSearch = () => {
    setSearchBy('exactText');
    setSearchTerm('');
    setFragments([]);
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
    setFragments(matches);
    setSearching(false);
  };

  return (
    <div className="w-full flex-1 rounded-sm py-6">
      <div className="flex items-center">
        <form ref={formEl} onSubmit={handleSearch} className="w-full">
          <div className="relative flex">
            <button
              onClick={() => setShowSearchMethods(!showSearchMethods)}
              className="z-10 inline-flex h-9 flex-shrink-0 items-center rounded-[100px] bg-zinc-700 px-5 text-center text-sm font-medium text-white hover:bg-opacity-60 focus:outline-none"
              type="button"
            >
              {SEARCH_MODES[searchBy].display}
              <ChevronDown size={18} />
            </button>
            <div
              hidden={!showSearchMethods}
              className="absolute left-0 top-12 z-99 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
            >
              <ul
                className="py-2 text-sm text-gray-700 dark:text-gray-200"
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
                          setFragments([]);
                        }}
                        type="button"
                        className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
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
                type="search"
                name="query"
                className="z-20 block w-full rounded-[100px] bg-main-2 p-2.5 text-sm"
                placeholder={SEARCH_MODES[searchBy].placeholder}
                required
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-0 top-0 h-full rounded-r-lg border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {searching ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                <span className="sr-only">Search</span>
              </button>
            </div>
            <button
              onClick={clearSearch}
              type="button"
              className="ml-2 flex items-center rounded-lg px-4 py-2 text-center text-black hover:bg-gray-200"
            >
              X
            </button>
          </div>
        </form>
      </div>

      <div hidden={!searchMode} className="h-auto w-auto">
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
      </div>
    </div>
  );
}
