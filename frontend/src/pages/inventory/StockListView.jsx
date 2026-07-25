import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import GenericStockTable from '../../components/inventory/GenericStockTable';

export default function StockListView() {
  const location = useLocation();
  const params = useParams();

  let title = "Inventory Management";
  let category = "";
  let locationType = "";
  let isAlerts = false;

  if (location.pathname.includes('/raw/yarn')) {
    title = "Yarn Stock";
    category = "yarn";
  } else if (location.pathname.includes('/raw/consumables')) {
    title = "Chemicals & Consumables Stock";
    category = "consumables";
  } else if (location.pathname.includes('/wip/')) {
    const unit = params.unit ? params.unit.toUpperCase() : '';
    title = `WIP Stock: At ${unit.charAt(0) + unit.slice(1).toLowerCase()} Unit`;
    locationType = `${unit}_UNIT`;
  } else if (location.pathname.includes('/finished/')) {
    const type = params.type ? params.type.toUpperCase() : '';
    title = `Finished Goods: ${type.charAt(0) + type.slice(1).toLowerCase()} Fabric`;
    category = "fabric";
    // Assuming Finished goods are just stored with status AVAILABLE but they might have location_type FINISHED_GODOWN
    locationType = "FINISHED_GODOWN";
  } else if (location.pathname.includes('/godown-transfer')) {
    title = "Godown Transfer";
    locationType = "MAIN_GODOWN";
  } else if (location.pathname.includes('/surplus-stock')) {
    title = "Surplus Stock";
    category = "surplus";
  } else if (location.pathname.includes('/spares-stock')) {
    title = "Spares Stock";
    category = "spares";
  } else if (location.pathname.includes('/lot-reconciliation')) {
    title = "Lot Reconciliation";
  } else if (location.pathname.includes('/alerts')) {
    title = "Low Stock Alerts";
    isAlerts = true;
  } else {
    title = "Stock Register";
  }

  return (
    <div style={{ padding: '24px' }}>
      <GenericStockTable 
        title={title} 
        category={category} 
        locationType={locationType} 
        isAlerts={isAlerts}
      />
    </div>
  );
}
