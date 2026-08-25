"use client";

// ============================================================
// useOrders.js, Hook untuk data pesanan (orders)
//
// Analogi: Ini seperti "buku pesanan digital",
// kasir/admin bisa lihat semua pesanan, filter per status,
// dan update status pesanan.
//
// Cara pakai:
//   const { orders, isLoading, updateStatus } = useOrders();
//   const { orders } = useOrders({ status: "pending" });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import orderService from "@/services/orderService";
import { getErrorMessage } from "@/lib/utils";

// @param {Object} initialFilters
// @param {boolean} myOrdersOnly, jika true, hanya ambil order milik user login
export function useOrders(initialFilters = {}, myOrdersOnly = false) {
  const [orders, setOrders]       = useState([]);
  const [meta, setMeta]           = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const [filters, setFilters] = useState({
    page:     1,
    per_page: 10,
    ...initialFilters,
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pilih endpoint berdasarkan mode: semua order (admin) atau order saya (pelanggan)
      const data = myOrdersOnly
        ? await orderService.getMyOrders(filters)
        : await orderService.getAll(filters);

      setOrders(data.data ?? data);
      setMeta(data.meta ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters, myOrdersOnly]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // --- UPDATE STATUS ORDER ---
  // Analogi: kasir stamp "LUNAS" atau "BATAL" di buku pesanan
  const updateStatus = async (id, status) => {
    try {
      const result = await orderService.updateStatus(id, status);
      // Update data lokal tanpa refetch (optimistic update)
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  return {
    orders,
    meta,
    isLoading,
    error,
    filters,
    updateFilters,
    goToPage,
    refetch:      fetchOrders,
    updateStatus,
    clearError:   () => setError(null),
  };
}
