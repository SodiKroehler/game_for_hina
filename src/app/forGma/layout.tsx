import type { Metadata } from "next";
import "./forGma.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ForGmaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
