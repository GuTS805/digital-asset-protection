import type { Metadata } from "next";
import "./globals.css";
import { MainLayout } from "@/components/MainLayout";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ShieldSync – Digital Asset Protection",
  description:
    "Protect sports media from unauthorized use with AI-powered fingerprinting, watermarking, and real-time violation detection.",
  keywords: ["digital rights", "sports media", "content protection", "watermarking", "IP enforcement"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink-900 text-txt-primary antialiased">
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
              success: { iconTheme: { primary: "#2563eb", secondary: "#ffffff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
