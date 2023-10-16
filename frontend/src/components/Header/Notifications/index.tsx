import { useEffect, useState } from 'react';
import { Bell, Info } from 'react-feather';
import { useParams } from 'react-router-dom';
import Organization from '../../../models/organization';
import moment from 'moment';
const POLLING_INTERVAL = 30_000;
const SAMPLE_NOTIFS = [
  {
    id: 1,
    organization_id: 12,
    seen: false,
    textContent: 'Your Notification is here!',
    symbol: 'info',
    link: '/chroma/background-jobs',
    target: '_blank',
    createdAt: Math.floor(Number(new Date()) / 1_000) - 3600,
  },
  {
    id: 1,
    organization_id: 12,
    seen: true,
    textContent: 'Your Notification is here!',
    symbol: 'info',
    link: '/chroma/background-jobs',
    target: '_blank',
    createdAt: Math.floor(Number(new Date()) / 1_000) - 3600,
  },
] as INotification[];

export type INotification = {
  id: number;
  organization_id: number;
  seen: boolean;
  textContent: string;
  symbol: string;
  link?: string;
  target?: '_blank' | 'self';
  createdAt: number;
};

export default function Notifications() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [hasUnseen, setHasUnseen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  async function handleClick() {
    if (!showNotifs) {
      !!slug && Organization.markNotificationsSeen(slug);
      setShowNotifs(true);
      setHasUnseen(false);
    } else {
      setShowNotifs(false);
    }
  }

  async function fetchNotifications() {
    if (!slug) {
      setLoading(false);
      return;
    }

    const { notifications } = await Organization.notifications(slug);
    setNotifications(_notifications);
    setHasUnseen(_notifications.some((notif) => notif.seen === false));
    setLoading(false);
  }

  useEffect(() => {
    if (!slug) return;
    fetchNotifications();
    // TODO: Enable before merge.
    // setTimeout(() => {
    //   fetchNotifications();
    // }, POLLING_INTERVAL);
  }, [slug]);

  // if (loading || notifications.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="group rounded-lg px-4 py-2 text-slate-800 hover:bg-slate-200"
      >
        <div className="relative">
          <p
            hidden={!hasUnseen}
            className="absolute -top-[4px] right-0 h-[12px] w-[12px] rounded-full bg-red-600"
          />
          <Bell
            size={20}
            className="group-hover:fill-blue-400 group-hover:stroke-blue-500"
          />
        </div>
      </button>

      <div
        hidden={!showNotifs}
        className="absolute right-0 top-10 z-99 w-[20rem] divide-y divide-gray-100 rounded-lg bg-white shadow"
      >
        <div className="block rounded-t-lg bg-blue-100/50 bg-gray-50 px-4 py-2 text-center font-medium text-blue-700">
          Recent Notifications
        </div>
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="flex px-4 py-3 hover:bg-gray-100">
              <div className="w-full pl-3 text-center">
                <div className="mb-1.5 text-sm text-gray-500">
                  No notifications found.
                </div>
                <div className="text-xs text-blue-600" />
              </div>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <Notification
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </>
          )}
        </div>
        {/* <a href="#" className="block py-2 text-sm font-medium text-center text-gray-900 rounded-b-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white">
          <div className="inline-flex items-center ">
            <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 14">
              <path d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
            </svg>
            Mark all as seen
          </div>
        </a> */}
      </div>
    </div>
  );
}

function NotificationImage({ notification }: { notification: INotification }) {
  switch (notification.symbol) {
    case 'info':
      return <Info className="rounded-full text-blue-500" size={20} />;
    default:
      return <Info className="rounded-full text-blue-500" size={20} />;
  }
}

function Notification({ notification }: { notification: INotification }) {
  return (
    <a
      href={notification?.link || '#'}
      target={notification?.target || 'self'}
      className={`flex px-4 py-3 hover:bg-gray-100 ${!notification.seen ? 'border-l-4 border-blue-600' : ''
        }`}
    >
      <div className="flex flex-shrink-0 items-center justify-center">
        <NotificationImage notification={notification} />
      </div>
      <div className="w-full pl-3">
        <div className="mb-1.5 text-sm text-gray-500">
          {notification.textContent}
        </div>
        <div className="text-xs text-blue-600">
          {moment.unix(notification.createdAt).fromNow()}
        </div>
      </div>
    </a>
  );
}
