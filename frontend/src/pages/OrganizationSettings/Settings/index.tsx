import { useState } from 'react';
import Organization from '../../../models/organization';
import { Loader } from 'react-feather';
import paths from '../../../utils/paths';
import { CaretDown } from '@phosphor-icons/react';
import showToast from '../../../utils/toast';

export default function OrgSettings({ organization }: { organization: any }) {
  const [hasOrgChanges, setHasOrgChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOrgUpdate = async (e: any) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const newOrgName =
      (form.get('organization_name') as string) || organization?.name;
    const data = { name: newOrgName };

    const { success, error } = await Organization.update(
      organization.slug,
      data
    );

    if (success) {
      showToast('Organization updated successfully, reloading...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showToast(error, 'error');
    }
    success && setHasOrgChanges(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (
      !confirm(
        'Are you sure you want to do this. All associated information will be deleted.\n\nThis operation will ONLY remove information from Vector Admin and will not remove any data from your connected vector database.'
      )
    )
      return false;
    setDeleting(true);
    const { success, error } = await Organization.deleteOrg(organization.slug);
    if (!success) {
      alert(error);
      setDeleting(false);
      return;
    }

    window.location.replace(paths.dashboard());
  };

  return (
    <div className="col-span-12 h-screen flex-1 rounded-sm bg-main pb-6 xl:col-span-4">
      <div className="flex flex-col">
        <div className="-mt-10 flex items-center gap-x-4">
          <button
            onClick={() => window.history.back()}
            className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
          >
            <CaretDown weight="bold" size={18} />
          </button>
          <div className="text-lg font-medium text-white">
            Organization Settings
          </div>
        </div>
        <form
          onChange={() => setHasOrgChanges(true)}
          onSubmit={handleOrgUpdate}
        >
          <div className="ml-13">
            <div className="mt-8.5 text-sm font-medium text-white">
              Organization Name
            </div>
            <div className="mt-1 text-sm text-white text-opacity-60">
              This will only change the display name of the organization.
            </div>
            <div className="mt-2 flex items-center gap-x-4">
              <input
                type="text"
                name="organization_name"
                required={true}
                placeholder="My Organization"
                defaultValue={organization.name}
                className="mt-2 inline-flex h-11 w-[210px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white text-opacity-60"
              />
              <button
                hidden={!hasOrgChanges}
                type="submit"
                className="text-center text-sm font-medium text-sky-400"
              >
                Save
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="mt-5 w-fit rounded-lg p-1 text-sm leading-tight text-red-500 hover:bg-red-500 hover:text-white"
            >
              <Loader hidden={!deleting} size={16} className="animate-spin" />
              {deleting ? 'Removing Organization' : 'Delete Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
