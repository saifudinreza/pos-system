import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const shiftService = {
  getCurrent: async () => {
    const { data } = await api.get("/shifts/current");
    return data;
  },

  // payload: { opening_balance, opening_note?, opening_denominations? }
  open: async (payload) => {
    // Backward-compatible: terima angka (modal awal) ATAU objek payload lengkap
    const body = typeof payload === "object" ? payload : { opening_balance: payload };
    const { data } = await api.post("/shifts/open", body);
    return data;
  },

  // payload: { closing_balance, closing_denominations?, petty_cash?, petty_cash_note?, notes?, verified_by? }
  close: async (id, payload) => {
    const { data } = await api.post(`/shifts/${id}/close`, payload);
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
