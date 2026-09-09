import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import LabelIcon from "@mui/icons-material/Label";
import ViewListIcon from "@mui/icons-material/ViewList";
import AsteriskIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LiveFormDemo from "./LiveFormDemo";
import { tokens } from "../../theme/theme";
import type { TokensColor } from "../../theme/theme";

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
}: {
  title: string;
  children: React.ReactNode;
  t: TokensColor;
}) {
  return (
    <Box
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


export default function A11yScreenReaderPage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  const beforeItems = [
    "레이블 없이 placeholder만 사용",
    "fieldset/legend 없이 라디오 버튼 나열",
    "필수 항목을 빨간 * 색상으로만 표시",
    "에러 메시지를 빨간 텍스트로만 표시",
  ];

  const afterItems = [
    "label과 aria-describedby로 입력 필드 연결",
    "fieldset + legend로 라디오 버튼 그룹화",
    "필수 항목에 '(필수)' 텍스트 태그 추가",
    "에러에 triangle-alert 아이콘 + aria-live 적용",
  ];

  const codeComparisons = [
    {
      title:
        "1. label 연결 — placeholder만으로는 스크린 리더가 필드를 설명할 수 없음",
      before: `<!--  label 없이 placeholder만 사용 -->
<input
  type="text"
  placeholder="이름을 입력하세요"
/>`,
      after: `<!--  label + aria-describedby로 연결 -->
<label htmlFor="name">
  이름 <span>(필수)</span>
</label>
<input
  id="name"
  type="text"
  aria-describedby="name-error"
  aria-required="true"
/>`,
    },
    {
      title: "2. fieldset / legend — 라디오 그룹이 무슨 질문인지 알 수 없음",
      before: `<!--  그룹 맥락 없이 라디오 버튼 나열 -->
<div>
  <input type="radio" name="gender" /> 남성
  <input type="radio" name="gender" /> 여성
</div>`,
      after: `<!--  fieldset + legend로 그룹 의미 전달 -->
<fieldset>
  <legend>성별 <span>(필수)</span></legend>
  <input type="radio" id="male" name="gender" />
  <label htmlFor="male">남성</label>
  <input type="radio" id="female" name="gender" />
  <label htmlFor="female">여성</label>
</fieldset>`,
    },
    {
      title:
        "3. 필수 표시 — 빨간 * 색상만으로는 색맹·스크린 리더 사용자가 인지 불가",
      before: `<!--  색상(빨간 *)으로만 필수 표시 -->
<label>
  이름 <span style="color: red">*</span>
</label>`,
      after: `<!--  시각 기호 + 스크린 리더용 텍스트 병행 -->
<label>
  이름
  <span aria-hidden="true"> *</span>
  <span className="sr-only">(필수)</span>
</label>`,
    },
    {
      title:
        "4. 에러 안내 — 빨간 텍스트만으로는 스크린 리더가 자동으로 읽지 않음",
      before: `<!--  시각적 색상만으로 에러 표시 -->
<p style="color: red">
  이름을 입력해주세요
</p>`,
      after: `<!--  aria-live로 에러 즉시 낭독, input에 연결 -->
<p
  id="name-error"
  role="alert"
  aria-live="assertive"
>
  ⚠ 이름을 입력해주세요
</p>`,
    },
  ];

  const improvements = [
    {
      icon: <LabelIcon sx={{ fontSize: 20, color: t.accentPurple }} />,
      label: "label 연결",
    },
    {
      icon: <ViewListIcon sx={{ fontSize: 20, color: t.accentPurple }} />,
      label: "fieldset/legend",
    },
    {
      icon: <AsteriskIcon sx={{ fontSize: 20, color: t.accentPurple }} />,
      label: "필수 표시",
    },
    {
      icon: <WarningAmberIcon sx={{ fontSize: 20, color: t.accentPurple }} />,
      label: "에러 안내",
    },
  ];

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
            스크린 리더 친화 폼
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.md,
              color: t.textSecondary,
              textAlign: "center",
              maxWidth: 600,
            }}
          >
            시각 장애인이 스크린 리더로 폼을 사용할 때 겪는 문제와 해결 방법을
            비교합니다
          </Typography>
        </Box>

        {/* Section: 접근성 없는 폼 vs 개선한 폼 */}
        <SectionCard title="접근성 없는 폼 vs 개선한 폼" t={t}>
          <Box sx={{ display: "flex", gap: `${tokens.spacing[20]}px` }}>
            {/* Before */}
            <Box
              sx={{
                flex: 1,
                bgcolor: t.bgPrimary,
                borderRadius: `${tokens.radius.md}px`,
                border: `1px solid ${t.borderDefault}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: t.accentRed }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[8]}px`,
                  px: `${tokens.spacing[20]}px`,
                  py: `${tokens.spacing[16]}px`,
                }}
              >
                <CloseIcon sx={{ fontSize: 16, color: t.accentRed }} />
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    fontWeight: 600,
                    color: t.accentRed,
                  }}
                >
                  Before - 접근성 없는 폼
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: `${tokens.spacing[12]}px`,
                  px: `${tokens.spacing[20]}px`,
                  pb: `${tokens.spacing[20]}px`,
                }}
              >
                {beforeItems.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: `${tokens.spacing[8]}px`,
                    }}
                  >
                    <CloseIcon
                      sx={{
                        fontSize: 14,
                        color: t.accentRed,
                        mt: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: tokens.fontSize.sm,
                        color: t.textSecondary,
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* After */}
            <Box
              sx={{
                flex: 1,
                bgcolor: t.bgPrimary,
                borderRadius: `${tokens.radius.md}px`,
                border: `1px solid ${t.borderDefault}`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: t.accentGreen }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[8]}px`,
                  px: `${tokens.spacing[20]}px`,
                  py: `${tokens.spacing[16]}px`,
                }}
              >
                <CheckIcon sx={{ fontSize: 16, color: t.accentGreen }} />
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    fontWeight: 600,
                    color: t.accentGreen,
                  }}
                >
                  After - 개선된 폼
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: `${tokens.spacing[12]}px`,
                  px: `${tokens.spacing[20]}px`,
                  pb: `${tokens.spacing[20]}px`,
                }}
              >
                {afterItems.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: `${tokens.spacing[8]}px`,
                    }}
                  >
                    <CheckIcon
                      sx={{
                        fontSize: 14,
                        color: t.accentGreen,
                        mt: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: tokens.fontSize.sm,
                        color: t.textSecondary,
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title="직접 확인해보기 — 실제 동작하는 폼" t={t}>
          <LiveFormDemo t={t} />
        </SectionCard>

        {/* Section: 코드로 보는 차이 */}
        <SectionCard title="코드로 보는 차이" t={t}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[24]}px`,
            }}
          >
            {codeComparisons.map((comp) => (
              <Box key={comp.title}>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    fontWeight: 700,
                    color: t.textPrimary,
                    mb: `${tokens.spacing[12]}px`,
                  }}
                >
                  {comp.title}
                </Typography>
                <Box sx={{ display: "flex", gap: `${tokens.spacing[12]}px` }}>
                  {/* Before */}
                  <Box
                    sx={{
                      flex: 1,
                      borderRadius: `${tokens.radius.md}px`,
                      overflow: "hidden",
                      border: `1px solid ${t.accentRed}40`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        px: "14px",
                        py: "8px",
                        bgcolor: `${t.accentRed}12`,
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 13, color: t.accentRed }} />
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: t.accentRed,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Before
                      </Typography>
                    </Box>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: "16px",
                        bgcolor: t.bgSurface,
                        fontFamily: "'Fira Code', 'Consolas', monospace",
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: t.textSecondary,
                        overflowX: "auto",
                        whiteSpace: "pre",
                      }}
                    >
                      {comp.before}
                    </Box>
                  </Box>
                  {/* After */}
                  <Box
                    sx={{
                      flex: 1,
                      borderRadius: `${tokens.radius.md}px`,
                      overflow: "hidden",
                      border: `1px solid ${t.accentGreen}40`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        px: "14px",
                        py: "8px",
                        bgcolor: `${t.accentGreen}12`,
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 13, color: t.accentGreen }} />
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: t.accentGreen,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        After
                      </Typography>
                    </Box>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: "16px",
                        bgcolor: t.bgSurface,
                        fontFamily: "'Fira Code', 'Consolas', monospace",
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: t.textSecondary,
                        overflowX: "auto",
                        whiteSpace: "pre",
                      }}
                    >
                      {comp.after}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* Section: Key Improvements */}
        <SectionCard title="Key Improvements" t={t}>
          <Box sx={{ display: "flex", gap: `${tokens.spacing[16]}px` }}>
            {improvements.map((item) => (
              <Box
                key={item.label}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  bgcolor: t.bgSurface,
                  borderRadius: `${tokens.radius.md}px`,
                  p: `${tokens.spacing[20]}px`,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: `${tokens.radius.full}px`,
                    bgcolor: t.accentPurpleLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    fontWeight: 600,
                    color: t.textPrimary,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
}
