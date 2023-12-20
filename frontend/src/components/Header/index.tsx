import { Link } from 'react-router-dom';
import Logo from '../../images/logo/logo-light.png';
import { CheckCircle, Copy } from 'react-feather';
import { useEffect, useState } from 'react';
import paths from '../../utils/paths';
import { STORE_TOKEN, STORE_USER } from '../../utils/constants';
import truncate from 'truncate';
import Notifications from '../Notifications';

export default function Header(props: {
  entity?: any | null;
  property?: string;
  nameProp?: string;
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
  extendedItems?: any;
  quickActions: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!props.entity) return null;
  const {
    entity,
    property,
    nameProp,
    extendedItems = <></>,
    quickActions = false,
  } = props;

  const handleCopy = () => {
    window.navigator.clipboard.writeText(entity[property]);
    setCopied(true);
  };

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
    // <header className="sticky top-0 z-999 flex w-full bg-slate-900 drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none md:bg-white">
    //   <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
    //     <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
    //       {/* <!-- Hamburger Toggle BTN --> */}
    //       <button
    //         aria-controls="sidebar"
    //         onClick={(e) => {
    //           e.stopPropagation();
    //           props.setSidebarOpen(!props.sidebarOpen);
    //         }}
    //         className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
    //       >
    //         <span className="relative block h-5.5 w-5.5 cursor-pointer">
    //           <span className="du-block absolute right-0 h-full w-full">
    //             <span
    //               className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
    //                 !props.sidebarOpen && '!w-full delay-300'
    //               }`}
    //             ></span>
    //             <span
    //               className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
    //                 !props.sidebarOpen && 'delay-400 !w-full'
    //               }`}
    //             ></span>
    //             <span
    //               className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
    //                 !props.sidebarOpen && '!w-full delay-500'
    //               }`}
    //             ></span>
    //           </span>
    //           <span className="absolute right-0 h-full w-full rotate-45">
    //             <span
    //               className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
    //                 !props.sidebarOpen && '!h-0 !delay-[0]'
    //               }`}
    //             ></span>
    //             <span
    //               className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
    //                 !props.sidebarOpen && '!h-0 !delay-200'
    //               }`}
    //             ></span>
    //           </span>
    //         </span>
    //       </button>
    //       {/* <!-- Hamburger Toggle BTN --> */}

    //       <Link className="flex w-full justify-center lg:hidden" to="/">
    //         <img src={Logo} alt="Logo" className="h-14" />
    //       </Link>
    //     </div>

    //     <div className="hidden w-full sm:block">
    //       <div className="flex w-full items-center justify-between">
    //         <div className="flex items-center gap-x-4">
    //           <p className="text-4xl font-semibold text-slate-800">
    //             {truncate(entity[nameProp ?? 'name'], 20)}
    //           </p>
    //           <button
    //             onClick={handleCopy}
    //             disabled={copied}
    //             className="transition-duration-300 font-mono flex items-center gap-x-2 rounded-md bg-slate-200 px-4 py-2 text-sm  text-slate-700 transition disabled:bg-green-300"
    //           >
    //             <p className="">ID: {entity[property]}</p>
    //             {copied ? (
    //               <CheckCircle className="h-4 w-4" />
    //             ) : (
    //               <Copy className="h-4 w-4" />
    //             )}
    //           </button>
    //           {extendedItems}
    //         </div>
    //         <div className="flex w-fit items-center gap-x-2">
    //           <Notifications />
    //           <button
    //             onClick={() => {
    //               if (!window) return;
    //               window.localStorage.removeItem(STORE_USER);
    //               window.localStorage.removeItem(STORE_TOKEN);
    //               window.location.replace(paths.home());
    //             }}
    //             className="rounded-lg px-4 py-2 text-slate-800 hover:bg-slate-200"
    //           >
    //             Logout
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </header>
    <header
      className={`${
        quickActions ? 'mr-[235px]' : 'mr-[104px]'
      } relative flex h-[76px] w-full rounded-t-xl bg-main`}
    >
      <div className="flex w-full justify-between p-4">{extendedItems}</div>
    </header>
  );
}
