import { FormEvent, useEffect, useState } from 'react';
import { SUPPORTED_VECTOR_DBS } from '../../../../utils/constants';
import Organization from '../../../../models/organization';
import { nFormatter } from '../../../../utils/numbers';
import paths from '../../../../utils/paths';
import showToast from '../../../../utils/toast';

type SyncVectorDBProps = {
  connector: any;
  organization: any;
  setLoading: (loading: boolean) => void;
};

export default function SyncVectorDB({
  connector,
  organization,
  setLoading,
}: SyncVectorDBProps) {
  const [canSync, setCanSync] = useState(false);
  const [remoteCount, setRemoteCount] = useState(0);

  useEffect(() => {
    async function fetchConnector() {
      if (!!connector) {
        if (SUPPORTED_VECTOR_DBS.includes(connector.type)) {
          const { value: result } = await Organization.stats(
            organization.slug,
            'vectorCounts'
          );

          if (!!result) {
            if (
              result.remoteCount > 0 &&
              result.remoteCount !== result.localCount
            )
              setRemoteCount(result.remoteCount);
            setCanSync(true);
          }
        }

        setLoading(false);
        return;
      }

      setLoading(false);
    }
    fetchConnector();
  }, []);

  const handleGoToDashboard = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.replace(paths.organization({ slug: organization.slug }));
  };

  const handleSyncConnector = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { job, error } = await Organization.syncConnector(
      organization.slug,
      connector.id
    );

    if (job) {
      showToast(
        'Syncing vector database and taking you to dashboard...',
        'success'
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.replace(paths.organization({ slug: organization.slug }));
    } else {
      showToast(`Error syncing vector database: ${error}`, 'error');
    }
  };

  if (!canSync) {
    return (
      <div>
        <div className="mb-8 font-semibold uppercase text-white">
          Step 05/
          <span className="text-white text-opacity-40">05</span>
        </div>
        <div className="mb-3 text-2xl font-medium text-white">
          Welcome to VectorAdmin!
        </div>
        <div className="flex w-[400px] flex-col gap-y-2">
          <span className="text-sm font-light text-white text-opacity-90">
            You have successfully connected your vector database to VectorAdmin.
          </span>
        </div>
        <form onSubmit={handleGoToDashboard}>
          <button
            type="submit"
            className="mt-11
                     h-11 w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
          >
            Take me to the dashboard &rarr;
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 05/
        <span className="text-white text-opacity-40">05</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Sync your connection
      </div>
      <div className="text-md mb-3 font-medium italic text-white text-opacity-80">
        {nFormatter(remoteCount)} vectors detected from your vector database
      </div>
      <div className="flex w-[400px] flex-col gap-y-2">
        <span className="text-sm font-light text-white text-opacity-90">
          VectorAdmin can automatically sync existing information in your vector
          databases so you can manage it easily. This process can take a long
          time to complete depending on how much data you already have embedded.
        </span>
        <span className="text-sm font-light text-white text-opacity-90">
          Once you start this process you can check on its progress in the{' '}
          <span className="font-medium">job queue</span>.
        </span>
      </div>
      <form onSubmit={handleSyncConnector}>
        <button
          type="submit"
          className="mt-11
                   h-11 w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          Synchronize embeddings &rarr;
        </button>
      </form>
    </div>
  );
}
