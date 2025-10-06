import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "エージェントチャット",
  description: "分散AIエージェントアーキテクチャのPoC - OneNote検索とOutlookスケジュール調整",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
