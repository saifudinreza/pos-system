/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Izinkan Next.js memuat gambar dari server backend Laravel
    // Analogi: seperti mendaftarkan "toko rekanan" yang boleh kirim barang ke sini
    // Backend menyimpan gambar produk di: http://localhost:8000/storage/products/
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
