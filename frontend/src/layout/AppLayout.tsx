import { ReactNode, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

interface DefaultLayoutProps {
  headerEntity: any;
  headerProp: string;
  headerNameProp?: string;
  workspaces: any[];
  organizations: any[];
  organization: any;
  headerExtendedItems?: ReactNode;
  children: ReactNode;
  hasMoreWorkspaces?: boolean;
  loadMoreWorkspaces?: VoidFunction;
}

const AppLayout = ({
  workspaces,
  headerEntity,
  headerProp,
  headerNameProp,
  organizations,
  organization,
  headerExtendedItems,
  children,
  hasMoreWorkspaces,
  loadMoreWorkspaces,
}: DefaultLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          workspaces={workspaces}
          organizations={organizations}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          organization={organization}
          hasMoreWorkspaces={hasMoreWorkspaces}
          loadMoreWorkspaces={loadMoreWorkspaces}
        />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {!!headerEntity && (
            <div className="flex w-full items-center">
              <Header
                nameProp={headerNameProp}
                entity={headerEntity}
                property={headerProp}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                extendedItems={headerExtendedItems}
              />
            </div>
          )}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
