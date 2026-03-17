import { MetadataRoute } from "next";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

// Liệt kê các trang public (trang chủ, login, register) để Google biết cấu trúc site.
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: `${baseURL}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseURL}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseURL}/register`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];
}
