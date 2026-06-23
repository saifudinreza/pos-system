import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const shiftService = {
  getCurrent: async () => {
    const { data } = await api.get("/shifts/current");
    return data;
  },

  open: async (openingBalance) => {
    const { data } = await api.post("/shifts/open", { opening_balance: openingBalance });
    return data;
  },

  close: async (id, closingBalance, notes = "") => {
    const { data } = await api.post(`/shifts/${id}/close`, {
      closing_balance: closingBalance,
      notes,
    });
    return data;
  },

  getReport: async (id) => {
    const { data } = await api.get(`/shifts/${id}/report`);
    return data;
  },

  getAll: async (params = {}) => {
    const { data } = await api.get(`/shifts${buildQueryString(params)}`);
    return data;
  },
};

export default shiftService;
