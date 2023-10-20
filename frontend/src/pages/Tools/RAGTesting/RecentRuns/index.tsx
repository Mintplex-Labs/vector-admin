import PreLoader, { FullScreenLoader } from '../../../../components/Preloader';
import useUser from '../../../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../../../layout/DefaultLayout';
import User from '../../../../models/user';
import paths from '../../../../utils/paths';
import AppLayout from '../../../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization, { IOrganization } from '../../../../models/organization';
import Tools, { IRagTest, IRagTestRun } from '../../../../models/tools';
import RunsList from './RunsList';
import { EnableDisableButton, RunNowButton } from '../RecentTests';
import showToast from '../../../../utils/toast';
import { Loader } from 'react-feather';

export default function RAGDriftTestRuns() {
  const { user } = useUser();
  const { slug, testId } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [test, setTest] = useState<IRagTest>();
  const [runs, setRuns] = useState<IRagTestRun[]>();

  useEffect(() => {
    async function userOrgs() {
      if (!slug || !testId) return false;

      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }
      for (const org of orgs) {
        const connector = await Organization.connector(org.slug);
        org.connector = connector || {};
      }

      const focusedOrg =
        orgs?.find((org: any) => org.slug === slug) || orgs?.[0];

      setOrganizations(orgs);
      setOrganization(focusedOrg);

      const { test, runs } = await Tools.ragTest(focusedOrg.slug, testId);
      setTest(test);
      setRuns(runs);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (organizations.length === 0 || !organization || !test) {
    return (
      <DefaultLayout>
        <FullScreenLoader />
      </DefaultLayout>
    );
  }

  return (
    <AppLayout
      headerEntity={organization}
      headerProp="uuid"
      organizations={organizations}
      organization={organization}
      workspaces={[]}
    >
      <div className="flex-1 rounded-sm bg-white px-6 pb-6">
        <a
          href={paths.tools.ragTests(organization)}
          className="my-2 text-sm text-blue-500 underline"
        >
          &larr; back to tests
        </a>
        <div className="flex items-start justify-between">
          <div className="mb-6 w-3/4">
            <div className="flex w-full items-center justify-between">
              <h4 className="text-3xl font-semibold text-black">
                Context Drift test #{test.id} recent runs
              </h4>
              <div className="flex items-center gap-x-6">
                <RunNowButton test={test} />
                <EnableDisableButton test={test} onChange={setTest} />
                <DeleteTestButton test={test} />
              </div>
            </div>
            <p className="mt-2 w-full text-gray-600">
              These are all of the recent runs of this specific test.
            </p>
          </div>
        </div>
        <div className="flex w-3/4 flex-col gap-y-2">
          {loading ? <PreLoader /> : <RunsList test={test} runs={runs} />}
        </div>
      </div>
    </AppLayout>
  );
}

function DeleteTestButton({ test }: { test: IRagTest }) {
  const [loading, setLoading] = useState(false);
  const confirmDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove this test and it's associated data?\n\nThis cannot be undone."
      )
    )
      return false;

    setLoading(true);
    const success = await Tools.deleteRagTest(test);
    if (success) {
      window.location.replace(paths.tools.ragTests(test.organization));
    } else {
      showToast(`Could test could not be deleted.`, 'info');
    }
    setLoading(false);
  };

  return (
    <>
      <i className="hidden text-green-400 text-red-400 hover:bg-green-600 hover:bg-red-600 disabled:bg-green-600 disabled:bg-red-600" />
      <button
        type="button"
        disabled={loading}
        onClick={confirmDelete}
        className={`flex items-center gap-x-2 rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:bg-red-600 disabled:text-white`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={14} />
            <p>Deleting...</p>
          </>
        ) : (
          <>Delete Test</>
        )}
      </button>
    </>
  );
}
