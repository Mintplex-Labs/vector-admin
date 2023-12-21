import { memo, useState, useEffect } from 'react';
import PreLoader from '../../../components/Preloader';
import { humanFileSize, nFormatter } from '../../../utils/numbers';
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
  const [dimensions, setDimensions] = useState({
    status: 'loading',
    value: '-',
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
      Workspace.stats(organization.slug, workspace.slug, 'dimensions').then(
        (json) => {
          setDimensions({ status: 'complete', value: json.value });
        }
      );
    }
    collectStats();
  }, [organization?.slug, workspace?.slug]);

  return (
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
            Dimensions:{' '}
            <span className=" font-jetbrainsbold">{dimensions.value}</span>
          </span>
        </div>
      </div>

      <div className=" -mt-6 ml-4 mr-24 w-fit min-w-[303px] rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
        <div className="flex items-center justify-between">
          <span className="font-jetbrains whitespace-nowrap text-white">
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
