import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Loader, 
  X 
} from 'lucide-react';

/**
 * ConfirmationModal - Standardized modern confirmation, alert, and prompt dialog for the ERP project.
 * Matches the reference UI with rounded corners (16-20px), soft shadows, smooth animations, backdrop blur,
 * dynamic headers, contextual icons, and bottom-right aligned action buttons.
 */
export default function ConfirmationModal({
  isOpen = false,
  onClose,
  onConfirm,
  title,
  message,
  description, // Alias for message
  type = 'warning', // 'delete' | 'warning' | 'success' | 'error' | 'info' | 'save' | 'update' | 'approve' | 'reject' | 'logout'
  confirmText,
  cancelText = 'Cancel',
  confirmVariant,
  closeOnOutsideClick = true,
  isPrompt = false,
  defaultValue = '',
  promptPlaceholder = 'Enter value...',
  showCancel = true
}) {
  const [busy, setBusy] = useState(false);
  const [promptValue, setPromptValue] = useState(defaultValue);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPromptValue(defaultValue);
      setBusy(false);
      // Trigger smooth scale + fade animation
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen, defaultValue]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  const displayMessage = message || description || '';

  // Determine Dialog Type Details (Icon, Color, Title fallback, Button variant)
  const getTypeConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 size={24} style={{ color: '#dc2626' }} />,
          iconBg: '#fee2e2',
          defaultTitle: 'Delete Record',
          defaultConfirm: 'Delete',
          variant: 'danger'
        };
      case 'logout':
        return {
          icon: <AlertTriangle size={24} style={{ color: '#dc2626' }} />,
          iconBg: '#fee2e2',
          defaultTitle: 'Logout Confirmation',
          defaultConfirm: 'Logout',
          variant: 'danger'
        };
      case 'reject':
        return {
          icon: <XCircle size={24} style={{ color: '#dc2626' }} />,
          iconBg: '#fee2e2',
          defaultTitle: 'Reject Confirmation',
          defaultConfirm: 'Reject',
          variant: 'danger'
        };
      case 'error':
        return {
          icon: <XCircle size={24} style={{ color: '#dc2626' }} />,
          iconBg: '#fee2e2',
          defaultTitle: 'Error',
          defaultConfirm: 'OK',
          variant: 'danger'
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={24} style={{ color: '#16a34a' }} />,
          iconBg: '#dcfce7',
          defaultTitle: 'Success',
          defaultConfirm: 'OK',
          variant: 'success'
        };
      case 'save':
      case 'approve':
        return {
          icon: <CheckCircle2 size={24} style={{ color: '#16a34a' }} />,
          iconBg: '#dcfce7',
          defaultTitle: type === 'save' ? 'Save Changes' : 'Approve Confirmation',
          defaultConfirm: type === 'save' ? 'Save' : 'Approve',
          variant: 'success'
        };
      case 'update':
        return {
          icon: <Info size={24} style={{ color: '#2563eb' }} />,
          iconBg: '#dbeafe',
          defaultTitle: 'Update Record',
          defaultConfirm: 'Update',
          variant: 'primary'
        };
      case 'info':
        return {
          icon: <Info size={24} style={{ color: '#2563eb' }} />,
          iconBg: '#dbeafe',
          defaultTitle: 'Information',
          defaultConfirm: 'OK',
          variant: 'primary'
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle size={24} style={{ color: '#d97706' }} />,
          iconBg: '#fef3c7',
          defaultTitle: 'Warning',
          defaultConfirm: 'Continue',
          variant: 'warning'
        };
    }
  };

  const config = getTypeConfig();
  const resolvedTitle = title || config.defaultTitle;
  const resolvedConfirmText = confirmText || config.defaultConfirm;
  const resolvedVariant = confirmVariant || config.variant;

  // Determine button styling based on variant
  const getButtonStyles = () => {
    const baseStyle = {
      padding: '10px 20px',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '14px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      cursor: busy ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
      minWidth: '90px',
      opacity: busy ? 0.7 : 1
    };

    switch (resolvedVariant) {
      case 'danger':
        return {
          ...baseStyle,
          background: '#dc2626',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)'
        };
      case 'success':
        return {
          ...baseStyle,
          background: '#16a34a',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.25)'
        };
      case 'primary':
        return {
          ...baseStyle,
          background: '#2563eb',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
        };
      case 'warning':
        return {
          ...baseStyle,
          background: '#d97706',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.25)'
        };
      default:
        return {
          ...baseStyle,
          background: '#3b82f6',
          color: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.25)'
        };
    }
  };

  const handleActionClick = async () => {
    if (busy) return;
    if (onConfirm) {
      try {
        const res = onConfirm(isPrompt ? promptValue : true);
        if (res && typeof res.then === 'function') {
          setBusy(true);
          await res;
        }
      } catch (err) {
        console.error("Modal confirmation error:", err);
      } finally {
        setBusy(false);
        if (onClose) onClose();
      }
    } else {
      if (onClose) onClose(isPrompt ? promptValue : true);
    }
  };

  const handleCancelClick = () => {
    if (busy) return;
    if (onClose) onClose(isPrompt ? null : false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnOutsideClick && !busy) {
      handleCancelClick();
    }
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          position: 'relative',
          transform: animateIn ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close icon top-right */}
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={busy}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: busy ? 'not-allowed' : 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'color 0.15s ease, background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header & Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: config.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {config.icon}
          </div>
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>
              {resolvedTitle}
            </h3>
            <div style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5', wordBreak: 'break-word' }}>
              {displayMessage}
            </div>
          </div>
        </div>

        {/* Optional Prompt Input */}
        {isPrompt && (
          <div style={{ marginTop: '16px', marginBottom: '8px' }}>
            <input
              type="text"
              autoFocus
              disabled={busy}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !busy) {
                  e.preventDefault();
                  handleActionClick();
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                outline: 'none',
                color: '#0f172a',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        )}

        {/* Bottom Right Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          {showCancel && cancelText !== false && cancelText !== null && (
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={busy}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => !busy && (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => !busy && (e.currentTarget.style.background = '#ffffff')}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleActionClick}
            disabled={busy}
            style={getButtonStyles()}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.filter = 'brightness(0.92)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {busy && <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
