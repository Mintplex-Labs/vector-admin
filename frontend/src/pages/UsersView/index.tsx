import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import AppLayout from '../../layout/AppLayout';
import UserList from './UserList';
import Organization from '../../models/organization';
import NewUserModal from './NewUser';

export default function UserManagementView() {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [users, setUsers] = useState<object[]>([]);

  useEffect(() => {
    async function userOrgs() {
      const orgs = await Organization.all();
      const focusedOrg = orgs?.[0];
      const _users = await User.all();

      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setUsers(_users);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

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
      headerNameProp="name"
      organizations={organizations}
      organization={organization}
      workspaces={[]}
    >
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <UserList users={users} organizations={organizations} />
        </div>
      </div>
      <NewUserModal />
    </AppLayout>
  );
}
