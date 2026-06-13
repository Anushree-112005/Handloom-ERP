export const showError = (msg) => {
  console.error("Error notification:", msg);
  alert("Error: " + msg);
};

export const showSuccess = (msg) => {
  console.log("Success notification:", msg);
  alert("Success: " + msg);
};
