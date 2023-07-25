import { memo, useState, useEffect } from 'react';
import PreLoader from '../../../components/Preloader';
import { humanFileSize, nFormatter } from '../../../utils/numbers';
import moment from 'moment';
import Organization from '../../../models/organization';
import pluralize from 'pluralize';

const Statistics = ({ organization }: { organization: any }) => {
  const [documents, setDocuments] = useState({
    status: 'loading',
    value: 0,
  });
  const [vectors, setVectors] = useState({
    status: 'loading',
    value: 0,
  });
  const [cache, setCache] = useState({
    status: 'loading',
    value: 0,
  });

  useEffect(() => {
    async function collectStats() {
      if (!organization?.slug) return false;

      Organization.stats(organization.slug, 'documents').then((json) => {
        setDocuments({ status: 'complete', value: json.value });
      });
      Organization.stats(organization.slug, 'vectors').then((json) => {
        setVectors({ status: 'complete', value: json.value });
      });
      Organization.stats(organization.slug, 'cache-size').then((json) => {
        setCache({ status: 'complete', value: json.value });
      });
    }
    collectStats();
  }, [organization?.slug]);

  return (
    <div className="col-span-12 rounded-md border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark xl:border-b-0 xl:border-r xl:pb-0">
          {documents.status === 'loading' ? (
            <PreLoader />
          ) : (
            <div className="flex flex-col items-center">
              <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
                {nFormatter(documents.value)}
              </h4>
              <p className="text-sm font-medium">
                {pluralize('Document', documents.value)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark xl:border-b-0 xl:border-r xl:pb-0">
          {vectors.status === 'loading' ? (
            <PreLoader />
          ) : (
            <div className="flex flex-col items-center">
              <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
                {nFormatter(vectors.value)}
              </h4>
              <p className="text-sm font-medium">
                {pluralize('Vector', vectors.value)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 border-b border-stroke pb-5 dark:border-strokedark sm:border-b-0 sm:pb-0 xl:border-r">
          {cache.status === 'loading' ? (
            <PreLoader />
          ) : (
            <div className="flex flex-col items-center">
              <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
                {humanFileSize(cache.value)}
              </h4>
              <p className="text-sm font-medium">Vector Cache (MB)</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center">
            <h4 className="mb-0.5 text-xl font-bold text-black dark:text-white md:text-title-lg">
              {organization?.lastUpdated
                ? moment.unix(organization.lastUpdated).fromNow()
                : moment.unix(organization.createdAt).fromNow()}
            </h4>
            <p className="text-sm font-medium">Last Modified</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Statistics);
