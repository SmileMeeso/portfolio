import { useState } from "react";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Box, useMediaQuery } from "@mui/material";
import GNB from "../components/GNB";
import LNB from "../components/LNB";
import NotFoundPage from "../components/NotFoundPage";
import SmallScreenNotice from "../components/SmallScreenNotice";

function RootLayout() {
  const [lnbOpen, setLnbOpen] = useState(false);
  const isNarrow = useMediaQuery("(max-width:1023.98px)");
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // 홈(이력서)은 반응형으로 만들어 좁은 화면에서도 그대로 보여준다.
  // 나머지 데모 페이지는 캔버스·코드 비교 등 데스크톱 폭을 전제로 해서
  // 깨진 레이아웃 대신 안내를 띄운다.
  const isResponsivePage = pathname === "/";
  const showNotice = isNarrow && !isResponsivePage;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 200, flexShrink: 0 }}>
        <GNB onMenuOpen={() => setLnbOpen(true)} />
      </Box>
      <LNB open={lnbOpen} onClose={() => setLnbOpen(false)} />
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {showNotice ? <SmallScreenNotice /> : <Outlet />}
      </Box>
    </Box>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  // RootLayout 안에서 렌더되므로 404 에서도 GNB·LNB 로 이동할 수 있다
  notFoundComponent: NotFoundPage,
});
