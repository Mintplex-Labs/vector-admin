import PreLoader, { FullScreenLoader } from '../../../components/Preloader';
import useUser from '../../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../../layout/DefaultLayout';
import User from '../../../models/user';
import paths from '../../../utils/paths';
import AppLayout from '../../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization, { IOrganization } from '../../../models/organization';
import Tools, { IRagTest } from '../../../models/tools';
import NewTestForm, { NewTestFormModal } from './NewTestForm';
import RecentTestRuns from './RecentTests';

export default function RAGDriftTesting() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [ragTests, setRagTests] = useState<IRagTest[]>([]);

  useEffect(() => {
    async function userOrgs() {
      if (!slug) return false;

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

      const { ragTests: _ragTests } = await Tools.ragTests(focusedOrg.slug);
      setRagTests(_ragTests);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (organizations.length === 0 || !organization) {
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
              RAG Context drift testing
            </h4>
            <p className="mt-2 w-3/4 text-gray-600">
              <b>What is "Context drift"?</b>
              <br />
              <i>"Context Drift"</i> is what happens when your vector database
              changes over time and what was a good LLM response suddenly
              changes and gives vastly different answers.
              <br />
              <br />
              Often, you depend on high quality and current context snippets to
              answer user prompts in LLM chatbot applications. As your
              workspace/namespace/collection changes over time the "similar"
              documents being referenced will change. This can often lead to
              vastly different LLM responses for a fixed prompt. This tool will
              proactively alert you that deviations have occurred for a fixed
              prompt so you can catch them quickly.
              <br />
            </p>
          </div>
        </div>
        <div className="flex w-3/4 flex-col gap-y-2">
          {loading ? (
            <PreLoader />
          ) : (
            <>
              {ragTests.length > 0 ? (
                <>
                  <RecentTestRuns tests={ragTests} setTests={setRagTests} />
                  <NewTestFormModal
                    organization={organization}
                    postCreate={(test: IRagTest) => {
                      setRagTests([test, ...ragTests]);
                      document.getElementById('new-rag-test-modal')?.close();
                    }}
                  />
                </>
              ) : (
                <NewTestForm
                  organization={organization}
                  postCreate={(test: IRagTest) =>
                    setRagTests([test, ...ragTests])
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
