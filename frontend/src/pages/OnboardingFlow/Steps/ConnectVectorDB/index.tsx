import { FormEvent, useState } from 'react';
import VectorDBOption from '@/components/VectorDBOption';
import ChromaLogo from '@/images/vectordbs/chroma.png';
import PineconeLogo from '@/images/vectordbs/pinecone.png';
import QDrantLogo from '@/images/vectordbs/qdrant.png';
import WeaviateLogo from '@/images/vectordbs/weaviate.png';
import Organization from '@/models/organization';
import showToast from '@/utils/toast';

type ConnectVectorDBProps = {
  setCurrentStep: (step: string) => void;
  organization: any;
  setLoading: (loading: boolean) => void;
  setConnector: (connector: any) => void;
  stepIdx: number;
  stepCount: number;
};

export default function ConnectVectorDB({
  setCurrentStep,
  organization,
  setLoading,
  setConnector,
  stepIdx,
  stepCount,
}: ConnectVectorDBProps) {
  const [vectorDB, setVectorDB] = useState('chroma');

  const updateVectorChoice = (selection: string) => {
    setVectorDB(selection);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = { type: vectorDB };

    for (var [key, value] of form.entries()) {
      if (key.includes('::')) {
        const [mainKey, subKey] = key.split('::');
        if (!data.hasOwnProperty(mainKey)) data[mainKey] = {};
        data[mainKey][subKey] = value;
      } else {
        data[key] = value;
      }
    }

    const { connector, error } = await Organization.addConnector(
      organization.slug,
      data
    );

    if (connector) {
      showToast('Vector database connected successfully', 'success', {
        clear: true,
      });
      setConnector(connector);
      setCurrentStep('survey');
    } else {
      showToast(`Error connecting vector database: ${error}`, 'error');
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 0{stepIdx}/
        <span className="text-white text-opacity-40">0{stepCount}</span>
      </div>
      <div className="mb-5 text-2xl font-medium text-white">
        Connect your vector database
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid max-w-125 grid-cols-1 gap-4 md:grid-cols-2">
          <VectorDBOption
            name="Chroma"
            value="chroma"
            link="trychroma.com"
            description="Open source vector database you can host yourself or on the cloud."
            checked={vectorDB === 'chroma'}
            image={ChromaLogo}
            onClick={updateVectorChoice}
          />
          <VectorDBOption
            name="Pinecone"
            value="pinecone"
            link="pinecone.io"
            description="100% cloud-based vector database for enterprise use cases."
            checked={vectorDB === 'pinecone'}
            image={PineconeLogo}
            onClick={updateVectorChoice}
          />
          <VectorDBOption
            name="QDrant"
            value="qdrant"
            link="qdrant.tech"
            description="Open source local and distributed cloud vector database."
            checked={vectorDB === 'qdrant'}
            image={QDrantLogo}
            onClick={updateVectorChoice}
          />
          <VectorDBOption
            name="Weaviate"
            value="weaviate"
            link="weaviate.io"
            description="Open source local and cloud hosted multi-modal vector database."
            checked={vectorDB === 'weaviate'}
            image={WeaviateLogo}
            onClick={updateVectorChoice}
          />
        </div>
        <div className="mb-9 mt-10 flex max-w-[500px] flex-wrap gap-4">
          {vectorDB === 'pinecone' && (
            <>
              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Pinecone DB API Key
                </label>
                <input
                  name="settings::apiKey"
                  autoComplete="off"
                  type="password"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="Pinecone API Key"
                  required={true}
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Pinecone Index Environment
                </label>
                <input
                  type="text"
                  name="settings::environment"
                  autoComplete="off"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="us-gcp-west-1"
                  required={true}
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Pinecone Index Name
                </label>
                <input
                  type="text"
                  name="settings::index"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="my-index"
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </>
          )}

          {vectorDB === 'chroma' && (
            <>
              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Chroma Endpoint
                </label>
                <input
                  type="url"
                  name="settings::instanceURL"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:8000"
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  API Header
                </label>
                <input
                  name="settings::authTokenHeader"
                  autoComplete="off"
                  type="text"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="X-Api-Key"
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  API Key
                </label>
                <input
                  name="settings::authToken"
                  autoComplete="off"
                  type="password"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="sk-myApiKeyToAccessMyChromaInstance"
                />
              </div>
            </>
          )}

          {vectorDB === 'lancedb' && (
            <div className="flex h-40 w-full items-center justify-center">
              <p className="font-base text-sm text-white text-opacity-60">
                There is no configuration needed for LanceDB.
              </p>
            </div>
          )}

          {vectorDB === 'qdrant' && (
            <>
              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  QDrant API Endpoint
                </label>
                <input
                  type="url"
                  name="settings::clusterUrl"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:6633"
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  API Key
                </label>
                <input
                  type="password"
                  name="settings::apiKey"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="ee1051-xxxx-xxxx-xxxx"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </>
          )}

          {vectorDB === 'weaviate' && (
            <>
              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Weaviate Endpoint
                </label>
                <input
                  type="url"
                  name="settings::clusterUrl"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:8080"
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  API Key
                </label>
                <input
                  type="password"
                  name="settings::apiKey"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="sk-123Abcweaviate"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </>
          )}
        </div>
        <button
          type="submit"
          className="h-11 w-[500px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
