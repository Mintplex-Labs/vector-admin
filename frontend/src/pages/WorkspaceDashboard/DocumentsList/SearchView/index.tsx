import { SyntheticEvent, useState } from 'react';
import { ChevronDown, FileText, Search, Loader } from 'react-feather';
import { CopyDocToModal } from '..';
import truncate from 'truncate';
import moment from 'moment';
import paths from '../../../../utils/paths';
import Workspace from '../../../../models/workspace';

export type ISearchTypes = 'semantic' | 'exactText' | 'metadata' | 'vectorId';

const SEARCH_MODES = {
  exactText: {
    display: 'Fuzzy Text Search',
    placeholder: 'Find documents via a fuzzy text match on your query.',
  },
  semantic: {
    display: 'Semantic Search',
    placeholder:
      'Search with natural language finding the most similar text by meaning. Use of this search will cost OpenAI credits to embed the query.',
  },
  metadata: {
    display: 'Metadata',
    placeholder:
      'Find documents by exact key:value pair. Formatted as key:value_to_look_for',
  },
  vectorId: {
    display: 'Vector Id',
    placeholder: 'Find a document which contains a specific vector ID',
  },
};

export default function SearchView({
  organization,
  workspace,
  workspaces,
  stopSearching,
  deleteDocument,
}: {
  organization: object;
  workspace: object;
  workspaces: object[];
  stopSearching: VoidFunction;
  deleteDocument: (documentId: number) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [showSearchMethods, setShowSearchMethods] = useState(false);
  const [searchBy, setSearchBy] = useState<ISearchTypes>('exactText');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [documents, setDocuments] = useState([]);
  const clearSearch = () => {
    setSearchBy('semantic');
    setSearchTerm('');
    setDocuments([]);
    setSearching(false);
    stopSearching();
  };
  const handleSearch = async (e: SyntheticEvent<HTMLElement, SubmitEvent>) => {
    e.preventDefault();
    const formData = new FormData(e.target as any);
    const query = formData.get('query') as string;

    setSearching(true);
    setSearchTerm(query);
    const matches = await Workspace.searchDocuments(
      workspace.id,
      searchBy,
      query
    );
    setDocuments(matches);
    setSearching(false);
  };

  return (
    <div className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mx-4 mb-6 flex items-center">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative flex">
            <button
              onClick={() => setShowSearchMethods(!showSearchMethods)}
              className="z-10 inline-flex flex-shrink-0 items-center rounded-l-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700"
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
                          setDocuments([]);
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
                className="z-20 block w-full rounded-r-lg border border-l-2 border-gray-300 border-l-gray-50 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:border-l-gray-700  dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500"
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
          {documents.length > 0 ? (
            <div>
              <div className="border-b border-stroke px-4 pb-5 dark:border-strokedark md:px-6 xl:px-7.5">
                <div className="flex items-center gap-3">
                  <div className="w-2/12 xl:w-3/12">
                    <span className="font-medium">Document Name</span>
                  </div>
                  <div className="w-6/12 2xsm:w-5/12 md:w-3/12">
                    <span className="font-medium">Workspace</span>
                  </div>
                  <div className="hidden w-4/12 md:block xl:w-3/12">
                    <span className="font-medium">Created</span>
                  </div>
                  <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                    <span className="font-medium">Status</span>
                  </div>
                  <div className="hidden w-2/12 text-center 2xsm:block md:w-1/12">
                    <span className="font-medium"></span>
                  </div>
                </div>
              </div>
              <>
                {documents.map((document) => {
                  return (
                    <div
                      id={`document-row-${document.id}`}
                      key={document.id}
                      className="flex w-full items-center gap-5 px-7.5 py-3 text-gray-600 hover:bg-gray-3 dark:hover:bg-meta-4"
                    >
                      <div className="flex w-full items-center gap-3">
                        <div className="w-2/12 xl:w-3/12">
                          <div className="flex items-center gap-x-1">
                            <FileText className="h-4 w-4" />
                            <span className="hidden font-medium xl:block">
                              {truncate(document.name, 20)}
                            </span>
                          </div>
                        </div>
                        <div className="w-6/12 2xsm:w-5/12 md:w-3/12">
                          <span className="font-medium">
                            {workspace.name || ''}
                          </span>
                        </div>
                        <div className="hidden w-3/12 overflow-x-scroll md:block xl:w-3/12">
                          <span className="font-medium">
                            {moment.unix(document.createdAt).format('lll')}
                          </span>
                        </div>
                        <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                          <span className="inline-block rounded bg-green-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-green-500">
                            Cached
                          </span>
                        </div>

                        <div className=" flex items-center gap-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              window.document
                                .getElementById(
                                  `copy-document-${document.id}-modal`
                                )
                                ?.showModal()
                            }
                            className="rounded-lg px-2 py-1 text-gray-400 transition-all duration-300 hover:bg-gray-50 hover:text-gray-600"
                          >
                            Clone
                          </button>
                          <a
                            href={paths.document(
                              organization.slug,
                              workspace.slug,
                              document.id
                            )}
                            className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                          >
                            Details
                          </a>
                          <button
                            type="button"
                            onClick={() => deleteDocument(document.id)}
                            className="rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <CopyDocToModal
                        key={`copy-document-${document.id}`}
                        document={document}
                        workspace={workspace}
                        workspaces={workspaces}
                      />
                    </div>
                  );
                })}
              </>
            </div>
          ) : (
            <>
              <div>
                <div className="flex min-h-[40vh] w-full px-8">
                  <div className="flex flex h-auto w-full flex-col items-center justify-center gap-y-2 rounded-lg bg-slate-50">
                    {!!searchTerm ? (
                      <p className="text-sm">
                        No results on {SEARCH_MODES[searchBy].display} for{' '}
                        <code className="bg-gray-200 px-2">"{searchTerm}"</code>
                      </p>
                    ) : (
                      <p className="text-sm">
                        Type in a query to search for a document
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
  );
}
