import { memo, useState, useEffect } from 'react';
import { humanFileSize, nFormatter } from '../../../utils/numbers';
import Organization from '../../../models/organization';
import pluralize from 'pluralize';
import Workspace from '../../../models/workspace';

const Statistics = ({
  organization,
  workspaces,
}: {
  organization: any;
  workspaces: any;
}) => {
  const [documents, setDocuments] = useState({
    status: 'loading',
    value: 0,
  });
  const [vectors, setVectors] = useState({
    status: 'loading',
    value: 0,
  });
  const [cache, setCache] = useState({
    status: 'loading',
    value: 0,
  });
  const [dimensions, setDimensions] = useState({
    status: 'loading',
    value: '-',
  });

  useEffect(() => {
    async function collectStats() {
      if (!organization?.slug) return false;

      Organization.stats(organization.slug, 'documents').then((json) => {
        setDocuments({ status: 'complete', value: json.value });
      });
      Organization.stats(organization.slug, 'vectors').then((json) => {
        setVectors({ status: 'complete', value: json.value });
      });
      Organization.stats(organization.slug, 'cache-size').then((json) => {
        setCache({ status: 'complete', value: json.value });
      });
      Workspace.stats(organization.slug, workspaces[0].slug, 'dimensions').then(
        (json) => {
          setDimensions({ status: 'complete', value: json.value });
        }
      );
    }
    collectStats();
  }, [organization?.slug, workspaces[0]?.slug]);

  return (
    <div className="-mt-6 flex w-full items-center pr-7">
      <div className=" ml-4 flex items-center gap-x-6">
        <div className="flex items-center gap-x-1">
          <span className="font-['Plus Jakarta Sans'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
            Documents
          </span>
          <span className="font-['JetBrains Mono'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
            {' '}
          </span>
          <span className="font-['JetBrains Mono'] text-sm font-extrabold uppercase leading-[18px] tracking-wide text-white">
            ({nFormatter(documents.value)})
          </span>
        </div>
      </div>

      <div className="ml-4 mr-48 w-full rounded-xl border-2 border-white/20 px-5 py-2  text-sky-400">
        <div className="flex items-center justify-between whitespace-nowrap">
          <span className="font-jetbrains uppercase text-white">
            {pluralize('Vector', vectors.value)}:{' '}
            <span className=" font-jetbrainsbold">
              {nFormatter(vectors.value)}
            </span>
          </span>
          <span className="font-jetbrains uppercase text-white">
            Vector Cache:{' '}
            <span className=" font-jetbrainsbold">
              {humanFileSize(cache.value)}
            </span>
          </span>
          <span className="font-jetbrains uppercase text-white">
            Dimensions:{' '}
            <span className=" font-jetbrainsbold">{dimensions.value}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(Statistics);
