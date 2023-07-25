import { useEffect, useState } from 'react';
import { Copy } from 'react-feather';
import PreLoader from '../../../components/Preloader';
import Organization from '../../../models/organization';
import { APP_NAME } from '../../../utils/constants';

export default function ApiKeyCard({ organization }: { organization?: any }) {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApi() {
      if (!organization?.slug) return;
      const orgApiKey = await Organization.apiKey(organization.slug);
      setApiKey(orgApiKey.apiKey);
      setLoading(false);
    }
    fetchApi();
  }, [organization?.slug]);

  return (
    <div className="rounded-md border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex flex-col gap-y-2">
        <p className="font-semibold text-slate-800">Copy API Key</p>
        <p className="text-sm text-slate-600">
          For use of syncing {APP_NAME} with your workflows programmatically.
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between">
        {loading ? <PreLoader /> : <ApiKey secret={apiKey} />}
      </div>
    </div>
  );
}

const ApiKey = ({ secret }: { secret: string | null }) => {
  const [show, setShow] = useState(false);
  const copyCode = () => {
    if (!secret) return;
    setShow(true);
    window.navigator.clipboard.writeText(secret);
    return;
  };

  const displaySecret = () => {
    if (!secret) return '';
    if (show) {
      return secret;
    }

    const sections = secret.split('vdms-')?.[1]?.split('-');
    return (
      'vdms-' +
      sections
        .map((section, i) => {
          if (i < sections.length)
            return section
              .split('')
              .map(() => '*')
              .join('');
          return section;
        })
        .join('-')
    );
  };

  useEffect(() => {
    if (!show) return;
    setTimeout(() => {
      setShow(false);
    }, 3500);
  }, [show]);

  return (
    <li className="mb-2 flex w-full flex-row justify-between border-gray-400">
      <div className="no-scroll relative flex flex-1 items-center overflow-hidden rounded-md border bg-white px-4 py-2 shadow">
        <div className="flex w-fit flex-1 items-center justify-start gap-x-4">
          <p className="overflow-x-scroll whitespace-nowrap font-semibold text-gray-500">
            {displaySecret()}
          </p>
        </div>
        <div className="absolute right-0 flex w-fit items-center gap-x-2">
          <button onClick={copyCode} className="w-fit bg-white p-1 text-right">
            <div
              className="group flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
              title="Copy the api key"
            >
              {show ? (
                <Copy className="h-4 w-4 animate-pulse text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              )}
            </div>
          </button>
        </div>
      </div>
    </li>
  );
};
