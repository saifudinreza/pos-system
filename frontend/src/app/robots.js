const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sikasirai.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/dashboard",
        "/kasir",
        "/products",
        "/categories",
        "/orders",
        "/transactions",
        "/reports",
        "/users",
        "/profile",
        "/upgrade",
        "/ai-monitoring",
        "/dev",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
