export default function CreateOrganization({ setCurrentStep }) {
  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 03/
        <span className="text-white text-opacity-40">05</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Create an organization
      </div>
      <div className="w-[370px]">
        <span className="text-sm font-light text-white text-opacity-90">
          Organizations are where all your documents are stored.You can have
          multiple organizations, but you need{' '}
        </span>
        <span className="text-sm font-medium text-white text-opacity-90">
          at least one.
        </span>
      </div>
      <form onSubmit={() => setCurrentStep('connect_vector_db')}>
        <div className="mb-4 mt-6 w-[300px] text-sm font-medium text-white">
          Organization Name
        </div>
        <div className="mb-6">
          <input
            required={true}
            type="text"
            name="organization-name"
            placeholder="Mintplex Labs"
            className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
          />
        </div>
        <button
          type="submit"
          className="h-11
                 w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
