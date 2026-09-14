import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link } from "@tanstack/react-router";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import EmailIcon from "@mui/icons-material/Email";
import GitHubIcon from "@mui/icons-material/GitHub";
import { tokens } from "../theme/theme";
import type { TokensColor } from "../theme/theme";

/** 좁은 화면에서 막아도 최소한 누구인지와 연락처는 남긴다 */
const CONTACTS = [
  {
    icon: EmailIcon,
    label: "m950827@naver.com",
    href: "mailto:m950827@naver.com",
  },
  {
    icon: GitHubIcon,
    label: "github.com/SmileMeeso/portfolio",
    href: "https://github.com/SmileMeeso/portfolio",
  },
];

export default function SmallScreenNotice() {
  const theme = useTheme();
  const t: TokensColor = theme.palette.tokens.color;

  return (
    <Box
      sx={{
        bgcolor: t.bgSurface,
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: `${tokens.spacing[24]}px`,
        py: `${tokens.spacing[40]}px`,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: `${tokens.spacing[20]}px`,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: `${tokens.radius.full}px`,
            bgcolor: t.accentPurpleLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DesktopWindowsIcon sx={{ fontSize: 28, color: t.accentPurple }} />
        </Box>

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
              fontSize: tokens.fontSize.xl,
              fontWeight: 700,
              color: t.textPrimary,
              lineHeight: 1.4,
            }}
          >
            이 데모는 넓은 화면이 필요합니다
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.sm,
              color: t.textSecondary,
              lineHeight: 1.8,
            }}
          >
            3D 캔버스와 코드 비교 화면이라 데스크톱 폭을 전제로 만들었습니다.
            가로 <strong>1024px 이상</strong>(13인치 이상 노트북)에서 확인해
            주세요.
            <br />
            <strong>이력서는 이 화면에서도 보실 수 있습니다.</strong>
          </Typography>
        </Box>

        <Box
          component={Link}
          to="/"
          sx={{
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: tokens.fontSize.sm,
            fontWeight: 600,
            color: "#fff",
            bgcolor: t.accentPurple,
            textDecoration: "none",
            borderRadius: `${tokens.radius.sm}px`,
            px: `${tokens.spacing[20]}px`,
            py: "12px",
            outline: "none",
            "&:hover": { opacity: 0.9 },
            "&:focus-visible": {
              outline: "3px solid #FBBF24",
              outlineOffset: "2px",
            },
          }}
        >
          이력서 보기
        </Box>

        <Box
          sx={{
            width: "100%",
            borderTop: `1px solid ${t.borderDefault}`,
            pt: `${tokens.spacing[20]}px`,
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.spacing[6]}px`,
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.fontSize.lg,
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            김미소
          </Typography>
          <Typography
            sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}
          >
            Frontend Developer · 디자인 시스템 · 성능 최적화 · 웹 접근성
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.spacing[8]}px`,
          }}
        >
          {CONTACTS.map(({ icon: Icon, label, href }) => (
            <Box
              key={href}
              component="a"
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: tokens.fontSize.sm,
                color: t.textSecondary,
                textDecoration: "none",
                border: `1px solid ${t.borderDefault}`,
                borderRadius: `${tokens.radius.sm}px`,
                bgcolor: t.bgPrimary,
                px: `${tokens.spacing[12]}px`,
                py: `${tokens.spacing[10]}px`,
                outline: "none",
                wordBreak: "break-all",
                "&:hover": { color: t.textPrimary },
                "&:focus-visible": {
                  outline: "3px solid #FBBF24",
                  outlineOffset: "2px",
                },
              }}
            >
              <Icon sx={{ fontSize: 16, flexShrink: 0 }} />
              {label}
            </Box>
          ))}
        </Box>

      </Box>
    </Box>
  );
}
