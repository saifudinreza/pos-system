/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Izinkan Next.js <Image> memuat gambar dari backend Laravel
    // Backend menyimpan gambar di: http://localhost:8000/storage/products/
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

  // Compress respons HTML/CSS/JS → loading lebih cepat
  compress: true,

  // Matikan x-powered-by header (keamanan + sedikit lebih cepat)
  poweredByHeader: false,
};

export default nextConfig;
