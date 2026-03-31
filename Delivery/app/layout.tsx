import type { Metadata, Viewport } from "next";
import "./globals.css";
import Provider from "@/app/provider";
import { ToastProvider } from "./components/Toast";
import StoreProvider from "./redux/StoreProvider";
import InitUser from "./InitUser";
import "leaflet/dist/leaflet.css";

const baseURL = process.env.NEXT_BASE_URL;


export const metadata: Metadata = {
  metadataBase: new URL(`${baseURL}`),
  title: {
    template: "%s | Giao hàng nhanh tại Sài Gòn",
    default: "Giao hàng nhanh 24/7 tại Sài Gòn Hồ Chí Minh | Giao hàng nhanh HCM",
  },
  description: "Dịch vụ giao hàng nhanh tại TP.HCM 24/7. Ship hỏa tốc nội thành, giao trong ngày, nhận hàng tận nơi, đảm bảo nhanh chóng và an toàn.",
  keywords: [
    "giao hàng nhanh",
    "giao hàng nhanh hcm",
    "giao hàng nhanh 24/7",
    "ship hỏa tốc",
    "giao hàng nội thành",
    "giao hàng tại sài gòn",
    "giao hàng tại hồ chí minh",
    "đặt hàng online",
    "giao hàng tận nơi",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Giao hàng nhanh 24/7 tại Sài Gòn Hồ Chí Minh | Giao hàng nhanh HCM",
    description: "Dịch vụ giao hàng nhanh tại TP.HCM 24/7. Ship hỏa tốc nội thành, giao trong ngày, nhận hàng tận nơi, đảm bảo nhanh chóng và an toàn.",
    url: baseURL,
    siteName: "Giao hàng nhanh HCM",
    images: {
      url: `${baseURL}/assets/delivery.jpg`,
      width: 1200,
      height: 630,
      alt: "Dịch vụ giao hàng nhanh 24/7 tại TP.HCM",
    },
    locale: "vi_VN",
    phoneNumbers: "0902926340",
    emails: ["khangdev26@gmail.com"],
    type: "website",
    countryName: "Việt Nam",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giao hàng nhanh 24/7 tại Sài Gòn Hồ Chí Minh | Giao hàng nhanh HCM",
    description: "Dịch vụ giao hàng nhanh tại TP.HCM 24/7. Ship hỏa tốc nội thành, giao trong ngày, nhận hàng tận nơi.",
    images: [`${baseURL}/assets/delivery.jpg`],
  },
  alternates: {
    canonical: baseURL,
  },
  category: "delivery",
  verification: {
    google: "svcHymjcxPRrpAMYQyjvOcfTrme3JjEKLYm284IIgjg",
  },
};

export const viewport: Viewport = {
  width: "device-width", // Phù hợp mọi thiết bị
  initialScale: 1, // Khởi tạo zoom 1:1
  maximumScale: 1, // Không cho phép zoom
  userScalable: false, // Không cho phép người dùng zoom
  viewportFit: "cover", // Phù hợp mọi thiết bị
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className="bg-linear-to-b from-green-50 to-white w-full min-h-screen"
      >

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Giao hàng nhanh HCM",
            "url": baseURL,
            "description": "Dịch vụ giao hàng nhanh tại TP.HCM 24/7. Ship hỏa tốc nội thành, giao trong ngày.",
          })}}
        />
        <Provider>
          <ToastProvider>
            <StoreProvider>
              <InitUser />
              <main>{children}</main>
            </StoreProvider>
          </ToastProvider>
        </Provider>
      </body>
    </html>
  );
}
