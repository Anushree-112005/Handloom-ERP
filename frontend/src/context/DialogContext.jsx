import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import { registerDialogController, overrideBrowserDialogs } from '../utils/dialogs';

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    resolve: null,
    title: '',
    message: '',
    description: '',
    type: 'warning',
    confirmText: '',
    cancelText: 'Cancel',
    confirmVariant: '',
    closeOnOutsideClick: true,
    isPrompt: false,
    defaultValue: '',
    promptPlaceholder: 'Enter value...',
    showCancel: true
  });

  const closeDialog = useCallback((result) => {
    setModalState((prev) => {
      if (prev.resolve) {
        prev.resolve(result);
      }
      return { ...prev, isOpen: false, resolve: null };
    });
  }, []);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        resolve,
        title: options.title || '',
        message: options.message || options.description || '',
        description: options.description || '',
        type: options.type || 'warning',
        confirmText: options.confirmText || '',
        cancelText: options.cancelText !== undefined ? options.cancelText : 'Cancel',
        confirmVariant: options.confirmVariant || options.variant || '',
        closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
        isPrompt: false,
        showCancel: true
      });
    });
  }, []);

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        resolve,
        title: options.title || 'Notification',
        message: options.message || options.description || '',
        description: options.description || '',
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        cancelText: false,
        confirmVariant: options.confirmVariant || options.variant || '',
        closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
        isPrompt: false,
        showCancel: false
      });
    });
  }, []);

  const showPrompt = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        resolve,
        title: options.title || 'Input Required',
        message: options.message || options.description || '',
        description: options.description || '',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Submit',
        cancelText: options.cancelText !== undefined ? options.cancelText : 'Cancel',
        confirmVariant: options.confirmVariant || options.variant || 'primary',
        closeOnOutsideClick: options.closeOnOutsideClick !== undefined ? options.closeOnOutsideClick : true,
        isPrompt: true,
        defaultValue: options.defaultValue || '',
        promptPlaceholder: options.promptPlaceholder || 'Enter value...',
        showCancel: true
      });
    });
  }, []);

  useEffect(() => {
    registerDialogController({
      showConfirm,
      showAlert,
      showPrompt
    });
    overrideBrowserDialogs();
  }, [showConfirm, showAlert, showPrompt]);

  const value = {
    showConfirm,
    showAlert,
    showPrompt,
    confirm: showConfirm,
    alert: showAlert,
    prompt: showPrompt
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={(res) => closeDialog(res)}
        onConfirm={(res) => {
          closeDialog(res);
          return res;
        }}
        title={modalState.title}
        message={modalState.message || modalState.description}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmVariant={modalState.confirmVariant}
        closeOnOutsideClick={modalState.closeOnOutsideClick}
        isPrompt={modalState.isPrompt}
        defaultValue={modalState.defaultValue}
        promptPlaceholder={modalState.promptPlaceholder}
        showCancel={modalState.showCancel}
      />
    </DialogContext.Provider>
  );
};
