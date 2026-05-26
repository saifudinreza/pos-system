import api from "@/lib/axios";

// Middleware (server-side) baca token dari COOKIE, bukan localStorage.
// Jadi setiap login/register kita simpan token di keduanya agar sinkron.
const setTokenCookie = (token) => {
  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
};
const clearTokenCookie = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

const authService = {

  // --- LOGIN ---
  // Backend response: { message, data: { user, token } }
  // Token ada di data.data.token bukan data.token
  login: async (credentials) => {
    const { data } = await api.post("/login", credentials);
    const token = data.data?.token;
    const user  = data.data?.user;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (token) setTokenCookie(token);
    }
    return { token, user, message: data.message };
  },

  // --- REGISTER ---
  // Backend response: { message, data: { user, token } }
  register: async (payload) => {
    const { data } = await api.post("/register", payload);
    const token = data.data?.token;
    const user  = data.data?.user;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (token) setTokenCookie(token);
    }
    return { token, user, message: data.message };
  },

  // --- LOGOUT ---
  logout: async () => {
    try {
      await api.post("/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearTokenCookie();
      }
    }
  },

  // --- ME ---
  // Backend response: { data: { ...user } }
  me: async () => {
    const { data } = await api.get("/me");
    const user = data.data ?? data;
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  },

  // --- AMBIL USER DARI LOCALSTORAGE (sync) ---
  getStoredUser: () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // --- CEK APAKAH ADA TOKEN (sync) ---
  hasToken: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};

export default authService;
