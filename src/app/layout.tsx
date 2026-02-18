import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DT Speed Calculator — 28-Day Period Planner",
  description:
    "Calculate the drive-thru speed you must run from today forward to finish a 28-day period at your goal.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
