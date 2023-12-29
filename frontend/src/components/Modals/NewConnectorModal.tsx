import { useState, memo } from 'react';
import Organization from '../../models/organization';
import PreLoader from '../Preloader';

import ChromaLogo from '../../images/vectordbs/chroma.png';
import PineconeLogoInverted from '../../images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../images/vectordbs/weaviate.png';
import { APP_NAME } from '../../utils/constants';
const NewConnectorModal = memo(
  ({
    organization,
    onNew,
  }: {
    organization: any;
    onNew: (newConnector: any) => void;
  }) => {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('chroma');
    const [error, setError] = useState<null | string>(null);
    const [success, setSuccess] = useState<null | boolean>(false);
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      const data = { type };
      const form = new FormData(e.target);
      for (var [_k, value] of form.entries()) {
        if (_k.includes('::')) {
          const [_key, __key] = _k.split('::');
          if (!data.hasOwnProperty(_key)) data[_key] = {};
          data[_key][__key] = value;
        } else {
          data[_k] = value;
        }
      }

      const { connector, error } = await Organization.addConnector(
        organization.slug,
        data
      );

      if (!connector) {
        setLoading(false);
        setError(error);
        return false;
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onNew(connector);
        setSuccess(false);
      }, 1500);
    };

    return (
      <dialog
        id="new-connector-modal"
        className="rounded-xl border-2 border-white/20 bg-main shadow"
        onClick={(event) =>
          event.target == event.currentTarget && event.currentTarget?.close()
        }
      >
        <div className="rounded-sm p-[20px]">
          <div className="px-6.5 py-4">
            <h3 className="text-lg font-medium text-white">
              Connect to Vector Database
            </h3>
            <p className="text-sm text-white/60">
              {APP_NAME} is a tool to help you manage vectors in a vector
              database, but without access to a valid vector database you will
              be limited to read-only actions and limited functionality - you
              should connect to a vector database provider to unlock full
              functionality.
            </p>
          </div>
          {loading ? (
            <div className="px-6.5">
              <div className="mb-4.5 flex w-full justify-center">
                <PreLoader />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <ul className="mx-6 flex w-full flex-wrap gap-6">
                <li onClick={() => setType('chroma')} className="w-[250px]">
                  <input
                    name="type"
                    type="checkbox"
                    value="chroma"
                    className="peer hidden"
                    checked={type === 'chroma'}
                    formNoValidate={true}
                  />
                  <label
                    style={{
                      background:
                        type === 'chroma'
                          ? `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)`
                          : `linear-gradient(180deg, #313236 0%, rgba(63, 65, 70, 0.00) 100%)`,
                    }}
                    className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-xl border-2 border-transparent p-5 text-white shadow-md transition-all duration-300 hover:border-sky-400 hover:shadow-lg peer-checked:border-sky-400"
                  >
                    <div className="block">
                      <img
                        src={ChromaLogo}
                        className="mb-2 h-10 w-10 rounded-full"
                        alt="chroma logo"
                      />
                      <div className="w-full text-lg font-semibold">Chroma</div>
                      <div className="flex w-full flex-col gap-y-1 text-sm">
                        <p className="text-xs text-white/80">trychroma.com</p>
                        Open source vector database you can host yourself.
                      </div>
                    </div>
                  </label>
                </li>
                <li onClick={() => setType('pinecone')} className="w-[250px]">
                  <input
                    name="type"
                    type="checkbox"
                    value="pinecone"
                    className="peer hidden"
                    checked={type === 'pinecone'}
                    formNoValidate={true}
                  />
                  <label
                    style={{
                      background:
                        type === 'pinecone'
                          ? `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)`
                          : `linear-gradient(180deg, #313236 0%, rgba(63, 65, 70, 0.00) 100%)`,
                    }}
                    className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-xl border-2 border-transparent p-5 text-white shadow-md transition-all duration-300 hover:border-sky-400 hover:shadow-lg peer-checked:border-sky-400"
                  >
                    <div className="block">
                      <img
                        src={PineconeLogoInverted}
                        className="mb-2 h-10 w-10 rounded-full"
                        alt="pinecone logo"
                      />
                      <div className="w-full text-lg font-semibold">
                        Pinecone
                      </div>
                      <div className="flex w-full flex-col gap-y-1 text-sm">
                        <p className="text-xs text-white/80">pinecone.io</p>
                        Cloud-hosted vector database.
                      </div>
                    </div>
                  </label>
                </li>
                <li onClick={() => setType('qdrant')} className="w-[250px]">
                  <input
                    name="type"
                    type="checkbox"
                    value="qdrant"
                    className="peer hidden"
                    checked={type === 'qdrant'}
                    formNoValidate={true}
                  />
                  <label
                    style={{
                      background:
                        type === 'qdrant'
                          ? `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)`
                          : `linear-gradient(180deg, #313236 0%, rgba(63, 65, 70, 0.00) 100%)`,
                    }}
                    className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-xl border-2 border-transparent p-5 text-white shadow-md transition-all duration-300 hover:border-sky-400 hover:shadow-lg peer-checked:border-sky-400"
                  >
                    <div className="block">
                      <img
                        src={qDrantLogo}
                        className="mb-2 h-10 w-10 rounded-full"
                        alt="qdrant logo"
                      />
                      <div className="w-full text-lg font-semibold">qDrant</div>
                      <div className="flex w-full flex-col gap-y-1 text-sm">
                        <p className="text-xs text-white/80">qdrant.tech</p>
                        Open-source & hosted vector database.
                      </div>
                    </div>
                  </label>
                </li>
                <li onClick={() => setType('weaviate')} className="w-[250px]">
                  <input
                    name="type"
                    type="checkbox"
                    value="weaviate"
                    className="peer hidden"
                    checked={type === 'weaviate'}
                    formNoValidate={true}
                  />
                  <label
                    style={{
                      background:
                        type === 'weaviate'
                          ? `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)`
                          : `linear-gradient(180deg, #313236 0%, rgba(63, 65, 70, 0.00) 100%)`,
                    }}
                    className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-xl border-2 border-transparent p-5 text-white shadow-md transition-all duration-300 hover:border-sky-400 hover:shadow-lg peer-checked:border-sky-400"
                  >
                    <div className="block">
                      <img
                        src={WeaviateLogo}
                        className="mb-2 h-10 w-10 rounded-full"
                        alt="weaviate logo"
                      />
                      <div className="w-full text-lg font-semibold">
                        Weaviate
                      </div>
                      <div className="flex w-full flex-col gap-y-1 text-sm">
                        <p className="text-xs text-white/80">weaviate.io</p>
                        Open-source & hosted vector database.
                      </div>
                    </div>
                  </label>
                </li>
              </ul>

              {type === 'chroma' && (
                <div className="mx-6 my-4 flex flex-col gap-y-6">
                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::instanceURL"
                        className="block text-sm font-medium text-white"
                      >
                        Instance URL
                      </label>
                      <p className="text-sm text-white/60">
                        This is the URL your chroma instance is reachable at.
                      </p>
                    </div>
                    <input
                      name="settings::instanceURL"
                      autoComplete="off"
                      type="url"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="https://my-domain.com:8000"
                      required={true}
                    />
                  </div>
                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::authToken"
                        className="block text-sm font-medium text-white"
                      >
                        API Header & Key
                      </label>
                      <p className="text-sm text-white/60">
                        If your hosted Chroma instance is protected by an API
                        key - enter the header and api key here.
                      </p>
                    </div>
                    <div className="flex w-full items-center gap-x-4">
                      <input
                        name="settings::authTokenHeader"
                        autoComplete="off"
                        type="text"
                        className="block h-11 w-[20%] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                        placeholder="X-Api-Key"
                      />
                      <input
                        name="settings::authToken"
                        autoComplete="off"
                        type="password"
                        className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                        placeholder="sk-myApiKeyToAccessMyChromaInstance"
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === 'pinecone' && (
                <div className="mx-6 my-4 flex flex-col gap-y-6">
                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::environment"
                        className="block text-sm font-medium text-white"
                      >
                        Pinecone Environment
                      </label>
                      <p className="text-sm text-white/60">
                        You can find this on your Pinecone index.
                      </p>
                    </div>
                    <input
                      name="settings::environment"
                      autoComplete="off"
                      type="text"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="us-west4-gcp-free"
                      required={true}
                    />
                  </div>

                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::index"
                        className="block text-sm font-medium text-white"
                      >
                        Pinecone Index
                      </label>
                      <p className="text-sm text-white/60">
                        You can find this on your Pinecone index.
                      </p>
                    </div>
                    <input
                      name="settings::index"
                      autoComplete="off"
                      type="text"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="my-index"
                      required={true}
                    />
                  </div>

                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::apiKey"
                        className="block text-sm font-medium text-white"
                      >
                        API Key
                      </label>
                      <p className="text-sm text-white/60">
                        You can find this on your Pinecone index.
                      </p>
                    </div>
                    <input
                      name="settings::apiKey"
                      autoComplete="off"
                      type="password"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="ee1051-xxxx-xxxx-xxxx"
                    />
                  </div>
                </div>
              )}

              {type === 'qdrant' && (
                <div className="mx-6 my-4 flex flex-col gap-y-6">
                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::clusterUrl"
                        className="block text-sm font-medium text-white"
                      >
                        qDrant Cluster URL
                      </label>
                      <p className="text-sm text-white/60">
                        You can find this in your cloud hosted qDrant cluster or
                        just using the URL to your local docker container.
                      </p>
                    </div>
                    <input
                      name="settings::clusterUrl"
                      autoComplete="off"
                      type="url"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="https://6b3a2d01-3b3f-4339-84e9-ead94f28a844.us-east-1-0.aws.cloud.qdrant.io"
                      required={true}
                    />
                  </div>

                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::apiKey"
                        className="block text-sm font-medium text-white"
                      >
                        API Key
                      </label>
                      <p className="text-sm text-white/60">
                        (optional) If you are using qDrant cloud you will need
                        an API key.
                      </p>
                    </div>
                    <input
                      name="settings::apiKey"
                      autoComplete="off"
                      type="password"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="ee1051-xxxx-xxxx-xxxx"
                    />
                  </div>
                </div>
              )}

              {type === 'weaviate' && (
                <div className="mx-6 my-4 flex flex-col gap-y-6">
                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::clusterUrl"
                        className="block text-sm font-medium text-white"
                      >
                        Weaviate Cluster URL
                      </label>
                      <p className="text-sm text-white/60">
                        You can find this in your cloud hosted Weaviate cluster
                        or just using the URL to your local docker container.
                      </p>
                    </div>
                    <input
                      name="settings::clusterUrl"
                      autoComplete="off"
                      type="url"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="https://my-sandbox-b5vipdmw.weaviate.network"
                      required={true}
                    />
                  </div>

                  <div className="">
                    <div className="mb-2 flex flex-col gap-y-1">
                      <label
                        htmlFor="settings::apiKey"
                        className="block text-sm font-medium text-white"
                      >
                        API Key
                      </label>
                      <p className="text-sm text-white/60">
                        (optional) If you are using Weaviate cloud you will need
                        an API key.
                      </p>
                    </div>
                    <input
                      name="settings::apiKey"
                      autoComplete="off"
                      type="password"
                      className="block h-11 w-full min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                      placeholder="ee1051-xxxx-xxxx-xxxx"
                    />
                  </div>
                </div>
              )}

              <div className="w-full px-6">
                {error && (
                  <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-red-800">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-green-800">
                    Connector changes saved
                  </p>
                )}
                <div className="flex items-center justify-center">
                  <button
                    type="submit"
                    className="mb-4 mt-4 h-10 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
                  >
                    Connect to Vector Database
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </dialog>
    );
  }
);

export default NewConnectorModal;
