import { Box, Typography, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import { tokens } from "../../theme/theme";
import type { TokensColor } from "../../theme/theme";

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

const frontEndSkills = [
  "JavaScript (TypeScript)",
  "React.js",
  "Next.js",
  "Vite",
  "Webpack",
  "MUI",
  "Tailwind CSS",
  "Storybook",
  "Video.js",
  "WebRTC",
  "Leaflet.js",
  "PWA",
];
const backEndSkills = [
  "Node.js",
  "Python",
  "FastAPI",
  "PHP",
  "Express.js",
  "PostgreSQL",
  "MySQL",
  "Firebase",
];
const devOpsSkills = [
  "Docker",
  "Kubernetes (k8s)",
  "GitHub Actions",
  "ArgoCD",
  "AWS EC2",
  "Linux (Ubuntu)",
];
const aiSkills = [
  "Claude Code",
  "Harness Engineering",
  "Subagents",
  "Custom Commands",
];

const career = [
  {
    period: "2025.10 ~ 재직중",
    company: "omelet",
    role: "프론트 개발자",
    type: "정규직",
  },
  {
    period: "2025.08 ~ 2025.09",
    company: "SK AX",
    role: "내부 CMS 유지보수",
    type: "프리랜서",
  },
  {
    period: "2025.05 ~ 2025.06",
    company: "SK 하이닉스",
    role: "디자인 시스템 개발",
    type: "프리랜서",
  },
  {
    period: "2025.01 ~ 2025.03",
    company: "나눔사 (개인 프로젝트)",
    role: "위치 기반 무료 나눔 플랫폼 — 풀스택 개발 및 스토어 출시",
    type: "개인",
  },
  {
    period: "2022.07 ~ 2024.10",
    company: "(주)위대한상상 (요기요)",
    role: "R&D 센터 Data Service 팀원",
    type: "정규직",
  },
  {
    period: "2021.04 ~ 2022.06",
    company: "웅진씽크빅",
    role: "스마트올 중학 PJT, 프론트엔드 PJT",
    type: "프리랜서",
  },
  {
    period: "2021.01 ~ 2021.03",
    company: "해피브릿지",
    role: "개발팀",
    type: "스타트업",
  },
  {
    period: "2018.05 ~ 2020.12",
    company: "커넥트닷",
    role: "개발팀",
    type: "스타트업",
  },
  {
    period: "2017.06 ~ 2018.05",
    company: "SK 플래닛",
    role: "11번가 로그 TF",
    type: "파견직",
  },
];

const typeColor: Record<string, string> = {
  정규직: "#9333EA",
  프리랜서: "#2563EB",
  스타트업: "#16A34A",
  파견직: "#CA8A04",
  개인: "#EA580C",
};

export default function ProfilePage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              bgcolor: t.accentPurpleLight,
              borderRadius: `${tokens.radius.full}px`,
              px: "14px",
              py: `${tokens.spacing[6]}px`,
            }}
          >
            <PersonIcon sx={{ fontSize: 16, color: t.accentPurple }} />
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.accentPurple,
              }}
            >
              소개
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: tokens.fontSize["3xl"],
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            김미소
          </Typography>
          <Typography
            sx={{ fontSize: tokens.fontSize.md, color: t.textSecondary }}
          >
            Frontend Developer · 총 8년 2개월 경력
          </Typography>
        </Box>

        {/* 연락처 */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            bgcolor: t.bgPrimary,
            borderRadius: `${tokens.radius.lg}px`,
            border: `1.5px solid ${t.borderDefault}`,
            p: "28px",
            display: "flex",
            gap: `${tokens.spacing[40]}px`,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              icon: <EmailIcon sx={{ fontSize: 16, color: t.accentPurple }} />,
              label: "m950827@naver.com",
            },
            {
              icon: <PhoneIcon sx={{ fontSize: 16, color: t.accentPurple }} />,
              label: "010-4810-9869",
            },
            {
              icon: (
                <LocationOnIcon sx={{ fontSize: 16, color: t.accentPurple }} />
              ),
              label: "경기도 성남시 분당구 정자동",
            },
            {
              icon: <SchoolIcon sx={{ fontSize: 16, color: t.accentPurple }} />,
              label: "명지대학교 기계공학과 졸업",
            },
          ].map(({ icon, label }) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {icon}
              <Typography
                sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 자기소개 */}
        <SectionCard title="자기소개" t={t}>
          <Typography
            sx={{
              fontSize: tokens.fontSize.base,
              color: t.textSecondary,
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {`React를 주로 사용하는 Frontend 개발자지만 Vanilla JS로 개발하는 것도 좋아합니다. Zustand, Redux 등으로 상태관리를 하고, 단위테스트, e2e 테스트 경험이 있습니다.

서버나 DB를 AWS EC2 같은 클라우드 환경에서 사용한 경험이 있어 관련된 포지션 분들과 대화할 때 편한 점이 있습니다. Docker, k8s, GitHub Actions, ArgoCD를 이용해서 전체 CI/CD 파이프라인을 구성한 경험도 있습니다.

웹앱을 개발한 경험이 많아 Android, iOS, Flutter에서 웹뷰가 어떻게 개발되어야 하는지 알고 있습니다. Storybook을 사용해 모듈화와 문서화를 함께 처리하는 것을 즐깁니다. 항상 틀린 걸 인정하고, 팀 단위의 협업에서 고집보다 본질을 먼저 생각합니다.`}
          </Typography>
        </SectionCard>

        {/* 기술 스택 */}
        <SectionCard title="기술 스택" t={t}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[20]}px`,
            }}
          >
            {[
              {
                category: "Front-end",
                skills: frontEndSkills,
                color: "#9333EA",
              },
              { category: "Back-end", skills: backEndSkills, color: "#2563EB" },
              { category: "DevOps", skills: devOpsSkills, color: "#16A34A" },
              { category: "AI Tooling", skills: aiSkills, color: "#DB2777" },
            ].map(({ category, skills, color }) => (
              <Box key={category}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    bgcolor: `${color}18`,
                    borderRadius: `${tokens.radius.sm}px`,
                    px: "10px",
                    py: "4px",
                    mb: `${tokens.spacing[12]}px`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: 700,
                      color,
                    }}
                  >
                    {category}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      sx={{
                        fontSize: tokens.fontSize.xs,
                        bgcolor: t.bgSurface,
                        color: t.textPrimary,
                        border: `1px solid ${t.borderLight}`,
                        borderRadius: `${tokens.radius.sm}px`,
                        height: 28,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* 경력 */}
        <SectionCard title="경력 사항" t={t}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {career.map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[16]}px`,
                  py: "14px",
                  borderBottom:
                    i < career.length - 1
                      ? `1px solid ${t.borderLight}`
                      : "none",
                  flexWrap: "wrap",
                }}
              >
                {/* 기간 */}
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textTertiary,
                    minWidth: 180,
                    flexShrink: 0,
                  }}
                >
                  {item.period}
                </Typography>

                {/* 회사명 */}
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.base,
                    fontWeight: 700,
                    color: t.textPrimary,
                    minWidth: 160,
                    flexShrink: 0,
                  }}
                >
                  {item.company}
                </Typography>

                {/* 역할 */}
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textSecondary,
                    flex: 1,
                  }}
                >
                  {item.role}
                </Typography>

                {/* 고용형태 */}
                <Box
                  sx={{
                    px: "10px",
                    py: "3px",
                    bgcolor: `${typeColor[item.type]}18`,
                    borderRadius: `${tokens.radius.full}px`,
                    border: `1px solid ${typeColor[item.type]}40`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.xs,
                      fontWeight: 600,
                      color: typeColor[item.type],
                    }}
                  >
                    {item.type}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Box>
    </Box>
  );
}
