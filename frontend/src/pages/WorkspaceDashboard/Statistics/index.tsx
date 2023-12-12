import { memo, useState, useEffect } from 'react';
import PreLoader from '../../../components/Preloader';
import { humanFileSize, nFormatter } from '../../../utils/numbers';
import moment from 'moment';
import pluralize from 'pluralize';
import Workspace from '../../../models/workspace';

const Statistics = ({
  organization,
  workspace,
}: {
  organization: any;
  workspace: any;
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

  useEffect(() => {
    async function collectStats() {
      if (!workspace?.slug) return false;

      Workspace.stats(organization.slug, workspace.slug, 'documents').then(
        (json) => {
          setDocuments({ status: 'complete', value: json.value });
        }
      );
      Workspace.stats(organization.slug, workspace.slug, 'vectors').then(
        (json) => {
          setVectors({ status: 'complete', value: json.value });
        }
      );
      Workspace.stats(organization.slug, workspace.slug, 'cache-size').then(
        (json) => {
          setCache({ status: 'complete', value: json.value });
        }
      );
    }
    collectStats();
  }, [organization?.slug, workspace?.slug]);

  return (
    // <div className="col-span-12 rounded-md border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
    //   <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
    //     <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark xl:border-b-0 xl:border-r xl:pb-0">
    //       {documents.status === 'loading' ? (
    //         <PreLoader />
    //       ) : (
    //         <div className="flex flex-col items-center">
    //           <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
    //             {nFormatter(documents.value)}
    //           </h4>
    //           <p className="text-sm font-medium">
    //             {pluralize('Document', documents.value)}
    //           </p>
    //         </div>
    //       )}
    //     </div>

    //     <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark xl:border-b-0 xl:border-r xl:pb-0">
    //       {vectors.status === 'loading' ? (
    //         <PreLoader />
    //       ) : (
    //         <div className="flex flex-col items-center">
    //           <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
    //             {nFormatter(vectors.value)}
    //           </h4>
    //           <p className="text-sm font-medium">
    //             {pluralize('Vector', vectors.value)}
    //           </p>
    //         </div>
    //       )}
    //     </div>

    //     <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark sm:border-b-0 sm:pb-0 xl:border-r">
    //       {cache.status === 'loading' ? (
    //         <PreLoader />
    //       ) : (
    //         <div className="flex flex-col items-center">
    //           <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
    //             {humanFileSize(cache.value)}
    //           </h4>
    //           <p className="text-sm font-medium">Vector Cache (MB)</p>
    //         </div>
    //       )}
    //     </div>

    //     <div className="flex items-center justify-center gap-2">
    //       <div className="flex flex-col items-center">
    //         <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
    //           {organization?.lastUpdated
    //             ? moment(organization.lastUpdated).fromNow()
    //             : moment(organization.createdAt).fromNow()}
    //         </h4>
    //         <p className="text-sm font-medium">Last Modified</p>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div className="-mt-6 ml-4 w-full rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
      <div className="flex items-center justify-between">
        <span className="font-jetbrains uppercase text-white">Vectors: 0</span>
        <span className="font-jetbrains uppercase text-white">
          Vector Cache: 0 MiB
        </span>
        <span className="font-jetbrains uppercase text-white">
          Dimensions: 1536
        </span>
      </div>
    </div>
  );
};

export default memo(Statistics);
