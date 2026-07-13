import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Save, X, CheckCircle, MapPin
} from 'lucide-react';
import { despatchAPI, buyerOrderAPI, subMasterAPI, dropdownAPI, partyAPI } from '../../services/api';

// Dynamic Date Formatter Utility
const getFormattedDate = (d = new Date()) => {
  return d.toISOString().split('T')[0];
};

const formatForAPI = (dateStr) => {
  return dateStr || null;
};

const formatFromAPI = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

const mapRecordToForm = (r) => {
  let extra = {};
  try {
    if (r.remarks) {
      extra = JSON.parse(r.remarks);
    }
  } catch (e) {
    // ignore
  }

  return {
    id: r.id,
    ibpo: r.ibpo || '',
    po_date: formatFromAPI(r.po_date),
    ref_no: r.ref_no || '',
    date: formatFromAPI(r.planning_date),
    planning_date: formatFromAPI(r.planning_date),
    billing_party: r.billing_party || '',
    billing_address: r.billing_address || '',
    state_code: r.state_code || '',
    design_no: r.design_no || '',
    order_no: extra.order_no || '',
    delivery_starting: formatFromAPI(r.delivery_start),
    ibpo_rate: String(r.ibpo_rate || '0'),
    certificate_type: r.certificate_type || '',
    total_planning: String(r.total_qty || '0'),
    pino: r.pino || '',
    amd_foc_mtr: String(r.amd_foc_mtr || '0'),
    party_comp_date: formatFromAPI(r.party_comp_date),
    currency: r.currency || 'INR',
    last_desp_date: formatFromAPI(r.last_desp_date),
    delivery_party: r.delivery_party || '',
    delivery_address: r.delivery_address || '',
    del_state_code: extra.del_state_code || '',
    lc_no_tt_no: r.lc_no || '',
    lc_tt_date: formatFromAPI(r.lc_date),
    total: extra.total || '',
    uom: r.uom || 'Meters',
    comp_date: formatFromAPI(r.comp_date),
    fabric_type: r.fabric_type || '',
    tot_desp_mtrs: String(r.tot_desp_mtrs || '0'),
    balance_mtrs: String(r.balance_mtrs || '0'),
    poc_no: r.point_of_contact || '',
    buyer_po_no: extra.buyer_po_no || '',
    qty: String(r.order_qty || '0'),
    patten: extra.patten || '',
    party_style: extra.party_style || '',
    po_upload: '',
    print_name: extra.print_name || '',
    merchand: r.merchant || '',
    planned_mtrs: String(r.planned_mtrs || '0'),
    tolerance_percent: String(r.tolerance_pct || '0'),
    max_despatch_qty: String(r.max_dispatch_qty || '0'),
    stock: String(r.stock || '0'),
    rate: extra.rate || '',
    other_charge: extra.other_charge || '',
    other_charges_value: extra.other_charges_value || '',
    status: r.status || 'Planned'
  };
};

export default function DespatchForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isReadOnly = location.pathname.includes('/view/');

  const [loading, setLoading] = useState(false);
  const [buyerOrdersList, setBuyerOrdersList] = useState([]);

  const merchandList = ['ABDUL', 'SUDHAKAR', 'MANOJ', 'RAMESH'];

  // Master & Submaster states
  const [dropdowns, setDropdowns] = useState({ units: [] });
  const [certTypes, setCertTypes] = useState([]);
  const [fabricTypes, setFabricTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [partiesList, setPartiesList] = useState([]);

  // Custom-Add states
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitVal, setCustomUnitVal] = useState('');
  
  const [isCustomCert, setIsCustomCert] = useState(false);
  const [customCertVal, setCustomCertVal] = useState('');

  const [isCustomFabric, setIsCustomFabric] = useState(false);
  const [customFabricVal, setCustomFabricVal] = useState('');

  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [customCurrencyVal, setCustomCurrencyVal] = useState('');

  const [isCustomDeliveryParty, setIsCustomDeliveryParty] = useState(false);
  const [customDeliveryPartyVal, setCustomDeliveryPartyVal] = useState('');

  const initialForm = {
    // Green header fields
    ibpo: '',
    po_date: '',
    ref_no: '',
    date: getFormattedDate(),

    // Left Column
    billing_party: '',
    billing_address: '',
    state_code: '',
    design_no: '',
    order_no: '',
    delivery_starting: '',
    ibpo_rate: '',
    certificate_type: '',
    total_planning: '',

    // Middle Column
    pino: '',
    amd_foc_mtr: '',
    party_comp_date: '',
    currency: 'INR',
    last_desp_date: '',

    // Right Column
    delivery_party: '',
    delivery_address: '',
    del_state_code: '',
    lc_no_tt_no: '',
    lc_tt_date: '',
    total: '',
    uom: 'Meters',
    comp_date: '',
    fabric_type: '',
    tot_desp_mtrs: '',
    balance_mtrs: '',

    // Yellow Row fields
    poc_no: '',
    buyer_po_no: '',
    qty: '',
    patten: '',
    party_style: '',
    po_upload: '',
    print_name: '',
    merchand: '',

    // Blue Row fields
    planned_mtrs: '',
    tolerance_percent: '0',
    max_despatch_qty: '',
    stock: '',
    planning_date: getFormattedDate(),
    rate: '',
    other_charge: '-',
    other_charges_value: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadDropdowns();
      await loadBuyerOrders();
      if (id) {
        await loadRecord(id);
      } else {
        await generateRefNo();
      }
      setLoading(false);
    };
    init();
  }, [id]);

  const loadRecord = async (recordId) => {
    try {
      const res = await despatchAPI.get(recordId);
      if (res.data) {
        setFormData(mapRecordToForm(res.data));
      }
    } catch (err) {
      console.error("Error loading despatch plan:", err);
    }
  };

  const generateRefNo = async () => {
    try {
      const res = await despatchAPI.list();
      if (res.data && res.data.length > 0) {
        const nextRef = String(Math.max(...res.data.map(r => Number(r.ref_no) || 0)) + 1);
        setFormData(prev => ({ ...prev, ref_no: nextRef }));
      } else {
        setFormData(prev => ({ ...prev, ref_no: '16763' }));
      }
    } catch (e) {
      console.error("Error generating Ref No:", e);
      setFormData(prev => ({ ...prev, ref_no: '16763' }));
    }
  };

  const loadDropdowns = async () => {
    try {
      const dropRes = await dropdownAPI.getAll();
      if (dropRes.data) {
        setDropdowns(dropRes.data);
        if (dropRes.data.masters) {
          setCertTypes(dropRes.data.masters.certified_type || []);
          setFabricTypes(dropRes.data.masters.fabric_type_master || []);
          setCurrencies(dropRes.data.masters.currency || []);
        }
      }

      const partyRes = await partyAPI.list();
      if (partyRes.data) setPartiesList(partyRes.data);
    } catch (e) {
      console.error("Error loading masters:", e);
    }
  };

  const loadBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrdersList(res.data);
    } catch (e) {
      console.error("Error loading buyer orders", e);
    }
  };

  const handleSaveCustom = async (entity, valState, toggleState, fieldName) => {
    if (!valState.trim()) {
      toggleState(false);
      return;
    }
    try {
      await subMasterAPI.create(entity, { entity: entity, name: valState.trim(), is_active: true });
      setFormData(prev => ({ ...prev, [fieldName]: valState.trim() }));
      toggleState(false);
      loadDropdowns();
    } catch (err) {
      console.error(`Error saving custom ${entity}:`, err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculation helper: Max Despatch Qty = Planned Mtrs * (1 + Tolerance%/100)
      if (name === 'planned_mtrs' || name === 'tolerance_percent') {
        const planned = Number(updated.planned_mtrs) || 0;
        const tolerance = Number(updated.tolerance_percent) || 0;
        updated.max_despatch_qty = String(Math.round(planned * (1 + tolerance / 100)));
      }

      // Auto calculation: Balance Mtrs = Total Planning - Tot Desp Mtrs
      if (name === 'total_planning' || name === 'tot_desp_mtrs') {
        const totalPlan = Number(updated.total_planning) || 0;
        const totDesp = Number(updated.tot_desp_mtrs) || 0;
        updated.balance_mtrs = String(totalPlan - totDesp);
      }

      return updated;
    });
  };

  const handleIbpoChange = (e) => {
    const value = e.target.value;
    handleChange(e);

    if (!value) return;

    const order = buyerOrdersList.find(o => o.ibpo_number === value);
    if (order) {
      const item = order.items && order.items.length > 0 ? order.items[0] : null;
      setFormData(prev => ({
        ...prev,
        ibpo: value,
        // Header fields
        po_date: order.order_date ? formatFromAPI(order.order_date) : prev.po_date,
        // Billing & Delivery Party/Address
        billing_party: order.party_name || prev.billing_party,
        billing_address: order.billing_address || prev.billing_address,
        delivery_party: order.party_name || prev.delivery_party,
        delivery_address: order.delivery_address || prev.delivery_address,
        // State codes
        state_code: order.state_code || prev.state_code,
        del_state_code: order.state_code || prev.del_state_code,
        // Dates from order
        party_comp_date: order.party_comp_date ? formatFromAPI(order.party_comp_date) : prev.party_comp_date,
        delivery_starting: order.delivery_starting ? formatFromAPI(order.delivery_starting) : prev.delivery_starting,
        // Personnel
        merchand: order.order_taken_by || order.merchandiser || prev.merchand,
        // Certificate type
        certificate_type: order.certified_type || prev.certificate_type,
        // Item-level fields
        design_no: item?.design_no || prev.design_no,
        qty: item ? String(item.order_mtrs || '') : prev.qty,
        buyer_po_no: item?.party_po_no || prev.buyer_po_no,
        total_planning: item ? String(item.order_mtrs || '') : prev.total_planning,
        uom: item?.uom || prev.uom,
        tolerance_percent: item ? String(item.tolerance_pct || '0') : prev.tolerance_percent,
        fabric_type: item?.fabric_type || prev.fabric_type,
        currency: item?.currency || prev.currency,
        poc_no: item?.point_of_contact || prev.poc_no,
        party_style: item?.buyer_style || prev.party_style,
        patten: item?.pattern || prev.patten,
        print_name: item?.print_name || prev.print_name,
        rate: item ? String(item.rate || '') : prev.rate,
        ibpo_rate: item ? String(item.rate || '') : prev.ibpo_rate,
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const extra = {
      order_no: formData.order_no,
      del_state_code: formData.del_state_code,
      total: formData.total,
      buyer_po_no: formData.buyer_po_no,
      patten: formData.patten,
      party_style: formData.party_style,
      print_name: formData.print_name,
      rate: formData.rate,
      other_charge: formData.other_charge,
      other_charges_value: formData.other_charges_value,
    };
    const payload = {
      ibpo: formData.ibpo || null,
      po_date: formatForAPI(formData.po_date),
      ref_no: formData.ref_no?.trim() || null,
      planning_date: formatForAPI(formData.planning_date || formData.date),
      billing_party: formData.billing_party || null,
      delivery_party: formData.delivery_party || null,
      billing_address: formData.billing_address || null,
      delivery_address: formData.delivery_address || null,
      state_code: formData.state_code || null,
      design_no: formData.design_no || null,
      pino: formData.pino || null,
      order_qty: Number(formData.qty) || 0,
      amd_foc_mtr: Number(formData.amd_foc_mtr) || 0,
      total_qty: Number(formData.total_planning) || 0,
      uom: formData.uom || "MTR",
      delivery_start: formatForAPI(formData.delivery_starting),
      party_comp_date: formatForAPI(formData.party_comp_date),
      comp_date: formatForAPI(formData.comp_date),
      lc_no: formData.lc_no_tt_no || null,
      lc_date: formatForAPI(formData.lc_tt_date),
      ibpo_rate: Number(formData.ibpo_rate) || 0,
      currency: formData.currency || "INR",
      certificate_type: formData.certificate_type || null,
      fabric_type: formData.fabric_type || null,
      planned_mtrs: Number(formData.planned_mtrs) || 0,
      tolerance_pct: Number(formData.tolerance_percent) || 0,
      max_dispatch_qty: Number(formData.max_despatch_qty) || 0,
      stock: Number(formData.stock) || 0,
      tot_desp_mtrs: Number(formData.tot_desp_mtrs) || 0,
      balance_mtrs: Number(formData.balance_mtrs) || 0,
      last_desp_date: formatForAPI(formData.last_desp_date),
      merchant: formData.merchand || null,
      point_of_contact: formData.poc_no || null,
      remarks: JSON.stringify(extra),
      status: formData.status || "Planned"
    };

    try {
      if (id) {
        await despatchAPI.update(id, payload);
      } else {
        await despatchAPI.create(payload);
      }
      navigate('/despatch');
    } catch (err) {
      console.error("Error saving despatch plan:", err);
      alert(err.response?.data?.detail || "Error saving despatch plan");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading form...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Header Dashboard Bar with Back Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/despatch')}
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: '50%', 
            width: 40, 
            height: 40, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            color: 'var(--text-primary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          title="Back to List"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <MapPin size={26} color="var(--primary)" /> 
            {isReadOnly ? 'View Despatch Plan' : id ? `Edit Despatch Plan: Ref ${formData.ref_no}` : 'New Despatch Plan'}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {isReadOnly ? 'Read-only specification details' : 'Enter buyer order despatch planning specifications below'}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>

        <div style={{ padding: 32, background: '#fff' }}>
          <form id="despatchForm" onSubmit={handleSubmit}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {/* SECTION 1 */}
              <div id="general-section" className="animate-fade" style={{ marginBottom: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Basic Details</h4>
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  borderLeft: '4px solid #10b981', 
                  borderRadius: '8px', 
                  padding: '16px 20px', 
                  margin: '0 0 16px 0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 16
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>IBPO (Select to Auto-Fill)</label>
                    <select className="form-control" name="ibpo" value={formData.ibpo} onChange={handleIbpoChange} style={{ borderColor: '#a7f3d0' }}>
                      <option value="">Select IBPO - Party Name</option>
                      {buyerOrdersList.map(o => (
                        <option key={o.id} value={o.ibpo_number}>
                          {o.ibpo_number} - {o.party_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>PO Date</label>
                    <input type="date" className="form-control" name="po_date" value={formData.po_date} onChange={handleChange} style={{ borderColor: '#a7f3d0' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>Ref No</label>
                    <input type="text" className="form-control" name="ref_no" value={formData.ref_no} onChange={handleChange} required style={{ borderColor: '#a7f3d0' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>Date</label>
                    <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} style={{ borderColor: '#a7f3d0' }} />
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div id="planning-section" className="animate-fade" style={{ marginBottom: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Planning & Delivery</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, margin: '0 0 16px 0' }}>
                  
                  {/* COLUMN 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Billing Party</label>
                      <select className="form-control" name="billing_party" value={formData.billing_party} onChange={handleChange}>
                        <option value="">Select Billing Party</option>
                        {partiesList.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Billing Address</label>
                      <textarea className="form-control" name="billing_address" value={formData.billing_address} onChange={handleChange} rows={2} style={{ resize: 'none' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>State/Code</label>
                      <input className="form-control" name="state_code" value={formData.state_code} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Design No</label>
                      <select 
                        className="form-control" 
                        name="design_no" 
                        value={formData.design_no} 
                        onChange={handleChange}
                      >
                        <option value="">Select Design No</option>
                        {dropdowns.masters?.design_no_master?.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Order</label>
                      <input className="form-control" name="order_no" value={formData.order_no} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Delivery Starting</label>
                      <input type="date" className="form-control" name="delivery_starting" value={formData.delivery_starting} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>IBPO Rate</label>
                      <input className="form-control" name="ibpo_rate" value={formData.ibpo_rate} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Certificate Type</label>
                      {isCustomCert ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            autoFocus 
                            className="form-control" 
                            style={{ margin: 0, flex: 1 }}
                            value={customCertVal} 
                            onChange={e => setCustomCertVal(e.target.value)} 
                            placeholder="Enter custom type..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('certified_type', customCertVal, setIsCustomCert, 'certificate_type')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomCert(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-control" 
                          name="certificate_type" 
                          value={formData.certificate_type} 
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setCustomCertVal('');
                              setIsCustomCert(true);
                            } else {
                              handleChange(e);
                            }
                          }}
                        >
                          <option value="">Select Certificate</option>
                          {certTypes.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__ADD_NEW__">+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Total Planning</label>
                      <input className="form-control" name="total_planning" value={formData.total_planning} onChange={handleChange} />
                    </div>
                  </div>

                  {/* COLUMN 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>PINO</label>
                      <input className="form-control" name="pino" value={formData.pino} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>AMD/FOC Mtr</label>
                      <input className="form-control" name="amd_foc_mtr" value={formData.amd_foc_mtr} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Party Comp Date</label>
                      <input type="date" className="form-control" name="party_comp_date" value={formData.party_comp_date} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Currency</label>
                      {isCustomCurrency ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            autoFocus 
                            className="form-control" 
                            style={{ margin: 0, flex: 1 }}
                            value={customCurrencyVal} 
                            onChange={e => setCustomCurrencyVal(e.target.value)} 
                            placeholder="Add currency..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('currency_master', customCurrencyVal, setIsCustomCurrency, 'currency')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomCurrency(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-control" 
                          name="currency" 
                          value={formData.currency} 
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setCustomCurrencyVal('');
                              setIsCustomCurrency(true);
                            } else {
                              handleChange(e);
                            }
                          }}
                        >
                          <option value="">Select Currency</option>
                          <option value="INR">INR - Indian Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          {currencies.filter(c => !["INR", "USD", "EUR"].includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__ADD_NEW__">+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Last Desp Date</label>
                      <input type="date" className="form-control" name="last_desp_date" value={formData.last_desp_date} onChange={handleChange} />
                    </div>
                  </div>

                  {/* COLUMN 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Delivery Party</label>
                      {isCustomDeliveryParty ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            autoFocus 
                            className="form-control" 
                            style={{ margin: 0, flex: 1 }}
                            value={customDeliveryPartyVal} 
                            onChange={e => setCustomDeliveryPartyVal(e.target.value)} 
                            placeholder="Add party name..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={async () => {
                            if (!customDeliveryPartyVal.trim()) return setIsCustomDeliveryParty(false);
                            try {
                              await partyAPI.create({ party_type: "Sundry Debtors", company_name: customDeliveryPartyVal });
                              setFormData(prev => ({ ...prev, delivery_party: customDeliveryPartyVal }));
                              setIsCustomDeliveryParty(false);
                              loadDropdowns();
                            } catch(e) { console.error(e); }
                          }}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomDeliveryParty(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-control" 
                          name="delivery_party" 
                          value={formData.delivery_party} 
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setCustomDeliveryPartyVal('');
                              setIsCustomDeliveryParty(true);
                            } else {
                              handleChange(e);
                            }
                          }}
                        >
                          <option value="">Select Delivery Party</option>
                          {partiesList.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                          <option value="__ADD_NEW__">+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Delivery Address</label>
                      <textarea className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleChange} rows={2} style={{ resize: 'none' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>State/Code</label>
                      <input className="form-control" name="del_state_code" value={formData.del_state_code} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>LC No / TT No</label>
                      <input className="form-control" name="lc_no_tt_no" value={formData.lc_no_tt_no} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>LC / TT Date</label>
                      <input className="form-control" name="ibpo_rate" value={formData.ibpo_rate} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Total</label>
                      <input className="form-control" name="total" value={formData.total} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>UOM</label>
                      {isCustomUnit ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            autoFocus 
                            className="form-control" 
                            style={{ margin: 0, flex: 1 }}
                            value={customUnitVal} 
                            onChange={e => setCustomUnitVal(e.target.value)} 
                            placeholder="Add unit..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={async () => {
                            if (!customUnitVal.trim()) return setIsCustomUnit(false);
                            try {
                              await subMasterAPI.create('uom_master', { entity: 'uom_master', name: customUnitVal.trim(), is_active: true });
                              setFormData(prev => ({ ...prev, uom: customUnitVal.trim() }));
                              setIsCustomUnit(false);
                              loadDropdowns();
                            } catch(e) { console.error(e); }
                          }}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomUnit(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-control" 
                          name="uom" 
                          value={formData.uom} 
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setCustomUnitVal('');
                              setIsCustomUnit(true);
                            } else {
                              handleChange(e);
                            }
                          }}
                        >
                          <option value="">Select Unit</option>
                          {dropdowns.masters?.uom_master?.map(u => <option key={u} value={u}>{u}</option>)}
                          <option value="__ADD_NEW__">+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Comp Date</label>
                      <input type="date" className="form-control" name="comp_date" value={formData.comp_date} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Fabric Type</label>
                      {isCustomFabric ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            autoFocus 
                            className="form-control" 
                            style={{ margin: 0, flex: 1 }}
                            value={customFabricVal} 
                            onChange={e => setCustomFabricVal(e.target.value)} 
                            placeholder="Add fabric..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('fabric_type_master', customFabricVal, setIsCustomFabric, 'fabric_type')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomFabric(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="form-control" 
                          name="fabric_type" 
                          value={formData.fabric_type} 
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setCustomFabricVal('');
                              setIsCustomFabric(true);
                            } else {
                              handleChange(e);
                            }
                          }}
                        >
                          <option value="">Select Fabric Type</option>
                          {fabricTypes.map(f => <option key={f} value={f}>{f}</option>)}
                          <option value="__ADD_NEW__">+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Tot Desp Mtrs</label>
                      <input className="form-control" name="tot_desp_mtrs" value={formData.tot_desp_mtrs} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Balance Mtrs</label>
                      <input className="form-control" name="balance_mtrs" value={formData.balance_mtrs} onChange={handleChange} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3 */}
              <div id="order-section" className="animate-fade" style={{ marginBottom: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Order Info</h4>
                <div style={{ 
                  background: 'rgba(234, 179, 8, 0.08)', 
                  borderLeft: '4px solid #eab308', 
                  borderRadius: '8px', 
                  padding: '20px 24px', 
                  margin: '0 0 16px 0'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Point of Contact/No</label>
                      <input className="form-control" name="poc_no" value={formData.poc_no} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Buyer PO No</label>
                      <input className="form-control" name="buyer_po_no" value={formData.buyer_po_no} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Qty</label>
                      <input className="form-control" name="qty" value={formData.qty} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Patten</label>
                      <input className="form-control" name="patten" value={formData.patten} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Party Style</label>
                      <input className="form-control" name="party_style" value={formData.party_style} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>PO Upload</label>
                      <input type="file" className="form-control" style={{ borderColor: '#fef08a', padding: '4px 12px' }} disabled={isReadOnly} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Print Name</label>
                      <input className="form-control" name="print_name" value={formData.print_name} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Merchand</label>
                      <select className="form-control" name="merchand" value={formData.merchand} onChange={handleChange} style={{ borderColor: '#fef08a' }}>
                        <option value="">Select Merchandiser</option>
                        {merchandList.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="logistics-section" className="animate-fade" style={{ marginBottom: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Logistics & Stock</h4>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  borderLeft: '4px solid #3b82f6', 
                  borderRadius: '8px', 
                  padding: '20px 24px', 
                  margin: '0 0 16px 0'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Planned Mtrs</label>
                      <input className="form-control" name="planned_mtrs" value={formData.planned_mtrs} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Tolerance %</label>
                      <select className="form-control" name="tolerance_percent" value={formData.tolerance_percent} onChange={handleChange} style={{ borderColor: '#bfdbfe' }}>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Max Despatch Qty</label>
                      <input className="form-control" name="max_despatch_qty" value={formData.max_despatch_qty} onChange={handleChange} readOnly style={{ borderColor: '#bfdbfe', background: 'var(--bg-secondary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Stock</label>
                      <input className="form-control" name="stock" value={formData.stock} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Planning Date</label>
                      <input type="date" className="form-control" name="planning_date" value={formData.planning_date} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Rate</label>
                      <input className="form-control" name="rate" value={formData.rate} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Other Charge</label>
                      <select className="form-control" name="other_charge" value={formData.other_charge} onChange={handleChange} style={{ borderColor: '#bfdbfe' }}>
                        <option value="-">-</option>
                        <option value="Freight">Freight</option>
                        <option value="Loading">Loading charges</option>
                        <option value="Insurance">Transit Insurance</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Other Charges Value</label>
                      <input className="form-control" name="other_charges_value" value={formData.other_charges_value} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* MOVE CLOSE & SAVE BUTTON TO BOTTOM RIGHT SIDE */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '20px 32px 32px 32px', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/despatch')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <X size={16} /> Close
                </button>
                {!isReadOnly && (
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Save size={16} /> {id ? 'Update Plan' : 'Save Plan'}
                  </button>
                )}
              </div>

            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
