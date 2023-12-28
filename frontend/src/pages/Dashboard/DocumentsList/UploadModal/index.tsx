import { useCallback, useState, useEffect, ReactNode } from 'react';
import { APP_NAME } from '../../../../utils/constants';
import { useDropzone } from 'react-dropzone';
import { v4 } from 'uuid';
import System from '../../../../models/system';
import FileUploadProgress from './FileUploadProgress';
import { useParams } from 'react-router-dom';
import { SmileySad } from '@phosphor-icons/react';

export default function UploadDocumentModal({
  workspaces,
}: {
  workspaces: any;
}) {
  const { slug } = useParams();
  const [targetWorkspace, setTargetWorkspace] = useState(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [files, setFiles] = useState([]);
  const [fileTypes, setFileTypes] = useState({});
  const onDrop = useCallback(
    async (acceptedFiles: any[], rejections: any[]) => {
      const newAccepted = acceptedFiles.map((file) => {
        return {
          uid: v4(),
          workspaceId: targetWorkspace?.id,
          file,
        };
      });
      const newRejected = rejections.map((file) => {
        return {
          uid: v4(),
          file: file.file,
          rejected: true,
          reason: file.errors[0].code,
        };
      });

      setFiles([...files, ...newAccepted, ...newRejected]);
    },
    []
  );

  useEffect(() => {
    async function checkProcessorOnline() {
      const online = await System.documentProcessorOnline();
      const acceptedTypes = await System.acceptedDocumentTypes();
      setFileTypes(acceptedTypes ?? {});
      setReady(online);
    }
    checkProcessorOnline();
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      ...fileTypes,
    },
  });

  if (ready === null || !slug) {
    return (
      <ModalWrapper>
        <div className="flex h-[20rem] w-full cursor-wait overflow-x-hidden overflow-y-scroll rounded-xl border-2 border-white/20 bg-main shadow transition-all duration-300">
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-1">
            <p className="text-xs text-slate-400">
              Checking document processor is online - please wait.
            </p>
            <p className="text-xs text-white/60">
              this should only take a few moments.
            </p>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  if (ready === false) {
    return (
      <ModalWrapper>
        <div className="flex h-[20rem] w-full overflow-x-hidden overflow-y-scroll rounded-lg bg-red-200 outline-none transition-all duration-300">
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-1 px-2 text-red-800 md:px-0">
            <SmileySad size={32} />
            <p className="text-center text-xs text-red-800">
              Document processor is offline.
            </p>
            <p className="text-center text-[10px] text-red-800 md:text-xs">
              you cannot upload documents from the UI right now
            </p>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  if (ready === true && targetWorkspace === null) {
    const saveWorkspace = (e: any) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const selectedWsId = form.get('workspaceId');
      const workspace = workspaces.find(
        (ws: any) => ws.id === Number(selectedWsId)
      );
      if (!workspace) return false;
      setTargetWorkspace(workspace);
    };

    return (
      <ModalWrapper>
        <div className="flex h-[20rem] w-full cursor-wait overflow-x-hidden overflow-y-scroll rounded-xl border border-white/5 bg-main-2 shadow transition-all duration-300">
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-1">
            <p className="pb-2 text-sm text-white/60">
              Please select the workspace you wish to upload documents to.
            </p>
            <form onSubmit={saveWorkspace} className="flex flex-col gap-y-4">
              <select
                name="workspaceId"
                className="rounded-lg border border-white/10 bg-main-2 px-2 py-2 text-white/60"
              >
                {workspaces.map((ws: any) => {
                  return <option value={ws.id}>{ws.name}</option>;
                })}
              </select>
              <button className="w-full rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90">
                Continue &rarr;
              </button>
            </form>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper>
      <div className="flex w-full flex-col gap-y-1">
        <div
          {...getRootProps()}
          className="flex h-[20rem] w-full cursor-pointer overflow-x-hidden overflow-y-scroll rounded-lg border-2 border-dashed border-white/20 bg-main-2 shadow outline-none transition-all duration-300 hover:bg-white/10"
        >
          <input {...getInputProps()} />
          {files.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  aria-hidden="true"
                  className="mb-3 h-10 w-10 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="mb-2 text-sm text-white/60">
                  <span className="font-normal">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300"></p>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-y-2 p-4">
              {files.map((file) => (
                <FileUploadProgress
                  key={file.uid}
                  file={file.file}
                  slug={slug}
                  workspace={targetWorkspace}
                  rejected={file?.rejected}
                  reason={file?.reason}
                />
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-white/60 ">
          Supported file extensions are{' '}
          <code className="rounded-md bg-white/80 px-1 font-mono text-xs text-main">
            {Object.values(fileTypes).flat().join(' ')}
          </code>
        </p>
      </div>
    </ModalWrapper>
  );
}

const ModalWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <dialog
      id="upload-document-modal"
      className="w-1/2 rounded-xl border-2 border-white/20 bg-main shadow"
      onClick={(event) => {
        event.target == event.currentTarget && event.currentTarget?.close();
      }}
    >
      <div className="flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-medium text-white">Upload new document</p>
        <p className="text-sm text-white/60">
          Select a workspace and document you wish to upload and {APP_NAME} will
          process, embed and store the data for you automatically.
        </p>
      </div>
      <div className="my-2 flex w-full p-[20px]">{children}</div>
    </dialog>
  );
};
