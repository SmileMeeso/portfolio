import { createFileRoute, redirect } from "@tanstack/react-router";

// 경력·프로젝트는 홈(HomePage)에 함께 렌더된다 — 기존 링크 유지를 위해 리다이렉트만 남긴다
export const Route = createFileRoute("/projects")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
