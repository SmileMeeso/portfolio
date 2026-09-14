import { Box, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useAppStore } from "../store/useAppStore";
import { tokens } from "../theme/theme";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "@tanstack/react-router";

interface GNBProps {
  onMenuOpen: () => void;
}

export default function GNB({ onMenuOpen }: GNBProps) {
  const navigate = useNavigate();

  const { themeMode, toggleTheme } = useAppStore();
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        px: { xs: `${tokens.spacing[16]}px`, md: `${tokens.spacing[48]}px` },
        bgcolor: t.bgPrimary,
        borderBottom: `1px solid ${t.borderDefault}`,
        flexShrink: 0,
      }}
    >
      {/* Left: 햄버거 + 로고 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${tokens.spacing[16]}px`,
        }}
      >
        <IconButton
          onClick={onMenuOpen}
          disableRipple
          sx={{
            width: 44,
            height: 44,
            borderRadius: `${tokens.radius.sm}px`,
            bgcolor: t.bgSurface,
            border: `1.5px solid ${t.borderDefault}`,
            boxShadow: tokens.shadow.sm,
            "&:hover": { bgcolor: t.bgHighlight },
          }}
        >
          <MenuIcon sx={{ color: t.textPrimary, fontSize: 22 }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: tokens.fontSize.xl,
            fontWeight: 700,
            color: t.textPrimary,
            fontFamily: tokens.fontFamily,
            letterSpacing: 0,
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          onClick={() => navigate({ to: "/" })}
        >
          ☺️ SMILE PORTFOLIO
        </Typography>
      </Box>

      {/* Right: 테마 토글 */}
      <IconButton
        onClick={toggleTheme}
        disableRipple
        sx={{
          width: 40,
          height: 40,
          borderRadius: `${tokens.radius.sm}px`,
          bgcolor: t.bgSurface,
          border: `1px solid ${t.borderDefault}`,
          "&:hover": { bgcolor: t.bgHighlight },
        }}
      >
        {themeMode === "light" ? (
          <DarkModeIcon sx={{ color: t.textSecondary, fontSize: 20 }} />
        ) : (
          <LightModeIcon sx={{ color: t.textSecondary, fontSize: 20 }} />
        )}
      </IconButton>
    </Box>
  );
}
