import type { Metadata } from "next";
import { Arimo, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/providers/session-provider";
import { AdminToolbar } from "@/components/layout/admin-toolbar";
import { ToastProvider } from "@/components/admin/toast";
import { EditModeProvider } from "@/providers/edit-mode-provider";
import "./globals.css";

const arimo = Arimo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-arimo",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "by zeynep kömür",
  description: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${arimo.variable} ${plusJakarta.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body">
        <AuthProvider>
          <EditModeProvider>
            <AdminToolbar />
            <ToastProvider />
            {children}
          </EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
