import { alertDialog } from './dialogs';

export const showError = (msg) => {
  console.error("Error notification:", msg);
  alertDialog({
    title: 'Error',
    message: msg,
    type: 'error'
  });
};

export const showSuccess = (msg) => {
  console.log("Success notification:", msg);
  alertDialog({
    title: 'Success',
    message: msg,
    type: 'success'
  });
};

export const showWarning = (msg) => {
  console.warn("Warning notification:", msg);
  alertDialog({
    title: 'Warning',
    message: msg,
    type: 'warning'
  });
};
