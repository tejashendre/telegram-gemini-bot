import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telegram Perplexity Bot",
  description: "Financial analyst bot powered by Perplexity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
