import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "../../theme/theme";
import type { TokensColor } from "../../theme/theme";

//  포커스 스타일
const focusRing = {
  outline: "none",
  cursor: "default",
  "&:focus-visible": {
    outline: "3px solid #FBBF24",
    outlineOffset: "2px",
  },
} as const;

//  공용 컴포넌트

function A11yBadge({ t }: { t: TokensColor }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.spacing[6]}px`,
        bgcolor: t.accentPurpleLight,
        borderRadius: `${tokens.radius.full}px`,
        px: `${tokens.spacing[16] - 2}px`,
        py: `${tokens.spacing[6]}px`,
      }}
    >
      <AccessibilityNewIcon sx={{ fontSize: 16, color: t.accentPurple }} />
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          fontWeight: 600,
          color: t.accentPurple,
        }}
      >
        접근성
      </Typography>
    </Box>
  );
}

function SectionCard({
  title,
  children,
  t,
  tabFocusable = false,
}: {
  title: string;
  children: React.ReactNode;
  t: TokensColor;
  tabFocusable?: boolean;
}) {
  return (
    <Box
      tabIndex={tabFocusable ? 0 : undefined}
      role={tabFocusable ? "region" : undefined}
      aria-label={tabFocusable ? title : undefined}
      sx={{
        width: "100%",
        maxWidth: 1280,
        bgcolor: t.bgPrimary,
        borderRadius: `${tokens.radius.lg}px`,
        border: `1.5px solid ${t.borderDefault}`,
        p: "28px",
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[20]}px`,
        ...(tabFocusable ? focusRing : {}),
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: tokens.fontSize.xl,
          fontWeight: 700,
          color: t.textPrimary,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

//  메인 컴포넌트

export default function A11yKeyboardPage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const mainContentRef = useRef<HTMLDivElement>(null);

  const tabSteps = ["Skip Link", "헤더 메뉴", "검색", "카드 리스트", "푸터"];

  const focusExamples = [
    {
      tagLabel: "기본 브라우저",
      tagColor: t.accentOrange,
      tagBg: t.accentOrangeLight,
      label: "기본 브라우저 포커스",
      // 버튼 자체가 보여주는 포커스 스타일: 브라우저 기본 outline
      btnFocusStyle: { outline: "2px solid #18181B", outlineOffset: "1px" },
    },
    {
      tagLabel: "커스텀",
      tagColor: t.accentGreen,
      tagBg: t.accentGreenLight,
      label: "커스텀 포커스 링",
      // 커스텀 amber 3px ring
      btnFocusStyle: { outline: "3px solid #FBBF24", outlineOffset: "2px" },
    },
    {
      tagLabel: ":focus-visible",
      tagColor: "#B45309",
      tagBg: "#FEF3C7",
      label: ":focus-visible 스타일",
      // :focus-visible일 때만 표시 (마우스 클릭 시 미표시)
      btnFocusStyle: { outline: "3px solid #FBBF24", outlineOffset: "2px" },
    },
  ];

  function handleSkipLink(e: React.MouseEvent | React.KeyboardEvent) {
    if ("key" in e && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const el = mainContentRef.current;
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <Box sx={{ bgcolor: t.bgSurface, minHeight: "calc(100vh - 64px)" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${tokens.spacing[40]}px`,
          px: `${tokens.spacing[80]}px`,
          py: `${tokens.spacing[48]}px`,
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${tokens.spacing[16]}px`,
            width: "100%",
            maxWidth: 1280,
          }}
        >
          <A11yBadge t={t} />
          <Typography
            component="h1"
            sx={{
              fontSize: tokens.fontSize["3xl"],
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            키보드 내비게이션
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.md,
              color: t.textSecondary,
              textAlign: "center",
              maxWidth: 600,
            }}
          >
            마우스 없이 키보드만으로 웹사이트의 모든 기능을 사용할 수 있도록
            설계했습니다
          </Typography>
        </Box>

        {/* Section 1: Skip to Content */}
        <SectionCard title="Skip to Content 링크" t={t}>
          <Box
            sx={{
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: t.bgSurface,
              border: `1px solid ${t.borderDefault}`,
              overflow: "hidden",
            }}
          >
            {/* 브라우저 상단 바 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.spacing[8]}px`,
                bgcolor: t.bgPrimary,
                borderBottom: `1px solid ${t.borderDefault}`,
                px: `${tokens.spacing[16]}px`,
                py: "10px",
              }}
            >
              {(["#FF5F57", "#FEBC2E", "#28C840"] as const).map((c) => (
                <Box
                  key={c}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: c,
                  }}
                />
              ))}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: t.bgSurface,
                  borderRadius: `${tokens.radius.sm}px`,
                  px: `${tokens.spacing[12]}px`,
                  py: "6px",
                }}
              >
                <Typography
                  sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}
                >
                  portfolio.dev
                </Typography>
              </Box>
            </Box>

            {/* 브라우저 본문 */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: `${tokens.spacing[16]}px`,
                p: `${tokens.spacing[20]}px`,
              }}
            >
              {/* Skip link 버튼 - 클릭/Enter 시 Main Content Area로 포커스 이동 */}
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  role="link"
                  tabIndex={-1}
                  aria-label="본문 콘텐츠로 건너뛰기"
                  onClick={handleSkipLink}
                  onKeyDown={handleSkipLink}
                  sx={{
                    bgcolor: t.accentPurple,
                    borderRadius: `${tokens.radius.sm}px`,
                    px: `${tokens.spacing[20]}px`,
                    py: "10px",
                    cursor: "pointer",
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    Skip to content
                  </Typography>
                </Box>
              </Box>

              {/* Main Content Area - 탭 순서 1번 */}
              <Box
                ref={mainContentRef}
                id="main-content"
                tabIndex={0}
                role="region"
                aria-label="본문 콘텐츠"
                sx={{
                  outline: "none",
                  cursor: "default",
                  "&:focus": {
                    outline: "3px solid #FBBF24",
                    outlineOffset: "2px",
                  },
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: `${tokens.radius.md}px`,
                  border: `1.5px solid ${t.borderDefault}`,
                  p: `${tokens.spacing[16]}px`,
                  gap: `${tokens.spacing[8]}px`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.base,
                    fontWeight: 600,
                    color: t.textPrimary,
                  }}
                >
                  Main Content Area
                </Typography>
                <Typography
                  sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}
                >
                  포커스가 이곳으로 바로 이동합니다
                </Typography>
              </Box>
            </Box>
          </Box>
        </SectionCard>

        {/* Section 2: Tab 키 내비게이션 흐름 - 탭 순서 2~6번 (step마다 하나씩) */}
        <SectionCard title="Tab 키 내비게이션 흐름" t={t}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: `${tokens.spacing[4]}px`,
            }}
          >
            {tabSteps.map((step, i) => (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[4]}px`,
                }}
              >
                <Box
                  tabIndex={0}
                  aria-label={`탭 순서 ${i + 1}단계: ${step}`}
                  sx={{
                    ...focusRing,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: `${tokens.spacing[8]}px`,
                    bgcolor: t.bgPrimary,
                    borderRadius: `${tokens.radius.md}px`,
                    border: `1.5px solid ${t.borderDefault}`,
                    px: `${tokens.spacing[20]}px`,
                    py: `${tokens.spacing[16]}px`,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: `${tokens.radius.full}px`,
                      bgcolor: t.accentPurple,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: tokens.fontSize.sm,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: 600,
                      color: t.textPrimary,
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
                {i < tabSteps.length - 1 && (
                  <ChevronRightIcon
                    sx={{ fontSize: 24, color: t.textTertiary }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* Section 3: Focus Indicator 스타일 - 탭 순서 7번 (섹션 카드 전체) */}
        <SectionCard title="Focus Indicator 스타일" t={t} tabFocusable>
          <Box sx={{ display: "flex", gap: `${tokens.spacing[20]}px` }}>
            {focusExamples.map((ex) => (
              <Box
                key={ex.label}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: `${tokens.spacing[16]}px`,
                  bgcolor: t.bgSurface,
                  borderRadius: `${tokens.radius.md}px`,
                  p: `${tokens.spacing[24]}px`,
                }}
              >
                <Box
                  sx={{
                    bgcolor: ex.tagBg,
                    borderRadius: `${tokens.radius.full}px`,
                    px: "10px",
                    py: "4px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.xs,
                      fontWeight: 600,
                      color: ex.tagColor,
                    }}
                  >
                    {ex.tagLabel}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.base,
                    fontWeight: 600,
                    color: t.textPrimary,
                    textAlign: "center",
                  }}
                >
                  {ex.label}
                </Typography>
                {/* 버튼은 시각적 데모 (tabIndex=-1) - 각자의 포커스 스타일을 정적으로 표현 */}
                <Box
                  tabIndex={-1}
                  aria-hidden="true"
                  sx={{
                    bgcolor: t.accentPurple,
                    borderRadius: `${tokens.radius.sm}px`,
                    px: `${tokens.spacing[24]}px`,
                    py: "10px",
                    ...ex.btnFocusStyle,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    버튼
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* 하단 정보 박스 - 탭 순서 8번 */}
        <Box
          tabIndex={0}
          role="note"
          aria-label="키보드 내비게이션 요약"
          sx={{
            ...focusRing,
            width: "100%",
            maxWidth: 1280,
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[12]}px`,
            bgcolor: t.accentPurpleLight,
            borderRadius: `${tokens.radius.md}px`,
            p: `${tokens.spacing[20]}px`,
          }}
        >
          <KeyboardIcon
            sx={{ fontSize: 24, color: t.accentPurple, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: tokens.fontSize.base,
              fontWeight: 500,
              color: t.accentPurple,
            }}
          >
            마우스 없이 Tab 키만으로 이 페이지를 끝까지 사용할 수 있습니다
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
