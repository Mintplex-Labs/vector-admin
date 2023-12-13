import { memo, useState, useEffect } from 'react';
import PreLoader from '../../../components/Preloader';
import { humanFileSize, nFormatter } from '../../../utils/numbers';
import moment from 'moment';
import pluralize from 'pluralize';
import Workspace from '../../../models/workspace';
import { Copy } from '@phosphor-icons/react';
import truncate from 'truncate';

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

  const [clipboardMessage, setClipboardMessage] = useState('');
  const handleCopyToClipboard = async (text: any) => {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(text);
      setClipboardMessage('Copied to clipboard!');
      setTimeout(() => {
        setClipboardMessage('');
      }, 2000);
    }
  };

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
    <div className="flex w-full justify-between">
      <div className="-mt-6 ml-4 w-full rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
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
            Dimensions: <span className=" font-jetbrainsbold">1536</span>
          </span>
        </div>
      </div>

      <div className=" -mt-6 ml-4 mr-24 w-fit min-w-[303px] rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap font-jetbrains text-white">
            ID:{' '}
            <span
              className={`font-jetbrainsbold transition-all duration-300 ${
                clipboardMessage ? 'animate-pulse text-sky-400' : ''
              }`}
            >
              {clipboardMessage || truncate(workspace?.uuid, 18)}
            </span>
          </span>
          <button
            onClick={() => handleCopyToClipboard(workspace?.uuid)}
            className="pl-2 text-white transition-all duration-300 hover:cursor-pointer hover:text-sky-400"
          >
            <Copy size={20} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(Statistics);
