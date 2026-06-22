import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "VivAudit — HIPAA Compliance Made Simple",
    template: "%s · VivAudit",
  },
  description:
    "Automated HIPAA compliance audits for dental clinics, therapy practices, and small healthcare providers. Upload your docs, get a risk-scored report with a remediation roadmap.",
  metadataBase: new URL("https://vivavault.shop"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
