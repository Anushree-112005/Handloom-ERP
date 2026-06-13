import api from "./client";

export const getVouchers = (companyId, params = {}) =>
  api.get("/vouchers/", { params: { company_id: companyId, ...params } });

export const createVoucher = (data) =>
  api.post("/vouchers/", data);

export const cancelVoucher = (id) =>
  api.put(`/vouchers/${id}/cancel`);

export const deleteVoucher = (id) =>
  api.delete(`/vouchers/${id}`);
