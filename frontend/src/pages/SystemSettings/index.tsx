import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import System from '../../models/system';
import Settings from './Settings';

export default function SystemSettingsView() {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    async function fetchInfo() {
      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }
      const focusedOrg = orgs?.[0];
      const settingsResults = await Promise.all([
        new Promise((resolve) => {
          System.getSetting('allow_account_creation').then((result) =>
            resolve(result)
          );
        }),
        new Promise((resolve) => {
          System.getSetting('account_creation_domain_scope').then((result) =>
            resolve(result)
          );
        }),
        new Promise((resolve) => {
          System.getSetting('open_ai_api_key').then((result) =>
            resolve(result)
          );
        }),
        new Promise((resolve) => {
          System.getSetting('debug_username').then((result) => resolve(result));
        }),
        new Promise((resolve) => {
          System.getSetting('debug_pwd').then((result) => resolve(result));
        }),
      ]);

      setSettings(settingsResults);
      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setLoading(false);
    }
    fetchInfo();
  }, [user.uid]);

  if (loading) {
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
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <Settings settings={settings} />
        </div>
      </div>
    </AppLayout>
  );
}
