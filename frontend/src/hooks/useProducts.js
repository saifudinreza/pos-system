"use client";

// ============================================================
// useProducts.js, Hook untuk manajemen data produk
//
// Analogi: Ini seperti "manajer gudang otomatis",
// dia tahu daftar produk saat ini, bisa filter, cari,
// tambah/edit/hapus, dan auto-refresh kalau ada perubahan.
//
// Cara pakai di komponen:
//   const { products, isLoading, createProduct, ... } = useProducts();
//   const { products, isLoading } = useProducts({ category_id: 1, search: "ayam" });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
import { getErrorMessage } from "@/lib/utils";

// @param {Object} initialFilters, filter awal (opsional)
export function useProducts(initialFilters = {}) {
  // Data produk dari server
  const [products, setProducts]   = useState([]);
  // Metadata pagination dari Laravel: { current_page, last_page, total, per_page }
  const [meta, setMeta]           = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  // Filter aktif, dipakai sebagai parameter query ke API
  // Analogi: seperti filter di mesin pencari,
  // ganti filter → hasil langsung berubah
  const [filters, setFilters] = useState({
    page:     1,
    per_page: 10,
    ...initialFilters,
  });

  // --- AMBIL DATA PRODUK ---
  // useCallback: fungsi ini tidak dibuat ulang setiap render,
  // hanya dibuat ulang jika "filters" berubah, optimasi performa
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getAll(filters);
      // Laravel pagination: data ada di data.data, meta di data.meta
      setProducts(data.data ?? data);
      setMeta(data.meta ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // useEffect: jalankan fetchProducts setiap kali filters berubah
  // Analogi: seperti mesin pencari yang otomatis cari ulang saat filter diganti
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- SINKRONISASI FILTER AWAL (misal search yang di-debounce) ---
  // useProducts({ search: x }), kalau x berubah, state filter harus ikut.
  // Sebelumnya initialFilters hanya dibaca SEKALI saat mount, jadi
  // pencarian produk di halaman tidak pernah berfungsi.
  useEffect(() => {
    setFilters((prev) => {
      const merged  = { ...prev, ...initialFilters };
      const changed = Object.keys(initialFilters).some(
        (key) => prev[key] !== initialFilters[key]
      );
      return changed ? { ...merged, page: 1 } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFilters)]);

  // --- GANTI FILTER ---
  // Reset ke halaman 1 setiap ganti filter (agar tidak stuck di halaman yang salah)
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // --- GANTI HALAMAN (pagination) ---
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // --- BUAT PRODUK BARU ---
  const createProduct = async (payload) => {
    setIsLoading(true);
    try {
      const result = await productService.create(payload);
      // Refresh daftar setelah produk baru dibuat
      await fetchProducts();
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPDATE PRODUK ---
  const updateProduct = async (id, payload) => {
    setIsLoading(true);
    try {
      const result = await productService.update(id, payload);
      await fetchProducts();
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- HAPUS PRODUK ---
  const deleteProduct = async (id) => {
    setIsLoading(true);
    try {
      const result = await productService.delete(id);
      await fetchProducts();
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    meta,
    isLoading,
    error,
    filters,
    updateFilters,
    goToPage,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError: () => setError(null),
  };
}
