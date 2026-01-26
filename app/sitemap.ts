import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://fluxsend.vercel.app",
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        }
    ]
}