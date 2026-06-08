import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "@/app/globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nafeesa Airlines | Boarding Pass Generator",
  description: "Upload guest ledgers, generate personalized boarding pass invitations, and track RSVPs.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
