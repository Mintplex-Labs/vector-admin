import { ReactNode, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Organization from '../../models/organization';
import { databaseTimestampFromNow } from '../../utils/data';
import ChromaLogo from '../../images/vectordbs/chroma.png';
import PineconeLogo from '../../images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../images/vectordbs/weaviate.png';
import { Bell, Info, Warning, WarningOctagon } from '@phosphor-icons/react';

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
  const notificationRef = useRef(null);
  const bellButtonRef = useRef(null);

  async function handleClick() {
    if (!showNotifs) {
      !!slug && Organization.markNotificationsSeen(slug);
      setShowNotifs(true);
      setHasUnseen(false);
    } else {
      setShowNotifs(false);
    }
  }
  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        bellButtonRef.current &&
        bellButtonRef.current.contains(event.target)
      ) {
        // Click is inside bell button, do nothing
        return;
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        // Click is outside notification menu, close it
        setShowNotifs(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        ref={bellButtonRef}
        type="button"
        onClick={handleClick}
        className={`group rounded-lg p-2 hover:bg-main-2 ${
          showNotifs && 'bg-main-2'
        }`}
      >
        <div className="relative">
          <p
            hidden={!hasUnseen}
            className="absolute -top-[4px] right-0 h-[12px] w-[12px] rounded-full bg-red-600"
          />
          <div className="text-sky-400">
            <Bell size={24} weight={showNotifs ? 'fill' : 'bold'} />
          </div>
        </div>
      </button>

      <div
        hidden={!showNotifs}
        ref={notificationRef}
        className="absolute right-0 top-12 z-1 max-h-[50vh] w-[20rem] overflow-y-auto rounded-lg border border-neutral-600 bg-main shadow-2xl"
      >
        <div className="sticky left-0 top-0 z-10 block rounded-t-lg border-b border-neutral-600 bg-main px-5 py-2 text-lg text-white shadow-lg">
          Notifications
        </div>
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="flex px-4 py-3 hover:bg-main-2">
              <div className="w-full pl-3 text-center">
                <div className="mb-1.5 text-xs text-white">
                  No notifications
                </div>
              </div>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <Notification
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationImage({ notification }: { notification: INotification }) {
  switch (notification.symbol) {
    case 'info':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-2 text-white">
          <Info size={24} weight="bold" />
        </div>
      );
    case 'warning':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-yellow-300 bg-opacity-20 p-2 text-yellow-300">
          <WarningOctagon size={24} weight="bold" />
        </div>
      );
    case 'error':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-red-700/20 p-2 text-red-600">
          <Warning size={24} weight="bold" />
        </div>
      );
    case 'chroma':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-0">
          <img alt="Chroma Logo" className="rounded-full" src={ChromaLogo} />
        </div>
      );
    case 'pinecone':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-0">
          <img
            alt="Pinecone Logo"
            className="rounded-full"
            src={PineconeLogo}
          />
        </div>
      );
    case 'qdrant':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-0">
          <img alt="qDrant Logo" className="rounded-full" src={qDrantLogo} />
        </div>
      );
    case 'weaviate':
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-0">
          <img
            alt="Weaviate Logo"
            className="rounded-full"
            src={WeaviateLogo}
          />
        </div>
      );
    default:
      return (
        <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 p-2 text-white">
          <Info size={24} weight="bold" />
        </div>
      );
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
        className={`flex px-4 py-3 transition-all duration-300 hover:bg-main-2 ${
          !notification.seen
            ? 'border-l-2 !border-l-sky-400 bg-sky-400/10'
            : 'border-l-2 !border-l-transparent'
        }`}
      >
        {children}
      </a>
    );
  }
  return (
    <div
      key={notification.id}
      className={`flex px-4 py-3 hover:bg-main-2 ${
        !notification.seen
          ? 'border-l-2 !border-l-sky-400'
          : 'border-l-2 !border-l-transparent'
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
        <div className="mb-1 text-sm font-medium leading-tight text-white">
          {notification.textContent}
        </div>
        <div className="text-sm text-white text-opacity-60">
          {databaseTimestampFromNow(notification.createdAt)}
        </div>
      </div>
    </NotificationWrapper>
  );
}

// <Notification
//   key={'pinecone'}
//   notification={{
//     id: 1,
//     organization_id: 1,
//     seen: false,
//     textContent: 'Pinecone is now available!',
//     symbol: 'pinecone',
//     link: 'https://pinecone.io',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'chroma'}
//   notification={{
//     id: 2,
//     organization_id: 1,
//     seen: false,
//     textContent: 'Chroma is now available!',
//     symbol: 'chroma',
//     link: 'https://chroma.ml',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'qdrant'}
//   notification={{
//     id: 3,
//     organization_id: 1,
//     seen: false,
//     textContent: 'qDrant is now available!',
//     symbol: 'qdrant',
//     link: 'https://qdrant.tech',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'weaviate'}
//   notification={{
//     id: 4,
//     organization_id: 1,
//     seen: false,
//     textContent: 'Weaviate is now available!',
//     symbol: 'weaviate',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'error'}
//   notification={{
//     id: 5,
//     organization_id: 1,
//     seen: true,
//     textContent: 'Something went wrong!',
//     symbol: 'error',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'warning'}
//   notification={{
//     id: 6,
//     organization_id: 1,
//     seen: true,
//     textContent: 'Something went wrong!',
//     symbol: 'warning',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
// <Notification
//   key={'info'}
//   notification={{
//     id: 7,
//     organization_id: 1,
//     seen: false,
//     textContent: 'Something went wrong!',
//     symbol: 'info',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />{' '}
// <Notification
//   key={'info'}
//   notification={{
//     id: 7,
//     organization_id: 1,
//     seen: true,
//     textContent: 'Something went wrong!',
//     symbol: 'info',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />{' '}
// <Notification
//   key={'info'}
//   notification={{
//     id: 7,
//     organization_id: 1,
//     seen: false,
//     textContent: 'Something went wrong!',
//     symbol: 'info',
//     link: 'https://weaviate.com',
//     target: '_blank',
//     createdAt: '2021-10-12T12:00:00Z',
//     lastUpdatedAt: '2021-10-12T12:00:00Z',
//   }}
// />
