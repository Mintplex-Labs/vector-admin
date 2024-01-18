import { memo, useState } from 'react';
import moment from 'moment';
import Jobs from '../../../models/jobs';
import useUser from '../../../hooks/useUser';
import { CaretDown } from '@phosphor-icons/react';

export default function JobsList({ jobs }: { jobs: any[] }) {
  const { user } = useUser();

  return (
    <div className="col-span-12 h-screen flex-1 rounded-sm bg-main pb-6 xl:col-span-4">
      <div className="-mt-10 flex items-center gap-x-4">
        <button
          onClick={() => window.history.back()}
          className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
        >
          <CaretDown weight="bold" size={18} />
        </button>
        <div className="text-lg font-medium text-white">
          Organization Background Jobs
        </div>
      </div>

      <div className="ml-13 pr-6">
        {jobs.length === 0 ? (
          <div className="mt-10">
            <p className="text-sm text-white text-opacity-60">
              No background jobs have been run yet.
            </p>
          </div>
        ) : (
          <div className="mt-0 overflow-y-auto">
            {jobs.map((job, i) => (
              <JobRun key={i} job={job} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const JobRun = ({ job, user }: { job: any; user: any }) => {
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);
  const { id, status, taskName } = job;

  return (
    <>
      <button
        onClick={() => {
          setLoaded(true);
          setShow(!show);
        }}
        type="button"
        className="flex w-full items-center justify-between border-b border-white/20 py-5 text-left text-white"
      >
        <div className="flex w-full items-center justify-between pr-4">
          <div className="flex items-center gap-x-8">
            <span className="text-md font-medium">{`Job #${id}`}</span>
            <Status status={status} />
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm font-medium text-white shadow-sm">
              {taskName}
            </span>
          </div>
          <p className="text-sm text-white/60">
            last updated {moment(job.lastUpdatedAt).fromNow()}
          </p>
        </div>
        <div
          className={`${
            show ? 'rotate-0' : 'rotate-90'
          } transition-all duration-300`}
        >
          <CaretDown weight="bold" size={20} />
        </div>
      </button>
      <div hidden={!show}>
        {loaded && <JobDetail key={job.id} job={job} user={user} />}
      </div>
    </>
  );
};

const Status = ({ status }: { status: 'pending' | 'failed' | 'complete' }) => {
  if (status === 'pending')
    return (
      <span className="rounded-full bg-sky-600/20 px-2 py-0.5 text-sm font-medium text-sky-400 shadow-sm">
        In progress
      </span>
    );
  if (status === 'failed')
    return (
      <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-sm font-medium text-red-600 shadow-sm">
        Failed
      </span>
    );
  if (status === 'complete')
    return (
      <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-sm font-medium text-green-600 shadow-sm">
        Completed
      </span>
    );
  return null;
};

const JobDetail = memo(({ job, user }: { job: any; user: any }) => {
  const data = JSON.parse(job.data);
  const result = JSON.parse(job.result);
  const [rerun, setRerun] = useState(false);
  const [killed, setKilled] = useState(false);

  const rerunJob = async (e: any) => {
    setRerun(true);
    const { job: newJob, error } = await Jobs.retryJob(job.id);
    if (!!newJob) {
      setTimeout(() => {
        e.target.remove();
      }, 2500);
      return;
    }

    alert(error);
    setRerun(false);
    return false;
  };
  const killJob = async (e: any) => {
    setKilled(true);
    await Jobs.kill(job.id);
    setTimeout(() => {
      e.target.remove();
    }, 2500);
    return;
  };

  return (
    <div className="flex w-full flex-col gap-y-2 p-2">
      {user.role === 'admin' && job.status === 'pending' && (
        <button
          onClick={killJob}
          disabled={killed}
          className="my-2 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:bg-green-500 disabled:hover:bg-green-500"
        >
          {killed ? 'Job is canceled!' : 'Cancel Job'}
        </button>
      )}
      {user.role === 'admin' && job.status === 'failed' && result?.canRetry && (
        <button
          onClick={rerunJob}
          disabled={rerun}
          className="my-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-green-500 disabled:hover:bg-green-500"
        >
          {rerun ? 'Job is queued!' : 'Re-run Failed Job'}
        </button>
      )}
      <div className="flex w-full items-start gap-x-10 p-2">
        <div className="flex w-1/2 flex-col gap-y-1">
          <p className="text-md font-semibold text-white">Job Data</p>
          <pre className="overflow-scroll rounded-lg bg-main-2 p-2 text-white shadow-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <div className="flex w-1/2 flex-col gap-y-1">
          <p className="text-md font-semibold text-white">Job Response</p>
          <pre className="overflow-scroll whitespace-pre-wrap rounded-lg bg-main-2 p-2 text-white shadow-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
});
