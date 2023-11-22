import { useState } from 'react';
import VectorDBOption from '../../../../components/VectorDBOption';
import ChromaLogo from '../../../../images/vectordbs/chroma.png';
import PineconeLogo from '../../../../images/vectordbs/pinecone.png';
import QDrantLogo from '../../../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../../../images/vectordbs/weaviate.png';

export default function ConnectVectorDB({ setCurrentStep }) {
  const [vectorDB, setVectorDB] = useState('chroma');
  const [settings, setSettings] = useState({});

  const updateVectorChoice = (selection) => {
    setVectorDB(selection);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrentStep('sync_vector_db');
  };

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 04/
        <span className="text-white text-opacity-40">05</span>
      </div>
      <div className="mb-5 text-2xl font-medium text-white">
        Connect your vector database
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-2 gap-4">
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
                  type="password"
                  name="PineConeKey"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="Pinecone API Key"
                  defaultValue={settings?.PineConeKey ? '*'.repeat(20) : ''}
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Pinecone Index Environment
                </label>
                <input
                  type="text"
                  name="PineConeEnvironment"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="us-gcp-west-1"
                  defaultValue={settings?.PineConeEnvironment}
                  required={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  Pinecone Index Name
                </label>
                <input
                  type="text"
                  name="PineConeIndex"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="my-index"
                  defaultValue={settings?.PineConeIndex}
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
                  name="ChromaEndpoint"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:8000"
                  defaultValue={settings?.ChromaEndpoint}
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
                  name="ChromaApiHeader"
                  autoComplete="off"
                  type="text"
                  defaultValue={settings?.ChromaApiHeader}
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="X-Api-Key"
                />
              </div>

              <div className="flex w-60 flex-col">
                <label className="mb-4 block text-sm font-semibold text-white">
                  API Key
                </label>
                <input
                  name="ChromaApiKey"
                  autoComplete="off"
                  type="password"
                  defaultValue={settings?.ChromaApiKey ? '*'.repeat(20) : ''}
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
                  name="QdrantEndpoint"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:6633"
                  defaultValue={settings?.QdrantEndpoint}
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
                  name="QdrantApiKey"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="wOeqxsYP4....1244sba"
                  defaultValue={settings?.QdrantApiKey}
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
                  name="WeaviateEndpoint"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="http://localhost:8080"
                  defaultValue={settings?.WeaviateEndpoint}
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
                  name="WeaviateApiKey"
                  className="block w-full rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
                  placeholder="sk-123Abcweaviate"
                  defaultValue={settings?.WeaviateApiKey}
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
