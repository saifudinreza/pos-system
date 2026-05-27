import api from "@/lib/axios";

const subscriptionService = {
  getStatus: async () => {
    const { data } = await api.get("/subscription");
    return data;
  },

  initiate: async (payload) => {
    const { data } = await api.post("/subscription/initiate", payload);
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await api.put("/profile", payload);
    return data;
  },
};

export default subscriptionService;
