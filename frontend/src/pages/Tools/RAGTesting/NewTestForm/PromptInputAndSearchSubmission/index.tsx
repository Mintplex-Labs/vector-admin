import { useState, useEffect, Fragment } from 'react';
import paths from '@/utils/paths';
import Tools from '@/models/tools';
import { debounce } from 'lodash';
import { IOrganization } from '@/models/organization';

export default function PromptInputAndSearchSubmission({
  organization,
  formData,
}: {
  organization: IOrganization;
  formData: FormData | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState({
    input: null,
    type: null,
  });

  const handleInput = async (e: any) => {
    setError(null);

    const promptInput = e.target?.value;
    if (stringIsArray(promptInput)) {
      try {
        const isAllNumerical = JSON.parse(promptInput).every(
          (i: any) => typeof i === 'number'
        );
        if (!isAllNumerical)
          setError(
            'This vector is invalid. All items in array must be numbers.'
          );
        setPrompt({
          input: JSON.parse(promptInput),
          type: 'vector',
        });
      } catch {
        setError('This vector is invalid. Not a valid array.');
        setPrompt({
          input: null,
          type: null,
        });
      }
    } else {
      setPrompt({
        input: promptInput,
        type: 'text',
      });
    }
  };

  const debouncedInput = debounce(handleInput, 500);
  return (
    <>
      <div className="sm:col-span-2">
        <div className="mb-2 w-full ">
          <label className="block text-sm font-medium text-white">
            Using this prompt or vector
          </label>
          <p className="text-sm text-white/60">
            Enter a text prompt or vector directly that will be used for
            similarity searching.
            <br />
            If using a text prompt you must have an embedding model & API key
            set in{' '}
            <a
              href={paths.settings()}
              className="font-semibold text-blue-600 underline"
            >
              Organization settings.
            </a>
          </p>
        </div>
        <input name="promptType" value={prompt.type} type="hidden" />
        <textarea
          name="prompt"
          required={true}
          onChange={debouncedInput}
          rows={8}
          className="mt-2 block w-full rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none"
          placeholder="ex: 'What is VectorAdmin?' or [0.2,0.81,0.89,...,0.05,0.93,0.91,0.17]"
        ></textarea>
        {!!error && (
          <p className="my-2 w-fit rounded-full bg-red-100 px-4 py-1 text-xs text-red-800">
            Error: {error}
          </p>
        )}
      </div>
      <CurrentSimilaritySearch
        organization={organization}
        prompt={prompt}
        formData={formData}
      />
    </>
  );
}

function CurrentSimilaritySearch({ organization, prompt, formData }) {
  const workspaceId = formData?.get('workspaceId') || null;
  const workspaceName = formData?.get('workspaceName') || null;
  const topK = formData?.get('topK') || 3;
  const [loading, setLoading] = useState(true);
  const [similarEmbeddings, setSimilarEmbeddings] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function searchForSimilarity() {
      setError(null);
      if (!prompt.input || !workspaceId) return;

      setLoading(true);
      const { results, error } = await Tools.workspaceSimilaritySearch(
        organization.slug,
        prompt.input,
        prompt.type,
        Number(workspaceId),
        Number(topK)
      );
      setSimilarEmbeddings(results);
      setError(error);
      setLoading(false);
    }
    searchForSimilarity();
  }, [prompt, formData]);

  if (!formData || !prompt.input || !workspaceId) return null;
  if (loading) {
    return (
      <div className="flex w-full animate-pulse items-center justify-center rounded-lg bg-gray-100 p-2">
        <p className="animate-none text-gray-600">
          Finding top {topK} similar embeddings for {workspaceName}.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg bg-red-100 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (similarEmbeddings.length === 0) {
    <div className="rounded-lgflex w-full items-center justify-center bg-gray-100 p-4">
      <p className="text-gray-600">
        Could not find any similar embeddings in {workspaceName}.
      </p>
    </div>;
  }

  return (
    <div className="flex w-full flex-col">
      <p className="mb-4 mt-8 text-sm text-white/60">
        If these results look okay to you - click "Create test" to save this
        test.
      </p>
      <div className="flex flex-col gap-y-2">
        {similarEmbeddings.map((embedding, i) => {
          return (
            <Fragment key={i}>
              <input
                name={`embeddings_${i}`}
                value={JSON.stringify(embedding)}
                type="hidden"
              />
              <div className="flex w-full flex-col rounded-lg border border-white/20 bg-main-2 p-2 px-4">
                <div className="flex w-full items-center justify-between py-1">
                  <p className="text-sm text-white">{embedding.vectorId}</p>
                  <p className="text-sm text-white">
                    Similarity {(embedding.score * 100.0).toFixed(2)}%
                  </p>
                </div>
                <pre className="overflow-scroll rounded-lg bg-main-2 p-2 text-white shadow-sm">
                  {JSON.stringify(embedding.metadata || {}, null, 2)}
                </pre>
              </div>
            </Fragment>
          );
        })}
      </div>
      <button
        type="submit"
        className="my-4 h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
      >
        Create test
      </button>
    </div>
  );
}

function stringIsArray(strInput: string) {
  try {
    return new Function(`return Array.isArray(${strInput})`)();
  } catch {
    return false;
  }
}
