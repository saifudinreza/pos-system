// ============================================================
// upgradeModalStore.js, state modal "upgrade kontekstual"
//
// Dipanggil saat user menyentuh fitur yang butuh paket lebih tinggi
// (QRIS, export laporan, kuota AI), supaya tawaran upgrade muncul tepat
// di momen butuh, bukan sekadar pesan error. Modalnya sendiri ada di
// components/ui/UpgradeModal.jsx (dipasang di layout dashboard & kasir).
// feature: "qris" | "export" | "ai"
// ============================================================

import { create } from "zustand";

const useUpgradeModalStore = create((set) => ({
  open: false,
  feature: null,
  show: (feature) => set({ open: true, feature }),
  close: () => set({ open: false }),
}));

export default useUpgradeModalStore;
