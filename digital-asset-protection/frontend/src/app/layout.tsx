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
    <html lang="en" className="dark">
      <body className="bg-ink-950 text-txt-primary antialiased">
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
              success: { iconTheme: { primary: "#60a5fa", secondary: "#1e293b" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#1e293b" } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
