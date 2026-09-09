import { useState } from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import ImageIcon from "@mui/icons-material/Image";
import TuneIcon from "@mui/icons-material/Tune";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { useTheme } from "@mui/material/styles";
import { tokens, type TokensColor } from "../theme/theme";

interface LNBProps {
  open: boolean;
  onClose: () => void;
}

export default function LNB({ open, onClose }: LNBProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  const currentPath = router.state.location.pathname;
  const isPathActive = (basePath: string) => currentPath.startsWith(basePath);

  const handleNavigate = (to: string) => {
    navigate({ to });
    onClose();
  };

  return (
    /* 오버레이 */
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        bgcolor: "#00000040",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s ease",
      }}
    >
      {/* 사이드바 */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 300,
          height: "100%",
          bgcolor: t.bgPrimary,
          borderRadius: `0 ${tokens.radius.lg}px ${tokens.radius.lg}px 0`,
          boxShadow: `4px 0 24px ${t.shadowColorLg ?? tokens.color.shadowColorLg}`,
          border: `1.5px solid ${t.borderDefault}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
            px: `${tokens.spacing[20]}px`,
            borderBottom: `1px solid ${t.borderDefault}`,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.fontSize.md,
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            메뉴
          </Typography>
          <IconButton
            onClick={onClose}
            disableRipple
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${tokens.radius.sm}px`,
              bgcolor: t.bgSurface,
              "&:hover": { bgcolor: t.bgHighlight },
            }}
          >
            <CloseIcon sx={{ fontSize: 18, color: t.textSecondary }} />
          </IconButton>
        </Box>

        {/* 메뉴 목록 */}
        <Box
          sx={{
            p: `${tokens.spacing[8]}px ${tokens.spacing[12]}px`,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {/* 홈 */}
          <MenuItem
            icon={<HomeIcon sx={{ fontSize: 20, color: t.textSecondary }} />}
            label="홈"
            active={currentPath === "/"}
            onClick={() => handleNavigate("/")}
            t={t}
          />

          {/* 이미지 필터 */}
          <MenuItem
            icon={<ImageIcon sx={{ fontSize: 20, color: t.textSecondary }} />}
            label="이미지 필터"
            active={currentPath === "/image-filter"}
            onClick={() => handleNavigate("/image-filter")}
            t={t}
          />

          {/* 이미지 최적화 */}
          <MenuItem
            icon={<TuneIcon sx={{ fontSize: 20, color: t.textSecondary }} />}
            label="이미지 최적화"
            active={currentPath === "/image-optimize"}
            onClick={() => handleNavigate("/image-optimize")}
            t={t}
          />

          {/* 미니 캐드 */}
          <MenuItem
            icon={<SquareFootIcon sx={{ fontSize: 20, color: t.textSecondary }} />}
            label="미니 캐드"
            active={currentPath === "/cad"}
            onClick={() => handleNavigate("/cad")}
            t={t}
          />

          {/* 접근성 */}
          <NavGroup
            icon={<AccessibilityNewIcon sx={{ fontSize: 20 }} />}
            label="접근성"
            basePath="/a11y"
            to="/a11y/keyboard"
            items={[
              { label: "키보드 내비게이션", to: "/a11y/keyboard" },
              { label: "스크린 리더 폼", to: "/a11y/screen-reader" },
              { label: "모달 접근성", to: "/a11y/modal" },
            ]}
            currentPath={currentPath}
            isPathActive={isPathActive}
            onNavigate={handleNavigate}
            t={t}
          />
        </Box>
      </Box>
    </Box>
  );
}

//  확장 가능한 그룹 메뉴
interface NavGroupProps {
  icon: React.ReactNode;
  label: string;
  basePath: string;
  to: string;
  items: { label: string; to: string }[];
  currentPath: string;
  isPathActive: (basePath: string) => boolean;
  onNavigate: (to: string) => void;
  t: TokensColor;
}

function NavGroup({
  icon,
  label,
  basePath,
  to,
  items,
  currentPath,
  isPathActive,
  onNavigate,
  t,
}: NavGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const isActive = isPathActive(basePath);

  return (
    <Box
      sx={{
        borderRadius: `${tokens.radius.sm}px`,
        bgcolor: isActive ? t.bgHighlight : "transparent",
      }}
    >
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 44,
          px: `${tokens.spacing[8]}px`,
          pl: `${tokens.spacing[12]}px`,
          borderRadius: `${tokens.radius.sm}px`,
          cursor: "pointer",
          "&:hover": { bgcolor: isActive ? "transparent" : t.bgSurface },
        }}
      >
        {/* 왼쪽: 아이콘 + 텍스트 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[12]}px`,
          }}
        >
          <Box
            sx={{
              color: isActive ? t.accentBlue : t.textSecondary,
              display: "flex",
            }}
          >
            {icon}
          </Box>
          <Typography
            sx={{
              fontSize: tokens.fontSize.base,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? t.accentBlue : t.textPrimary,
            }}
          >
            {label}
          </Typography>
        </Box>

        {/* 오른쪽: 이동 버튼 + 펼침 버튼 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[4]}px`,
          }}
        >
          <Box
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(to);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${tokens.spacing[4]}px`,
              bgcolor: t.accentBlue,
              color: t.textOnAccent,
              borderRadius: 6,
              px: `${tokens.spacing[10]}px`,
              py: `${tokens.spacing[4]}px`,
              cursor: "pointer",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 12 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>이동</Typography>
          </Box>
          <IconButton
            disableRipple
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 6,
              bgcolor: expanded ? t.bgSurface : "transparent",
              "&:hover": { bgcolor: t.bgSurface },
            }}
          >
            {expanded ? (
              <KeyboardArrowUpIcon
                sx={{ fontSize: 16, color: t.textTertiary }}
              />
            ) : (
              <KeyboardArrowDownIcon
                sx={{ fontSize: 16, color: t.textTertiary }}
              />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* 서브 메뉴 */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            px: `${tokens.spacing[8]}px`,
            pb: `${tokens.spacing[8]}px`,
          }}
        >
          {items.map((item) => {
            const itemActive = currentPath === item.to;
            return (
              <Box
                key={item.label}
                onClick={() => onNavigate(item.to)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[8]}px`,
                  height: 36,
                  borderRadius: `${tokens.radius.sm}px`,
                  pl: "44px",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(37,99,235,0.08)" },
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: itemActive ? t.accentBlue : t.textTertiary,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: itemActive ? 500 : 400,
                    color: itemActive ? t.accentBlue : t.textSecondary,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

//  공통 메뉴 아이템
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  t: TokensColor;
}

function MenuItem({ icon, label, active, onClick, t }: MenuItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.spacing[12]}px`,
        height: 44,
        borderRadius: `${tokens.radius.sm}px`,
        px: `${tokens.spacing[12]}px`,
        cursor: "pointer",
        bgcolor: active ? t.bgHighlight : "transparent",
        "&:hover": { bgcolor: active ? t.bgHighlight : t.bgSurface },
      }}
    >
      {icon}
      <Typography
        sx={{
          fontSize: tokens.fontSize.base,
          fontWeight: active ? 600 : 500,
          color: active ? t.accentBlue : t.textPrimary,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
