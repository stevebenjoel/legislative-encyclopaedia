import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Legislative Encyclopaedia",
    template: "%s | Legislative Encyclopaedia",
  },
  description:
    "A structured, accessible source for legislative knowledge and public records.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
