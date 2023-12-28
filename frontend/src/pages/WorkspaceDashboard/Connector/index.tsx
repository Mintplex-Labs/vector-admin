import { useEffect, useState } from 'react';
import Organization from '../../../models/organization';
import { SUPPORTED_VECTOR_DBS } from '../../../utils/constants';
import { SyncConnectorModal } from '../../../components/Modals/SyncConnectorModal';

export default function ConnectorCard({
  knownConnector,
  organization,
  workspaces,
}: {
  knownConnector?: any;
  organization?: any;
  workspaces?: any[];
}) {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<object | null>(null);
  const [canSync, setCanSync] = useState(false);

  useEffect(() => {
    async function fetchConnector() {
      if (!!knownConnector) {
        if (SUPPORTED_VECTOR_DBS.includes(knownConnector.type)) {
          const { value: result } = await Organization.stats(
            organization.slug,
            'vectorCounts'
          );

          if (!!result) {
            if (
              result.remoteCount > 0 &&
              result.remoteCount !== result.localCount
            )
              setCanSync(true);
          }
        }

        setLoading(false);
        setConnector(knownConnector);
        return;
      }

      setLoading(false);
    }
    fetchConnector();
  }, []);

  async function handleNewConnector(connector: object) {
    if (!connector) return;
    setLoading(true);

    if (SUPPORTED_VECTOR_DBS.includes(connector.type)) {
      const { value: result } = await Organization.stats(
        organization.slug,
        'vectorCounts'
      );

      if (!!result) {
        if (result.remoteCount > 0 && result.remoteCount !== result.localCount)
          setCanSync(true);
      }
    }

    setConnector(connector);
    setLoading(false);
  }

  return (
    <>
      <SyncConnectorModal organization={organization} connector={connector} />
    </>
  );
}
