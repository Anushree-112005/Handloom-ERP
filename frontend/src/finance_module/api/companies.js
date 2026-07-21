import api from "./client";

export const list = () => api.get("/companies/");
export const create = (data) => api.post("/companies/", data);
export const get = (id) => api.get(`/companies/${id}`);
export const update = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);
