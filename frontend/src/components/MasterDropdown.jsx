import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, Edit2, Trash2, ChevronDown, Loader } from 'lucide-react';
import { storesService } from '../services/storesService';
import { subMasterAPI } from '../services/api';
import { confirmDialog, alertDialog } from '../utils/dialogs';



/**
 * MasterDropdown - Reusable searchable dropdown component for Master and SubMaster records.
 * Matches the Party Master dropdown customization UX with inline Add/Edit/Delete and modal support.
 */
export default function MasterDropdown({
  label,
  name,
  value,
  entityType, // Explicit entity type: 'category', 'uom', 'vendor', 'department', 'item', 'procurement_vendor', or null
  entity, // For sub-master dynamic options (e.g. 'party_type')
  options: propOptions, // For static or parent-supplied lists
  onChange,
  onOptionsRefresh,
  required = false,
  disabled = false,
  placeholder = '---select----',
  onKeyDown,
  allowCustom = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState(propOptions || []);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [addingMode, setAddingMode] = useState(false);
  const [addingText, setAddingText] = useState('');

  const containerRef = useRef(null);

  const handleChange = (val) => {
    if (onChange) {
      if (name !== undefined) {
        onChange(name, val);
      } else {
        onChange(val);
      }
    }
  };

  // Configuration map for core entity types
  const config = {
    category: {
      fetch: storesService.getCategories,
      create: (name) => storesService.createCategory({ category_name: name, category_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteCategory,
      update: (id, name) => storesService.updateCategory(id, { category_name: name }),
      displayKey: 'category_name'
    },
    uom: {
      fetch: storesService.getUOMs,
      create: (name) => storesService.createUOM({ uom_name: name, uom_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteUOM,
      update: (id, name) => storesService.updateUOM(id, { uom_name: name }),
      displayKey: 'uom_name'
    },
    vendor: {
      fetch: storesService.getVendors,
      create: (name) => storesService.createVendor({ vendor_name: name, vendor_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteVendor,
      update: (id, name) => storesService.updateVendor(id, { vendor_name: name }),
      displayKey: 'vendor_name'
    },
    procurement_vendor: {
      fetch: storesService.getProcurementVendors,
      create: (name) => storesService.createProcurementVendor({ vendor_name: name, vendor_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteProcurementVendor,
      update: (id, name) => storesService.updateProcurementVendor(id, { vendor_name: name }),
      displayKey: 'vendor_name'
    },
    department: {
      fetch: storesService.getDepartments,
      create: (name) => storesService.createDepartment({ department_name: name, department_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteDepartment,
      update: (id, name) => storesService.updateDepartment(id, { department_name: name }),
      displayKey: 'department_name'
    },
    item: {
      fetch: storesService.getItems,
      create: (name) => storesService.createItem({ item_name: name, item_code: name.toUpperCase().slice(0, 10), status: 'Active' }),
      delete: storesService.deleteItem,
      update: (id, name) => storesService.updateItem(id, { item_name: name }),
      displayKey: 'item_name'
    },
    warehouse: {
      fetch: storesService.getWarehouses,
      create: (name) => storesService.createWarehouse({ warehouse_name: name, warehouse_code: name.toUpperCase().slice(0, 10), location: 'Main' }),
      delete: () => { }, // No delete API yet
      update: () => { }, // No update API yet
      displayKey: 'warehouse_name'
    },
    cost_center: {
      fetch: storesService.getCostCenters,
      create: (name) => storesService.createCostCenter({ name: name, code: name.toUpperCase().slice(0, 10) }),
      delete: () => { },
      update: () => { },
      displayKey: 'name'
    },
    budget: {
      fetch: storesService.getBudgets,
      create: (name) => storesService.createBudget({ project_code: name.toUpperCase().slice(0, 10), budget_code: name.toUpperCase().slice(0, 10), budget_allocated: 1000000 }),
      delete: () => { },
      update: () => { },
      displayKey: 'budget_code'
    },
    employee: {
      fetch: storesService.getEmployees,
      create: (name) => storesService.createEmployee({ name: name, employee_code: 'EMP-' + Math.floor(Math.random() * 1000) }),
      delete: () => { },
      update: () => { },
      displayKey: 'name'
    }
  };

  // Only use config if entityType was explicitly provided. No automatic field name guessing to prevent API mismatches.
  const resolvedEntityType = entityType || null;
  const entityConfig = resolvedEntityType ? config[resolvedEntityType] : null;

  // Foolproof helper to extract ID regardless of backend primary key naming
  const getRecordId = (item) => {
    if (typeof item !== 'object' || !item) return item;
    return item.id !== undefined ? item.id :
      item.vendor_id !== undefined ? item.vendor_id :
        item.item_id !== undefined ? item.item_id :
          item.category_id !== undefined ? item.category_id :
            item.uom_id !== undefined ? item.uom_id :
              item.department_id !== undefined ? item.department_id :
                item.warehouse_id !== undefined ? item.warehouse_id :
                  item.quotation_id !== undefined ? item.quotation_id :
                    item.value !== undefined ? item.value : item.name;
  };

  const getLocalStorageKey = () => `master_dropdown_custom_${name || label || 'default'}`;

  const getCustomMutations = () => {
    try {
      const saved = localStorage.getItem(getLocalStorageKey());
      return saved ? JSON.parse(saved) : { added: [], deleted: [], edited: {} };
    } catch (e) {
      return { added: [], deleted: [], edited: {} };
    }
  };

  const saveCustomMutations = (mutations) => {
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(mutations));
    } catch (e) {
      console.error('Failed to save custom mutations to localStorage', e);
    }
  };

  const fetchOptions = async (search = '') => {
    let baseList = [];
    if (entityConfig) {
      setLoading(true);
      try {
        const data = await entityConfig.fetch(search);
        baseList = data || [];
      } catch (err) {
        console.error(`Failed to fetch ${entityType} options`, err);
        baseList = propOptions || [];
      } finally {
        setLoading(false);
      }
    } else if (entity) {
      setLoading(true);
      try {
        const res = await subMasterAPI.list(entity, search ? { search } : {});
        baseList = res?.data || res || [];
        if (baseList.length === 0 && propOptions) {
          baseList = propOptions;
        }
      } catch (err) {
        console.error(`Failed to fetch subMaster options for ${entity}`, err);
        baseList = propOptions || [];
      } finally {
        setLoading(false);
      }
    } else {
      baseList = propOptions || [];
    }

    // Always apply custom mutations (added, deleted, edited) for immediate & persistent UI feedback
    const { added, deleted, edited } = getCustomMutations();
    let merged = [...baseList];

    added.forEach(addItem => {
      const addId = getRecordId(addItem);
      if (!merged.some(o => getRecordId(o) === addId || (o.name && o.name === addItem.name))) {
        merged.push(addItem);
      }
    });

    merged = merged
      .filter(o => {
        const oId = getRecordId(o);
        const oLabel = typeof o === 'object' ? (o.name || o.label || o.value) : o;
        return !deleted.includes(oId) && !deleted.includes(oLabel);
      })
      .map(o => {
        const oId = getRecordId(o);
        const oLabel = typeof o === 'object' ? (o.name || o.label || o.value || oId) : o;
        const newText = edited[oId] || edited[oLabel];
        if (newText !== undefined) {
          return typeof o === 'object' ? { ...o, name: newText, label: newText, value: newText, vendor_name: newText, item_name: newText, category_name: newText, uom_name: newText, department_name: newText } : newText;
        }
        return o;
      });

    if (search && (propOptions || (!entityConfig && !entity))) {
      setOptions(merged.filter(o => {
        const text = (o.name || o.label || o.id || o.vendor_name || o.item_name || o.category_name || o.uom_name || o.department_name || o).toString().toLowerCase();
        return text.includes(search.toLowerCase());
      }));
    } else {
      setOptions(merged);
    }
  };

  useEffect(() => {
    fetchOptions();
    // eslint-disable-next-line
  }, [resolvedEntityType, entity, propOptions]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOptions(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setDropdownCoords(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [isOpen, searchTerm]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.master-dropdown-portal') &&
        !e.target.closest('.submaster-dropdown-portal')
      ) {
        setIsOpen(false);
        setAddingMode(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ---- DELETE ----
  const handleDelete = async (item) => {
    const itemId = getRecordId(item);
    const itemLabel = typeof item === 'object' ? (item.name || item.label || item[entityConfig?.displayKey] || item.vendor_name || item.item_name || item.category_name || item.uom_name || item.department_name || item.value || itemId) : item;

    const confirmed = await confirmDialog({
      title: 'Delete Option',
      message: `Are you sure you want to delete "${itemLabel}"?`,
      type: 'delete',
      confirmText: 'Delete'
    });
    if (confirmed) {
      setBusy(true);
      try {
        if (entityConfig && entityConfig.delete) {
          await entityConfig.delete(itemId).catch(err => console.error('API delete error:', err));
        } else if (entity) {
          await subMasterAPI.delete(entity, itemId).catch(err => console.error('API delete error:', err));
        }

        const mutations = getCustomMutations();
        const addedIdx = mutations.added.findIndex(o => getRecordId(o) === itemId || (o.name && o.name === itemLabel));
        if (addedIdx !== -1) {
          mutations.added.splice(addedIdx, 1);
        } else {
          if (itemId && !mutations.deleted.includes(itemId)) mutations.deleted.push(itemId);
          if (itemLabel && !mutations.deleted.includes(itemLabel)) mutations.deleted.push(itemLabel);
        }
        saveCustomMutations(mutations);
        await fetchOptions(searchTerm);

        if (value === itemId || value === itemLabel || (typeof value === 'object' && getRecordId(value) === itemId)) {
          handleChange('');
        }
        if (onOptionsRefresh) onOptionsRefresh();
      } catch (err) {
        console.error('Failed to delete', err);
        alertDialog({
          title: 'Error',
          message: `Failed to delete "${itemLabel}". Please check if it is in use.`,
          type: 'error'
        });
      } finally {
        setBusy(false);
      }
    }
  };

  // ---- EDIT ----
  const handleSaveEdit = async (item) => {
    const itemId = getRecordId(item);
    const itemLabel = typeof item === 'object' ? (item.name || item.label || item[entityConfig?.displayKey] || item.vendor_name || item.item_name || item.category_name || item.uom_name || item.department_name || item.value || itemId) : item;
    if (!editingText.trim() || busy) return;
    setBusy(true);
    try {
      const newText = editingText.trim();
      if (entityConfig && entityConfig.update) {
        await entityConfig.update(itemId, newText).catch(err => console.error('API update error:', err));
      } else if (entity) {
        await subMasterAPI.update(entity, itemId, { entity, name: newText, is_active: true }).catch(err => console.error('API update error:', err));
      }

      const mutations = getCustomMutations();
      const addedIdx = mutations.added.findIndex(o => getRecordId(o) === itemId || (o.name && o.name === itemLabel));
      if (addedIdx !== -1) {
        mutations.added[addedIdx] = typeof mutations.added[addedIdx] === 'object'
          ? { ...mutations.added[addedIdx], name: newText, label: newText, value: newText, vendor_name: newText, item_name: newText, category_name: newText, uom_name: newText, department_name: newText }
          : newText;
      } else {
        if (itemId) mutations.edited[itemId] = newText;
        if (itemLabel) mutations.edited[itemLabel] = newText;
      }
      saveCustomMutations(mutations);
      await fetchOptions(searchTerm);

      if (value === itemId || value === itemLabel) {
        handleChange(typeof item === 'object' ? itemId : newText);
      }
      setEditingId(null);
      setEditingText('');
      if (onOptionsRefresh) onOptionsRefresh();
    } catch (err) {
      console.error('Failed to edit', err);
      alertDialog({
        title: 'Error',
        message: 'Failed to update option.',
        type: 'error'
      });
    } finally {
      setBusy(false);
    }
  };

  // ---- ADD ----
  const handleSaveNew = async () => {
    if (!addingText.trim() || busy) return;
    setBusy(true);
    try {
      const newText = addingText.trim();
      let createdId = newText;
      if (entityConfig && entityConfig.create) {
        const res = await entityConfig.create(newText).catch(err => {
          console.error('API create error:', err);
          return null;
        });
        if (res && (res.id || res.category_id || res.uom_id || res.vendor_id || res.department_id || res.item_id || res.value)) {
          createdId = res.id || res.category_id || res.uom_id || res.vendor_id || res.department_id || res.item_id || res.value;
        }
      } else if (entity) {
        const res = await subMasterAPI.create(entity, { entity, name: newText, is_active: true }).catch(err => {
          console.error('API create error:', err);
          return null;
        });
        if (res && (res.data?.id || res.data?.value)) {
          createdId = res.data.id || res.data.value;
        }
      }

      const newObj = { id: createdId, name: newText, label: newText, value: createdId, [entityConfig?.displayKey || 'name']: newText };
      const mutations = getCustomMutations();
      if (!mutations.added.some(o => getRecordId(o) === createdId || (o.name && o.name === newText))) {
        mutations.added.push(newObj);
        saveCustomMutations(mutations);
      }
      await fetchOptions(searchTerm);

      handleChange(createdId);
      setAddingMode(false);
      setAddingText('');
      setIsOpen(false);
      if (onOptionsRefresh) onOptionsRefresh();
    } catch (err) {
      console.error('Failed to add custom option', err);
      alertDialog({
        title: 'Error',
        message: 'Failed to add new option.',
        type: 'error'
      });
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || disabled || addingMode || editingId !== null) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex(prev => {
        if (options.length === 0) return -1;
        const next = prev + 1;
        return next >= options.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex(prev => {
        if (options.length === 0) return -1;
        const next = prev - 1;
        return next < 0 ? options.length - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const item = options[highlightedIndex];
        handleChange(getRecordId(item));
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (!value && value !== 0) return '';
    const opt = options.find(o => {
      const oId = getRecordId(o);
      return oId === value || o === value || Number(oId) === Number(value);
    }) || (propOptions && propOptions.find(o => {
      const oId = getRecordId(o);
      return oId === value || o === value || Number(oId) === Number(value);
    }));
    if (opt) {
      return typeof opt === 'object' ? (opt[entityConfig?.displayKey] || opt.name || opt.label || opt.vendor_name || opt.item_name || opt.category_name || opt.uom_name || opt.department_name || opt.id || opt.value) : opt;
    }
    return value;
  };

  const displayValue = getDisplayValue();

  return (
    <div
      className={label ? "form-group" : ""}
      ref={containerRef}
      style={{ position: 'relative', margin: label ? undefined : 0 }}
      onKeyDown={handleKeyDown}
    >
      {label && <label>{label}{required ? ' *' : ''}</label>}

      {/* Dropdown Trigger */}
      <div
        className="form-control"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          } else if (onKeyDown) {
            onKeyDown(e);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f3f4f6' : '#fff',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: label ? '8px 12px' : '4px 8px',
          minHeight: label ? '38px' : '30px',
          userSelect: 'none'
        }}
      >
        <span style={{ color: value ? 'inherit' : '#9ca3af', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && !disabled && dropdownCoords && createPortal(
        <div
          className="master-dropdown-portal"
          style={{
            position: 'absolute',
            top: `${dropdownCoords.top + 4}px`,
            left: `${dropdownCoords.left}px`,
            width: `${Math.max(dropdownCoords.width, 220)}px`,
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search bar */}
          <div style={{ position: 'relative', margin: '8px' }}>
            <input
              autoFocus
              type="text"
              className="form-control"
              style={{
                width: '100%',
                fontSize: '13px',
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                paddingRight: '24px'
              }}
              placeholder={`Search...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                const navKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
                if (!navKeys.includes(e.key)) {
                  e.stopPropagation();
                }
              }}
            />
            {loading && <Loader size={14} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
          </div>

          {/* List items */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {options.length === 0 && !loading ? (
              <div style={{ padding: '8px 12px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              options.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                const itemId = getRecordId(item);
                const isSelected = propOptions
                  ? (itemId === value || item.value === value || item.name === value || item === value || Number(itemId) === Number(value))
                  : (value === itemId || Number(value) === Number(itemId));

                const itemLabel = typeof item === 'object' ? (entityConfig ? item[entityConfig.displayKey] || item.name || item.label || item.vendor_name || item.item_name || item.category_name || item.uom_name || item.department_name || item.id : (item.name || item.label || item.vendor_name || item.item_name || item.category_name || item.uom_name || item.department_name || item.value || item.id)) : item;

                return (
                  <div
                    key={itemId || index}
                    ref={el => {
                      if (el && isHighlighted) {
                        el.scrollIntoView({ block: 'nearest' });
                      }
                    }}
                    onClick={() => {
                      if (editingId !== itemId) {
                        handleChange(propOptions ? (typeof item === 'object' ? itemId : item) : itemId);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      borderBottom: '1px solid #f3f4f6',
                      background: isHighlighted ? '#e0e7ff' : (isSelected ? '#f3f4f6' : '#fff')
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                  >
                    {editingId === itemId ? (
                      <div style={{ display: 'flex', gap: '4px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          className="form-control"
                          style={{ flex: 1, height: '28px', fontSize: '13px', padding: '2px 6px' }}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(item);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0 6px', height: '28px', display: 'flex', alignItems: 'center' }}
                          onClick={() => handleSaveEdit(item)}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0 6px', height: '28px', display: 'flex', alignItems: 'center' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTimeout(() => setEditingId(null), 0);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontWeight: isSelected ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {itemLabel}
                          </span>
                        </div>
                        {allowCustom && (
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <button
                              type="button"
                              title="Edit option"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(itemId);
                                setEditingText(itemLabel || '');
                              }}
                              style={{
                                background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                                color: 'var(--primary)', display: 'flex', alignItems: 'center'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete option"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              style={{
                                background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                                color: '#ef4444', display: 'flex', alignItems: 'center', opacity: busy ? 0.5 : 1
                              }}
                              disabled={busy}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add custom action */}
          {allowCustom && (
            addingMode ? (
              <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    autoFocus
                    className="form-control"
                    style={{ flex: 1, height: '28px', fontSize: '13px', padding: '2px 6px' }}
                    placeholder="New custom option..."
                    value={addingText}
                    onChange={(e) => setAddingText(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNew();
                      }
                      if (e.key === 'Escape') setAddingMode(false);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0 6px', height: '28px', display: 'flex', alignItems: 'center' }}
                    onClick={handleSaveNew}
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0 6px', height: '28px', display: 'flex', alignItems: 'center' }}
                    onClick={() => setAddingMode(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingMode(true);
                  setAddingText('');
                }}
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                  color: 'var(--primary)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: '#f9fafb'
                }}
              >
                + Add Custom...
              </div>
            )
          )}
        </div>,
        document.body
      )}

    </div>
  );
}

