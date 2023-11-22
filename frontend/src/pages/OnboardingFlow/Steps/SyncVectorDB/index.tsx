export default function SyncVectorDB({ setCurrentStep }) {
  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 05/
        <span className="text-white text-opacity-40">05</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Sync your connection
      </div>
      <div className="flex w-[400px] flex-col gap-y-2">
        <span className="text-sm font-light text-white text-opacity-90">
          VDMS can automatically sync existing information in your Pinecone
          namespaces so you can manage it easily. This process can take a long
          time to complete depending on how much data you already have embedded.
        </span>
        <span className="text-sm font-light text-white text-opacity-90">
          Once you start this process you can check on its progress in the{' '}
          <span className="font-medium">job queue</span>.
        </span>
      </div>
      <form onSubmit={() => console.log('setup complete')}>
        <button
          type="submit"
          className="mt-11
                   h-11 w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          Synchronize embeddings
        </button>
      </form>
    </div>
  );
}
