import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://camipozas.dev",
      lastModified: new Date(),
    },
  ];
}
