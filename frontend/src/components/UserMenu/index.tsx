import { useState, useRef, useEffect } from 'react';
import useUser from '../../hooks/useUser';
import paths from '../../utils/paths';
import { STORE_TOKEN, STORE_USER } from '../../utils/constants';

export default function UserMenu() {
  const { user } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef();
  const handleClose = (event: any) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target) &&
      !buttonRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClose);
    }
    return () => document.removeEventListener('mousedown', handleClose);
  }, [showMenu]);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-sky-400 bg-opacity-20 text-sm font-medium text-sky-400"
      >
        {user?.email?.slice(0, 2).toUpperCase()}
      </button>
      {showMenu && (
        <div
          ref={menuRef}
          className="items-center-justify-center absolute right-0 top-12 flex w-fit rounded-lg border border-white/20 bg-main p-4"
        >
          <div className="flex flex-col gap-y-2">
            <button
              onClick={() => {
                if (!window) return;
                window.localStorage.removeItem(STORE_USER);
                window.localStorage.removeItem(STORE_TOKEN);
                window.location.replace(paths.home());
              }}
              type="button"
              className="w-full whitespace-nowrap rounded-md px-4 py-1.5 text-left text-white hover:bg-slate-200/20"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
