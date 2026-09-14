import { useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Box } from "@mui/material";
import GNB from "../components/GNB";
import LNB from "../components/LNB";
import NotFoundPage from "../components/NotFoundPage";

function RootLayout() {
  const [lnbOpen, setLnbOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 200, flexShrink: 0 }}>
        <GNB onMenuOpen={() => setLnbOpen(true)} />
      </Box>
      <LNB open={lnbOpen} onClose={() => setLnbOpen(false)} />
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  // RootLayout 안에서 렌더되므로 404 에서도 GNB·LNB 로 이동할 수 있다
  notFoundComponent: NotFoundPage,
});
