import { ReactNode, useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, Bell, Info } from 'react-feather';
import { useParams } from 'react-router-dom';
import Organization from '../../../models/organization';
import { databaseTimestampFromNow } from '../../../utils/data';
import ChromaLogo from '../../../images/vectordbs/chroma.png';
import PineconeLogo from '../../../images/vectordbs/pinecone.png';
import qDrantLogo from '../../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../../images/vectordbs/weaviate.png';

const POLLING_INTERVAL = 30_000;

export type INotification = {
  id: number;
  organization_id: number;
  seen: boolean;
  textContent: string;
  symbol?:
    | 'info'
    | 'warning'
    | 'error'
    | 'chroma'
    | 'pinecone'
    | 'weaviate'
    | 'qdrant';
  link?: string;
  target?: '_blank' | 'self';
  createdAt: string;
  lastUpdatedAt: string;
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

    const { notifications: _notifications } = await Organization.notifications(
      slug
    );
    setNotifications(_notifications);
    setHasUnseen(_notifications.some((notif) => notif.seen === false));
    setLoading(false);
  }

  useEffect(() => {
    if (!slug) return;
    fetchNotifications();
    setInterval(() => {
      fetchNotifications();
    }, POLLING_INTERVAL);
  }, [slug]);

  if (loading) return null;

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
        className="absolute right-0 top-10 z-99 max-h-[50vh] w-[20rem] divide-y divide-gray-100 overflow-y-scroll rounded-lg bg-white shadow"
      >
        <div className="block rounded-t-lg bg-blue-100/50 bg-gray-50 px-4 py-2 text-center font-medium text-blue-700">
          Recent Notifications
        </div>
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="flex px-4 py-3 hover:bg-gray-100">
              <div className="w-full pl-3 text-center">
                <div className="mb-1.5 text-xs text-gray-500">
                  no notifications
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
      </div>
    </div>
  );
}

function NotificationImage({ notification }: { notification: INotification }) {
  switch (notification.symbol) {
    case 'info':
      return <Info className="text-blue-500" size={20} />;
    case 'warning':
      return <AlertTriangle className="text-orange-500" size={20} />;
    case 'error':
      return <AlertOctagon className="text-red-600" size={20} />;
    case 'chroma':
      return <img className="h-10 w-10 rounded-full" src={ChromaLogo} />;
    case 'pinecone':
      return <img className="h-8 w-8 rounded-full" src={PineconeLogo} />;
    case 'qdrant':
      return <img className="h-8 w-8 rounded-full" src={qDrantLogo} />;
    case 'weaviate':
      return <img className="h-8 w-8 rounded-full" src={WeaviateLogo} />;
    default:
      return <Info className="text-blue-500" size={20} />;
  }
}

function NotificationWrapper({
  notification,
  children,
}: {
  notification: INotification;
  children: ReactNode;
}) {
  if (!!notification.link) {
    return (
      <a
        key={notification.id}
        href={notification?.link || '#'}
        target={notification?.target || 'self'}
        className={`flex px-4 py-3 hover:bg-gray-100 ${
          !notification.seen ? 'border-l-4 !border-l-blue-600' : ''
        }`}
      >
        {children}
      </a>
    );
  }
  return (
    <div
      key={notification.id}
      className={`flex px-4 py-3 hover:bg-gray-100 ${
        !notification.seen ? 'border-l-4 !border-l-blue-600' : ''
      }`}
    >
      {children}
    </div>
  );
}

function Notification({ notification }: { notification: INotification }) {
  return (
    <NotificationWrapper notification={notification}>
      <div className="flex flex-shrink-0 items-center justify-center">
        <NotificationImage notification={notification} />
      </div>
      <div className="w-full pl-3">
        <div className="mb-1.5 text-sm text-gray-500">
          {notification.textContent}
        </div>
        <div className="text-xs text-blue-600">
          {databaseTimestampFromNow(notification.createdAt)}
        </div>
      </div>
    </NotificationWrapper>
  );
}
