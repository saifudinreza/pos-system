import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const tenantService = {
  getAll: async (params = {}) => {
    const { data } = await api.get(`/dev/tenants${buildQueryString(params)}`);
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/dev/tenants/${id}`);
    return data.data ?? data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/dev/tenants/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/dev/tenants/${id}`);
    return data;
  },
};

export default tenantService;
