import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quill — Expert Application Letter Generator",
  description: "Generate professional application letters instantly with AI. Supports Bengali and English.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: "0.875rem",
              fontWeight: "500",
              background: "#1a1714",
              color: "#f5f0e8",
              border: "1px solid #3d3830",
              borderRadius: "10px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#c9953a", secondary: "#1a1714" } },
            error: { iconTheme: { primary: "#b83a4d", secondary: "#f5f0e8" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
