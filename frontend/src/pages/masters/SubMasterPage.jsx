/**
 * SubMasterPage — Route-driven wrapper around GenericMasterForm.
 *
 * Reads the :entity param from the URL and resolves the matching
 * config from subMasterConfigs, then renders GenericMasterForm.
 */
import { useParams, Navigate } from 'react-router-dom';
import GenericMasterForm from '../../components/GenericMasterForm';
import { ALL_SUB_MASTERS } from '../../config/subMasterConfigs';

export default function SubMasterPage() {
  const { entity } = useParams();
  const config = ALL_SUB_MASTERS.find(c => c.entity === entity);

  if (!config) {
    return <Navigate to="/" replace />;
  }

  // Use entity as key to force remount when navigating between different masters
  return <GenericMasterForm key={entity} config={config} />;
}
