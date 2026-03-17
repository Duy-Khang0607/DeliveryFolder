import { MetadataRoute } from "next";

const baseURL = process.env.NEXT_BASE_URL;

// Cho phép Google crawl toàn site, chặn /api/, /admin/, /unauthorized. Trỏ đến sitemap.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/admin/", "/unauthorized"],
            },
        ],
        sitemap: `${baseURL}/sitemap.xml`,
    };
}
