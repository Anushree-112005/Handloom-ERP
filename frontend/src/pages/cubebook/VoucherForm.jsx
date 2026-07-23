import React, { useState, useEffect } from 'react';
import './VoucherForm.css';

// Mock API call to get ledgers
const fetchLedgers = async () => {
    // In real app, fetch from /api/v1/ledgers
    return [
        { id: 1, name: 'Cash', group: 'Cash-in-hand' },
        { id: 2, name: 'Bank Account', group: 'Bank Accounts' },
        { id: 3, name: 'Sales Account', group: 'Sales Accounts' },
        { id: 4, name: 'Purchase Account', group: 'Purchase Accounts' },
        { id: 5, name: 'John Doe (Debtor)', group: 'Sundry Debtors' }
    ];
};

// Mock API call to get voucher types
const fetchVoucherTypes = async () => {
    return [
        { id: 1, name: 'Payment', prefix: 'PYMT' },
        { id: 2, name: 'Receipt', prefix: 'RCPT' },
        { id: 3, name: 'Journal', prefix: 'JRNL' },
        { id: 4, name: 'Contra', prefix: 'CNTR' }
    ];
};

const VoucherForm = () => {
    const [ledgers, setLedgers] = useState([]);
    const [voucherTypes, setVoucherTypes] = useState([]);
    
    const [formData, setFormData] = useState({
        voucher_type_id: '',
        voucher_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        narration: ''
    });

    const [entries, setEntries] = useState([
        { id: Date.now(), ledger_id: '', debit_amount: '', credit_amount: '', dr_cr: 'DR' },
        { id: Date.now() + 1, ledger_id: '', debit_amount: '', credit_amount: '', dr_cr: 'CR' }
    ]);

    const [totals, setTotals] = useState({ debit: 0, credit: 0 });
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load reference data
        fetchLedgers().then(setLedgers);
        fetchVoucherTypes().then(setVoucherTypes);
    }, []);

    useEffect(() => {
        // Calculate totals
        let drTotal = 0;
        let crTotal = 0;
        entries.forEach(entry => {
            if (entry.dr_cr === 'DR') drTotal += parseFloat(entry.debit_amount) || 0;
            if (entry.dr_cr === 'CR') crTotal += parseFloat(entry.credit_amount) || 0;
        });
        setTotals({ debit: drTotal, credit: crTotal });
    }, [entries]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEntryChange = (id, field, value) => {
        setEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                const updated = { ...entry, [field]: value };
                // Logic to clear opposing amount if DR/CR changes
                if (field === 'dr_cr') {
                    if (value === 'DR') {
                        updated.debit_amount = updated.credit_amount;
                        updated.credit_amount = '';
                    } else {
                        updated.credit_amount = updated.debit_amount;
                        updated.debit_amount = '';
                    }
                }
                return updated;
            }
            return entry;
        }));
    };

    const addRow = () => {
        setEntries(prev => [...prev, { id: Date.now(), ledger_id: '', debit_amount: '', credit_amount: '', dr_cr: 'DR' }]);
    };

    const removeRow = (id) => {
        if (entries.length <= 2) return; // keep at least 2 rows
        setEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const isBalanced = totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.01;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isBalanced) {
            setError("Cannot submit: Voucher is unbalanced. Total Debit must equal Total Credit.");
            return;
        }

        const payload = {
            ...formData,
            entries: entries.map(e => ({
                ledger_id: parseInt(e.ledger_id),
                debit_amount: parseFloat(e.debit_amount) || 0,
                credit_amount: parseFloat(e.credit_amount) || 0,
            }))
        };

        try {
            console.log("Submitting:", payload);
            // In real app, POST to /api/v1/vouchers/
            alert("Voucher saved successfully!");
            // Reset form
            setFormData({
                voucher_type_id: '',
                voucher_date: new Date().toISOString().split('T')[0],
                reference_number: '',
                narration: ''
            });
            setEntries([
                { id: Date.now(), ledger_id: '', debit_amount: '', credit_amount: '', dr_cr: 'DR' },
                { id: Date.now() + 1, ledger_id: '', debit_amount: '', credit_amount: '', dr_cr: 'CR' }
            ]);
        } catch (err) {
            setError(err.message || "Failed to save voucher");
        }
    };

    return (
        <div className="voucher-container">
            <div className="voucher-card">
                <div className="voucher-header-title">
                    <span>Accounting Voucher Entry</span>
                    {isBalanced && <span style={{fontSize: '14px', color: '#38a169', background: '#f0fff4', padding: '4px 12px', borderRadius: '12px'}}>Balanced</span>}
                </div>
                
                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="voucher-form-grid">
                        <div className="form-group">
                            <label className="form-label">Voucher Type</label>
                            <select 
                                className="form-select" 
                                name="voucher_type_id" 
                                value={formData.voucher_type_id}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Select Type...</option>
                                {voucherTypes.map(vt => (
                                    <option key={vt.id} value={vt.id}>{vt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Voucher Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                name="voucher_date"
                                value={formData.voucher_date}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reference No.</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                name="reference_number"
                                value={formData.reference_number}
                                onChange={handleFormChange}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="entries-table-wrapper">
                        <table className="entries-table">
                            <thead>
                                <tr>
                                    <th style={{width: '80px'}}>DR / CR</th>
                                    <th>Particulars (Ledger)</th>
                                    <th style={{width: '150px', textAlign: 'right'}}>Debit Amount</th>
                                    <th style={{width: '150px', textAlign: 'right'}}>Credit Amount</th>
                                    <th style={{width: '80px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <select 
                                                value={entry.dr_cr}
                                                onChange={(e) => handleEntryChange(entry.id, 'dr_cr', e.target.value)}
                                            >
                                                <option value="DR">Dr</option>
                                                <option value="CR">Cr</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select 
                                                value={entry.ledger_id}
                                                onChange={(e) => handleEntryChange(entry.id, 'ledger_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Ledger...</option>
                                                {ledgers.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="number"
                                                className="amount-input"
                                                step="0.01"
                                                min="0"
                                                value={entry.debit_amount}
                                                onChange={(e) => handleEntryChange(entry.id, 'debit_amount', e.target.value)}
                                                disabled={entry.dr_cr === 'CR'}
                                                placeholder={entry.dr_cr === 'DR' ? '0.00' : ''}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number"
                                                className="amount-input"
                                                step="0.01"
                                                min="0"
                                                value={entry.credit_amount}
                                                onChange={(e) => handleEntryChange(entry.id, 'credit_amount', e.target.value)}
                                                disabled={entry.dr_cr === 'DR'}
                                                placeholder={entry.dr_cr === 'CR' ? '0.00' : ''}
                                            />
                                        </td>
                                        <td>
                                            <button 
                                                type="button" 
                                                className="btn-remove"
                                                onClick={() => removeRow(entry.id)}
                                                disabled={entries.length <= 2}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button type="button" className="btn-add" onClick={addRow}>
                        <span>+</span> Add Line
                    </button>

                    <div className="voucher-totals">
                        <div className="total-grid">
                            <div className="total-label">Totals:</div>
                            <div className={`total-value ${isBalanced ? 'total-balanced' : 'total-unbalanced'}`}>
                                {totals.debit.toFixed(2)}
                            </div>
                            <div className={`total-value ${isBalanced ? 'total-balanced' : 'total-unbalanced'}`}>
                                {totals.credit.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="voucher-footer">
                        <div className="form-group">
                            <label className="form-label">Narration</label>
                            <textarea 
                                className="form-input narration-input"
                                name="narration"
                                value={formData.narration}
                                onChange={handleFormChange}
                                placeholder="Enter voucher narration here..."
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={!isBalanced || !formData.voucher_type_id}
                        >
                            Save Voucher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VoucherForm;
