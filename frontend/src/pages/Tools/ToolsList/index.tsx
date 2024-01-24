import { useState } from 'react';
import { Info } from 'react-feather';
import { APP_NAME } from '@/utils/constants';
import paths from '@/utils/paths';
import { CaretDown } from '@phosphor-icons/react';

export default function ToolsList({ organization }: { organization: any }) {
  return (
    <div className="col-span-12 h-screen flex-1 rounded-sm bg-main pb-6 xl:col-span-4">
      <div className="-mt-10 flex items-center gap-x-4">
        <button
          onClick={() => window.history.back()}
          className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
        >
          <CaretDown weight="bold" size={18} />
        </button>
        <div className="text-lg font-medium text-white">Organization Tools</div>
      </div>

      <div className="ml-13 pr-6">
        <div className="mt-1 w-125 text-sm text-white text-opacity-60">
          Below are a list of advanced {APP_NAME} only tools and services that
          you can use to manage your connected vector database.
        </div>

        <ToolItem
          title="Automatic context drift detection"
          description={`Catch "context drift" by detecting changes in your vector databases similarity searches before they cause problems.`}
          available={true}
          linkTo={paths.tools.ragTests(organization)}
        />
        <ToolItem
          title="Migrate vector database to another provider"
          description="Take all of your vectors to another connected vector database provider."
          available={true}
          linkTo={paths.tools.migrationTool(organization)}
        />
        <ToolItem
          title="Snapshot vector database"
          description="Take a snapshot of all of your vector data at this time to restore to at a later date."
          available={false}
        />
        <ToolItem
          title="Reset vector database"
          description="Wipe out all existing data in your vector database in one click."
          available={true}
          linkTo={paths.tools.resetTool(organization)}
        />
      </div>
    </div>
  );
}

const ToolItem = ({
  title,
  description,
  available = false,
  linkTo = null,
  user,
  organization,
}: {
  title: string;
  description: string;
  available?: boolean;
  linkTo?: string;
  user?: any;
  organization?: any;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex w-full items-center justify-between border-b border-white/20 py-5 text-left ">
      <div className="flex w-full items-center justify-between pr-4">
        <div className="flex items-center gap-x-8">
          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-white ">{title}</span>
            <span className="rounded-full text-sm text-white/60">
              {description}
            </span>
          </div>
        </div>
        {!available ? (
          <div className="flex items-center gap-x-1 rounded-md px-4 py-1.5 text-white/60 ">
            <Info size={14} />
            <p className="text-sm font-normal">Feature under development.</p>
          </div>
        ) : (
          <a
            href={linkTo}
            className="flex items-center gap-x-1 rounded-md px-2 py-1.5 text-sky-400 hover:bg-white"
          >
            <p className="text-sm font-normal ">Open tool &rarr;</p>
          </a>
        )}
      </div>
    </div>
  );
};

// const JobRun = ({ job, user }: { job: any; user: any }) => {
//   const [loaded, setLoaded] = useState(false);
//   const [show, setShow] = useState(false);
//   const { id, status, taskName } = job;
//   return (
//     <>
//       <button
//         onClick={() => {
//           setLoaded(true);
//           setShow(!show);
//         }}
//         type="button"
//         className="flex w-full items-center justify-between border-b border-gray-200 py-5 text-left font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400"
//       >
//         <div className="flex w-full items-center justify-between pr-4">
//           <div className="flex items-center gap-x-8">
//             <span className="text-xl">Job #{id}</span>
//             <Status status={status} />
//             <span className="font-regular rounded-full bg-slate-100 px-4 py-1">
//               {taskName}
//             </span>
//           </div>
//           <p className="text-sm font-normal text-slate-400">
//             last updated {moment(job.lastUpdatedAt).fromNow()}
//           </p>
//         </div>
//         <ChevronDown className="h-6 w-6 text-gray-500" />
//       </button>
//       <div hidden={!show}>
//         {loaded && <JobDetail key={job.id} job={job} user={user} />}
//       </div>
//     </>
//   );
// };

// const Status = ({ status }: { status: 'pending' | 'failed' | 'complete' }) => {
//   if (status === 'pending')
//     return (
//       <span className="font-regular animate-pulse rounded-full bg-slate-100 px-4 py-1">
//         in progress
//       </span>
//     );
//   if (status === 'failed')
//     return (
//       <span className="font-regular rounded-full bg-red-100 px-4 py-1 text-red-600">
//         Failed
//       </span>
//     );
//   if (status === 'complete')
//     return (
//       <span className="font-regular rounded-full bg-green-100 px-4 py-1 text-green-600">
//         Completed
//       </span>
//     );
//   return null;
// };

// const JobDetail = memo(({ job, user }: { job: any; user: any }) => {
//   const data = JSON.parse(job.data);
//   const result = JSON.parse(job.result);
//   const [rerun, setRerun] = useState(false);
//   const [killed, setKilled] = useState(false);

//   const rerunJob = async (e: any) => {
//     setRerun(true);
//     const { job: newJob, error } = await Jobs.retryJob(job.id);
//     if (!!newJob) {
//       setTimeout(() => {
//         e.target.remove();
//       }, 2500);
//       return;
//     }

//     alert(error);
//     setRerun(false);
//     return false;
//   };
//   const killJob = async (e: any) => {
//     setKilled(true);
//     await Jobs.kill(job.id);
//     setTimeout(() => {
//       e.target.remove();
//     }, 2500);
//     return;
//   };

//   return (
//     <div className='p-2" flex w-full flex-col gap-y-2'>
//       {user.role === 'admin' && job.status === 'pending' && (
//         <button
//           onClick={killJob}
//           disabled={killed}
//           className="my-2 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:bg-green-500 disabled:hover:bg-green-500"
//         >
//           {killed ? 'Job is canceled!' : 'Cancel Job'}
//         </button>
//       )}
//       {user.role === 'admin' &&
//         job.status === 'failed' &&
//         result?.canRetry === true && (
//           <button
//             onClick={rerunJob}
//             disabled={rerun}
//             className="my-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-green-500 disabled:hover:bg-green-500"
//           >
//             {rerun ? 'Job is queued!' : 'Re-run Failed Job'}
//           </button>
//         )}
//       <div className="flex w-full items-start gap-x-10 p-2">
//         <div className="flex w-1/2 flex-col gap-y-1">
//           <p className="text-lg font-semibold">Job Data</p>
//           <pre className="overflow-scroll rounded-lg bg-stone-100 p-2 text-stone-800">
//             {JSON.stringify(data, null, 2)}
//           </pre>
//         </div>

//         <div className="flex w-1/2 flex-col gap-y-1">
//           <p className="text-lg font-semibold">Job Response</p>
//           <pre className="overflow-scroll rounded-lg bg-stone-100 p-2 text-stone-800">
//             {JSON.stringify(result, null, 2)}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// });
