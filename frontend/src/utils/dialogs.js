/**
 * Imperative dialog controller and browser dialog overrides for ERP project.
 * Connects to <DialogProvider /> to render ConfirmationModal dynamically from anywhere.
 */

let dialogRef = null;

export const registerDialogController = (controller) => {
  dialogRef = controller;
};

/**
 * Open confirmation modal imperatively.
 * Compatible with existing showConfirm({ title, description, confirmText, cancelText })
 */
export const confirmDialog = (options) => {
  if (typeof options === 'string') {
    options = { message: options };
  }
  if (!dialogRef) {
    console.warn("DialogController not registered. Falling back to native confirm.");
    return Promise.resolve(window.confirm(`${options.title || 'Confirm'}\n\n${options.message || options.description || ''}`));
  }
  return dialogRef.showConfirm(options);
};

export const showConfirm = confirmDialog;

/**
 * Open alert modal imperatively (no cancel button).
 */
export const alertDialog = (options) => {
  if (typeof options === 'string') {
    options = { message: options, type: 'info' };
  }
  if (!dialogRef) {
    console.warn("DialogController not registered. Falling back to native alert.");
    window.alert(`${options.title || 'Notification'}\n\n${options.message || options.description || ''}`);
    return Promise.resolve(true);
  }
  return dialogRef.showAlert(options);
};

export const showAlert = alertDialog;

/**
 * Open prompt modal imperatively with text input.
 */
export const promptDialog = (options) => {
  if (typeof options === 'string') {
    options = { message: options };
  }
  if (!dialogRef) {
    console.warn("DialogController not registered. Falling back to native prompt.");
    const res = window.prompt(options.message || options.description || '', options.defaultValue || '');
    return Promise.resolve(res);
  }
  return dialogRef.showPrompt(options);
};

export const showPrompt = promptDialog;

/**
 * Override native window.alert, window.confirm, and window.prompt to use our custom modal.
 * Note: Since window.confirm/prompt in JS are synchronous by default and custom React modals are async,
 * we provide this override as a safeguard for third-party or un-refactored scripts.
 */
export const overrideBrowserDialogs = () => {
  if (typeof window === 'undefined') return;

  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;

  window.alert = (message) => {
    if (dialogRef) {
      alertDialog({ message: String(message), type: 'info', title: 'Notification' });
    } else {
      originalAlert(message);
    }
  };

  window.confirm = (message) => {
    console.warn("Synchronous window.confirm called. For best UX, please use async await confirmDialog().");
    if (dialogRef) {
      // For synchronous callers who don't await, we open the modal and return false initially
      confirmDialog({ message: String(message), type: 'warning', title: 'Confirmation Required' });
      return false;
    }
    return originalConfirm(message);
  };

  window.prompt = (message, defaultValue) => {
    console.warn("Synchronous window.prompt called. For best UX, please use async await promptDialog().");
    if (dialogRef) {
      promptDialog({ message: String(message), defaultValue: defaultValue || '', title: 'Input Required' });
      return null;
    }
    return originalPrompt(message, defaultValue);
  };
};
