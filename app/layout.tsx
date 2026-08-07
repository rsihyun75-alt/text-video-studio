import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "컷메이커 — 글을 장면으로",
  description: "한 문단의 글을 5장면 스토리보드와 영상으로 바꾸는 텍스트 비디오 스튜디오",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
