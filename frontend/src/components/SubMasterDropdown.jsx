import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { subMasterAPI } from '../services/api';

/**
 * SubMasterDropdown — reusable dropdown with inline Add / Edit / Delete for SubMaster values.
 * Renders as a custom select dropdown menu where each item has Edit and Delete icons.
 */
export default function SubMasterDropdown({
  label,
  name,
  value,
  entity,
  category,
  options,
  onChange,
  onOptionsRefresh,
  required = false,
  disabled = false,
  placeholder = '-- Select --',
  onKeyDown,
  filterFn,
  allowCustom = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [addingMode, setAddingMode] = useState(false);
  const [addingText, setAddingText] = useState('');
  const [busy, setBusy] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const withIdsList = options?.masters_with_ids?.[entity] || [];

  // Reset highlighted index when dropdown is toggled or search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [isOpen, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setEditingId(null);
        setAddingMode(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter list by search term and optional filterFn
  const filteredList = withIdsList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterFn ? filterFn(item) : true;
    return matchesSearch && matchesFilter;
  });

  // ---- ADD ----
  const handleSaveNew = async () => {
    if (!addingText.trim() || busy) return;
    setBusy(true);
    try {
      await subMasterAPI.create(entity, {
        entity,
        name: addingText.trim(),
        is_active: true,
      });
      onChange(name, addingText.trim());
      setAddingMode(false);
      setAddingText('');
      setIsOpen(false);
      if (onOptionsRefresh) onOptionsRefresh();
    } catch (err) {
      console.error('Failed to add', err);
      alert(`Failed to add new ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  // ---- EDIT ----
  const handleSaveEdit = async (id) => {
    if (!editingText.trim() || busy) return;
    setBusy(true);
    try {
      await subMasterAPI.update(entity, id, {
        entity,
        name: editingText.trim(),
        is_active: true,
      });
      // If we are updating the currently selected value, update parent form state
      const record = withIdsList.find(r => r.id === id);
      if (record && record.name === value) {
        onChange(name, editingText.trim());
      }
      setEditingId(null);
      setEditingText('');
      if (onOptionsRefresh) onOptionsRefresh();
    } catch (err) {
      console.error('Failed to edit', err);
      alert(`Failed to update ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  // ---- DELETE ----
  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setBusy(true);
      try {
        await subMasterAPI.delete(entity, item.id);
        if (value === item.name) {
          onChange(name, '');
        }
        if (onOptionsRefresh) onOptionsRefresh();
      } catch (err) {
        console.error('Failed to delete', err);
        alert(`Failed to delete ${label}.`);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || disabled) return;

    // If in editing or adding mode, let those inputs handle key events
    if (addingMode || editingId !== null) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex(prev => {
        if (filteredList.length === 0) return -1;
        const next = prev + 1;
        return next >= filteredList.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex(prev => {
        if (filteredList.length === 0) return -1;
        const next = prev - 1;
        return next < 0 ? filteredList.length - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedIndex >= 0 && highlightedIndex < filteredList.length) {
        onChange(name, filteredList[highlightedIndex].name);
        setIsOpen(false);
      }
    } else if (e.key === ' ') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredList.length) {
        e.preventDefault();
        e.stopPropagation();
        onChange(name, filteredList[highlightedIndex].name);
        setIsOpen(false);
      } else {
        // If not navigating/highlighting, let the space key type a character but stop propagation
        e.stopPropagation();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
    }
  };

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
        <span style={{ color: value ? 'inherit' : '#9ca3af', fontSize: '14px' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} style={{ color: '#9ca3af' }} />
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
              e.preventDefault();
            }
          }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            marginTop: '4px',
            overflow: 'hidden'
          }}
        >
          {/* Search bar */}
          <input
            autoFocus
            type="text"
            className="form-control"
            style={{
              margin: '8px',
              width: 'calc(100% - 16px)',
              fontSize: '13px',
              padding: '6px 8px',
              border: '1px solid var(--border)',
              borderRadius: '6px'
            }}
            placeholder={`Search ${label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              const navKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', ' '];
              if (!navKeys.includes(e.key)) {
                e.stopPropagation();
              }
            }}
          />

          {/* List items */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredList.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              filteredList.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={item.id}
                    ref={el => {
                      if (el && isHighlighted) {
                        el.scrollIntoView({ block: 'nearest' });
                      }
                    }}
                    onClick={() => {
                      if (editingId !== item.id) {
                        onChange(name, item.name);
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
                      background: isHighlighted ? '#e0e7ff' : (value === item.name ? '#f3f4f6' : '#fff')
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                  >
                    {editingId === item.id ? (
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
                              handleSaveEdit(item.id);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0 6px', height: '28px', display: 'flex', alignItems: 'center' }}
                          onClick={() => handleSaveEdit(item.id)}
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
                        <span style={{ fontWeight: value === item.name ? 600 : 400 }}>{item.name}</span>
                        {allowCustom && (
                          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <button
                              type="button"
                              title="Edit option"
                              onClick={(e) => {
                                e.stopPropagation();
                                const itemId = item.id;
                                const itemName = item.name;
                                setTimeout(() => {
                                  setEditingId(itemId);
                                  setEditingText(itemName);
                                }, 0);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete option"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeout(() => handleDelete(item), 0);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center'
                              }}
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
        </div>
      )}
    </div>
  );
}
