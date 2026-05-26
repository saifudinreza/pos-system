import { create } from "zustand";

// ============================================================
// Subscription Plans
// ============================================================
export const PLANS = {
  free: {
    id: "free",
    name: "Gratis",
    price: 0,
    color: "gray",
    features: {
      max_products: 50,
      max_users: 2,
      ai_assistant: false,
      reports_download: false,
      analytics_charts: false,
      multi_branch: false,
      priority_support: false,
      api_access: false,
    },
    limits: {
      products: "Maks. 50 produk",
      users: "Maks. 2 pengguna",
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 299000,
    color: "yellow",
    features: {
      max_products: -1,
      max_users: 10,
      ai_assistant: true,
      reports_download: true,
      analytics_charts: true,
      multi_branch: false,
      priority_support: true,
      api_access: false,
    },
    limits: {
      products: "Produk tidak terbatas",
      users: "Maks. 10 pengguna",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 799000,
    color: "black",
    features: {
      max_products: -1,
      max_users: -1,
      ai_assistant: true,
      reports_download: true,
      analytics_charts: true,
      multi_branch: true,
      priority_support: true,
      api_access: true,
    },
    limits: {
      products: "Produk tidak terbatas",
      users: "Pengguna tidak terbatas",
    },
  },
};

// ============================================================
// Mock subscription data (replace with API when ready)
// ============================================================
const MOCK_SUBSCRIPTIONS = [
  {
    id: 0,
    user_id: 0,
    user_name: "Saifudin Reza (Developer)",
    user_email: "donojomi@gmail.com",
    plan: "enterprise",
    status: "active",
    started_at: "2025-01-01",
    expires_at: null,
    is_trial: false,
    is_developer: true,
  },
  {
    id: 1,
    user_id: 1,
    user_name: "Admin Utama",
    user_email: "admin@kasiraai.com",
    plan: "enterprise",
    status: "active",
    started_at: "2025-01-01",
    expires_at: "2026-01-01",
    is_trial: false,
  },
  {
    id: 2,
    user_id: 2,
    user_name: "Toko Maju Jaya",
    user_email: "maju@gmail.com",
    plan: "pro",
    status: "active",
    started_at: "2025-03-15",
    expires_at: "2025-06-15",
    is_trial: false,
  },
  {
    id: 3,
    user_id: 3,
    user_name: "Warung Barokah",
    user_email: "barokah@gmail.com",
    plan: "free",
    status: "active",
    started_at: "2025-05-01",
    expires_at: null,
    is_trial: true,
  },
  {
    id: 4,
    user_id: 4,
    user_name: "Resto Sederhana",
    user_email: "resto@gmail.com",
    plan: "pro",
    status: "expired",
    started_at: "2025-01-10",
    expires_at: "2025-04-10",
    is_trial: false,
  },
  {
    id: 5,
    user_id: 5,
    user_name: "Kafe Nusantara",
    user_email: "kafe@gmail.com",
    plan: "enterprise",
    status: "active",
    started_at: "2025-04-01",
    expires_at: "2026-04-01",
    is_trial: false,
  },
];

const useSubscriptionStore = create((set, get) => ({
  subscriptions: MOCK_SUBSCRIPTIONS,
  isLoading: false,
  stats: {
    total: MOCK_SUBSCRIPTIONS.length,
    active: MOCK_SUBSCRIPTIONS.filter((s) => s.status === "active").length,
    free: MOCK_SUBSCRIPTIONS.filter((s) => s.plan === "free").length,
    pro: MOCK_SUBSCRIPTIONS.filter((s) => s.plan === "pro").length,
    enterprise: MOCK_SUBSCRIPTIONS.filter((s) => s.plan === "enterprise").length,
    mrr: MOCK_SUBSCRIPTIONS
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (PLANS[s.plan]?.price ?? 0), 0),
  },

  fetchSubscriptions: async () => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 600));
    const subs = get().subscriptions;
    set({
      isLoading: false,
      stats: {
        total: subs.length,
        active: subs.filter((s) => s.status === "active").length,
        free: subs.filter((s) => s.plan === "free").length,
        pro: subs.filter((s) => s.plan === "pro").length,
        enterprise: subs.filter((s) => s.plan === "enterprise").length,
        mrr: subs
          .filter((s) => s.status === "active")
          .reduce((sum, s) => sum + (PLANS[s.plan]?.price ?? 0), 0),
      },
    });
  },

  updatePlan: (subscriptionId, newPlan) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subscriptionId ? { ...s, plan: newPlan } : s
      ),
    }));
    // Recalculate stats
    const subs = get().subscriptions;
    set({
      stats: {
        total: subs.length,
        active: subs.filter((s) => s.status === "active").length,
        free: subs.filter((s) => s.plan === "free").length,
        pro: subs.filter((s) => s.plan === "pro").length,
        enterprise: subs.filter((s) => s.plan === "enterprise").length,
        mrr: subs
          .filter((s) => s.status === "active")
          .reduce((sum, s) => sum + (PLANS[s.plan]?.price ?? 0), 0),
      },
    });
  },

  toggleStatus: (subscriptionId) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subscriptionId
          ? { ...s, status: s.status === "active" ? "suspended" : "active" }
          : s
      ),
    }));
  },

  // Check if a feature is available for a given plan
  hasFeature: (plan, feature) => {
    return PLANS[plan]?.features[feature] ?? false;
  },
}));

export default useSubscriptionStore;
