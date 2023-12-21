import { useState, useEffect, memo } from 'react';
import Workspace from '../../../../models/workspace';
import truncate from 'truncate';
import { humanFileSize, milliToHms } from '../../../../utils/numbers';
import { CheckCircle, XCircle } from 'react-feather';
import { Grid } from 'react-loading-icons';

function FileUploadProgressComponent({
  slug,
  workspace,
  file,
  rejected = false,
  reason = null,
}: {
  workspace: any;
  slug: string;
  file: any;
  rejected: any;
  reason: any;
}) {
  const [timerMs, setTimerMs] = useState(10);
  const [status, setStatus] = useState(file?.rejected ? 'uploading' : 'failed');

  useEffect(() => {
    async function uploadFile() {
      const start = Number(new Date());
      const formData = new FormData();
      formData.append('file', file, file.name);
      const timer = setInterval(() => {
        setTimerMs(Number(new Date()) - start);
      }, 100);

      // Chunk streaming not working in production so we just sit and wait
      const { success } = await Workspace.uploadFile(
        slug,
        workspace.slug,
        formData
      );
      setStatus(success ? 'complete' : 'failed');
      clearInterval(timer);
    }
    !!file && !rejected && uploadFile();
  }, []);

  if (rejected) {
    return (
      <div className="flex w-fit items-center gap-x-4 rounded-lg border border-blue-600 bg-blue-100 bg-opacity-50 px-2 py-2 dark:border-stone-600 dark:bg-stone-800">
        <div className="h-6 w-6">
          <XCircle className="h-6 h-full w-6 w-full rounded-full bg-red-500 stroke-white p-1" />
        </div>
        <div className="flex flex-col">
          <p className="font-mono overflow-x-scroll text-sm text-black dark:text-stone-200">
            {truncate(file.name, 30)}
          </p>
          <p className="font-mono text-xs text-red-700 dark:text-red-400">
            {reason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-fit items-center gap-x-4 rounded-lg border border-blue-600 bg-blue-100 bg-opacity-50 px-2 py-2 dark:border-stone-600 dark:bg-stone-800">
      <div className="h-6 w-6">
        {status !== 'complete' ? (
          <Grid className="grid-loader h-6 w-6" />
        ) : (
          <CheckCircle className="h-6 h-full w-6 w-full rounded-full bg-green-500 stroke-white p-1" />
        )}
      </div>
      <div className="flex flex-col">
        <p className="font-mono overflow-x-scroll text-sm text-black dark:text-stone-200">
          {truncate(file.name, 30)}
        </p>
        <p className="font-mono text-xs text-gray-700 dark:text-stone-400">
          {humanFileSize(file.size)} | {milliToHms(timerMs)}
        </p>
      </div>
    </div>
  );
}

export default memo(FileUploadProgressComponent);
