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
        <div className="flex items-start justify-between">
          <div className="mb-6">
            <h4 className="text-3xl font-semibold text-black">
              RAG Test #{test.id} recent runs
            </h4>
            <p className="mt-2 w-full text-gray-600">
              These are all of the recent runs of this specific RAG Test.
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
