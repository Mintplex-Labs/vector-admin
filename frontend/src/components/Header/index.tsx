import { useEffect, useState } from 'react';

export default function Header(props: {
  entity?: any | null;
  property?: string;
  nameProp?: string;
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
  extendedItems?: any;
}) {
  const [copied, setCopied] = useState(false);
  if (!props.entity) return null;
  const { extendedItems = <></> } = props;

  useEffect(() => {
    function manageCopy() {
      if (!copied) return false;
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
    manageCopy();
  }, [copied]);

  return (
    <header className="mr-26 flex h-[76px] w-full rounded-t-xl bg-main">
      <div className="flex w-full justify-between p-4">{extendedItems}</div>
    </header>
  );
}
