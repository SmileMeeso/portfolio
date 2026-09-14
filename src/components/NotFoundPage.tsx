import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link } from "@tanstack/react-router";
import HomeIcon from "@mui/icons-material/Home";
import { tokens } from "../theme/theme";
import type { TokensColor } from "../theme/theme";

/** 정리·이동된 주소로 들어온 사람에게 갈 곳을 알려준다 */
const SUGGESTIONS = [
  { to: "/", label: "홈 — 경력과 프로젝트" },
  { to: "/image-filter", label: "WebAssembly 이미지 필터" },
  { to: "/cad", label: "미니 CAD" },
  { to: "/image-optimize", label: "이미지 최적화" },
  { to: "/a11y/keyboard", label: "웹 접근성" },
];

const linkSx = (t: TokensColor) => ({
  display: "block",
  fontSize: tokens.fontSize.sm,
  color: t.textSecondary,
  textDecoration: "none",
  borderRadius: `${tokens.radius.sm}px`,
  px: `${tokens.spacing[12]}px`,
  py: `${tokens.spacing[10]}px`,
  border: `1px solid ${t.borderDefault}`,
  bgcolor: t.bgPrimary,
  transition: "color 0.15s, border-color 0.15s",
  outline: "none",
  "&:hover": { color: t.textPrimary, borderColor: t.textTertiary },
  "&:focus-visible": { outline: "3px solid #FBBF24", outlineOffset: "2px" },
});

export default function NotFoundPage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  return (
    <Box
      sx={{
        bgcolor: t.bgSurface,
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: `${tokens.spacing[24]}px`,
        py: `${tokens.spacing[48]}px`,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[20]}px`,
        }}
      >
        <Typography
          component="p"
          sx={{
            fontSize: tokens.fontSize["4xl"],
            fontWeight: 700,
            color: t.accentPurple,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          404
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.spacing[8]}px`,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: tokens.fontSize["2xl"],
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            찾으시는 페이지가 없습니다
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.sm,
              color: t.textSecondary,
              lineHeight: 1.7,
            }}
          >
            주소가 잘못되었거나, 정리 과정에서 옮겨지거나 사라진 페이지일 수
            있습니다. 아래에서 원하시는 곳으로 이동하세요.
          </Typography>
        </Box>

        <Box
          component="nav"
          aria-label="주요 페이지"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.spacing[8]}px`,
          }}
        >
          {SUGGESTIONS.map((s) => (
            <Box key={s.to} component={Link} to={s.to} sx={linkSx(t)}>
              {s.label}
            </Box>
          ))}
        </Box>

        <Box
          component={Link}
          to="/"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: "6px",
            fontSize: tokens.fontSize.sm,
            fontWeight: 600,
            color: "#fff",
            bgcolor: t.accentPurple,
            textDecoration: "none",
            borderRadius: `${tokens.radius.sm}px`,
            px: `${tokens.spacing[20]}px`,
            py: "10px",
            outline: "none",
            "&:hover": { opacity: 0.9 },
            "&:focus-visible": {
              outline: "3px solid #FBBF24",
              outlineOffset: "2px",
            },
          }}
        >
          <HomeIcon sx={{ fontSize: 18 }} />
          홈으로 돌아가기
        </Box>
      </Box>
    </Box>
  );
}
