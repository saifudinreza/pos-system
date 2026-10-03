"use client";

// ============================================================
// BackendWarmup, Membangunkan backend Render saat landing page dibuka
// Tidak menampilkan apa pun; hanya memanggil /up di latar belakang
// supaya server sudah bangun saat pengunjung lanjut ke halaman login.
// ============================================================

import { useEffect } from "react";
import { warmUpBackend } from "@/lib/warmup";

export default function BackendWarmup() {
  useEffect(() => {
    warmUpBackend();
  }, []);

  return null;
}
