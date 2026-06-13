export const showConfirm = ({ title, description, confirmText, cancelText }) => {
  return new Promise((resolve) => {
    const result = window.confirm(`${title}\n\n${description}`);
    resolve(result);
  });
};
