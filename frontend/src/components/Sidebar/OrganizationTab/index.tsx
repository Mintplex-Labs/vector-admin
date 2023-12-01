import { NavLink } from 'react-router-dom';
import paths from '../../../utils/paths';

type OrganizationTabProps = {
  organization: any;
  i: number;
};
export default function OrganizationTab({
  organization,
  i,
}: OrganizationTabProps) {
  return (
    <li key={i}>
      <NavLink
        key={organization.id}
        reloadDocument={true}
        to={paths.organization(organization)}
        className={({ isActive }) =>
          'group relative flex items-center gap-2.5 rounded-md bg-white px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white' +
          (isActive && '!text-white')
        }
      >
        {organization.name}
      </NavLink>
    </li>
  );
}
