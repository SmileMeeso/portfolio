import { createFileRoute, redirect } from "@tanstack/react-router";

// 프로필 화면은 홈(HomePage)으로 통합됨 — 기존 링크 유지를 위해 리다이렉트만 남긴다
export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
