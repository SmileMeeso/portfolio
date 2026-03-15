import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@mui/material/styles";
import LayersIcon from "@mui/icons-material/Layers";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  useRenderingStore,
  type RenderingMethod,
} from "../../store/useRenderingStore";
import { tokens } from "../../theme/theme";

//  카드 데이터

interface MetricItem {
  label: string;
  value: string;
  color: string;
}

interface MethodCardData {
  id: RenderingMethod;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  whenToUse: string;
  metrics: MetricItem[];
  href: string;
}

const METHODS: MethodCardData[] = [
  {
    id: "ssg",
    badge: "SSG",
    badgeColor: "#2563EB",
    title: "Static Site Generation",
    description:
      "빌드 시 모든 HTML을 사전 생성하여 CDN에서 제공합니다. 최고의 성능과 안정성을 보장합니다.",
    whenToUse: "정적 콘텐츠, 블로그, 마케팅 페이지, 최고 성능이 필요한 경우",
    metrics: [
      { label: "빌드 시간", value: "길다", color: "#EA580C" },
      { label: "응답 속도", value: "즉시", color: "#16A34A" },
      { label: "비용", value: "매우 낮음", color: "#16A34A" },
    ],
    href: "/rendering/ssg",
  },
  {
    id: "ssr",
    badge: "SSR",
    badgeColor: "#16A34A",
    title: "Server-Side Rendering",
    description:
      "매 요청마다 서버에서 최신 데이터로 HTML을 생성합니다. 실시간 데이터와 개인화에 적합합니다.",
    whenToUse: "실시간 데이터, 개인화, 대시보드, 소셜 피드, 동적 콘텐츠",
    metrics: [
      { label: "빌드 시간", value: "빠름", color: "#16A34A" },
      { label: "응답 속도", value: "느림", color: "#EA580C" },
      { label: "비용", value: "높음", color: "#EA580C" },
    ],
    href: "/rendering/ssr",
  },
  {
    id: "isr",
    badge: "ISR",
    badgeColor: "#EA580C",
    title: "Incremental Static Regeneration",
    description:
      "캐시된 응답을 제공하면서 백그라운드에서 재검증합니다. 성능과 데이터 신선도의 균형을 맞춥니다.",
    whenToUse: "주기적 콘텐츠 업데이트, 뉴스/이커머스, 성능과 신선도 균형",
    metrics: [
      { label: "빌드 시간", value: "보통", color: "#2563EB" },
      { label: "응답 속도", value: "즉시(캐시)", color: "#16A34A" },
      { label: "비용", value: "낮음", color: "#16A34A" },
    ],
    href: "/rendering/isr",
  },
];

//  메소드 카드

function MethodCard({ data }: { data: MethodCardData }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[16]}px`,
        p: "28px",
        bgcolor: t.bgPrimary,
        border: `2px solid ${data.badgeColor}`,
        borderRadius: `${tokens.radius.lg}px`,
      }}
    >
      {/* 배지 */}
      <Box sx={{ display: "inline-flex" }}>
        <Box
          sx={{
            bgcolor: data.badgeColor,
            borderRadius: `${tokens.radius.full}px`,
            px: "12px",
            py: "5px",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: 1,
            }}
          >
            {data.badge}
          </Typography>
        </Box>
      </Box>

      {/* 타이틀 */}
      <Typography
        sx={{
          fontSize: tokens.fontSize.xl,
          fontWeight: 600,
          color: t.textPrimary,
        }}
      >
        {data.title}
      </Typography>

      {/* 설명 */}
      <Typography
        sx={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.5 }}
      >
        {data.description}
      </Typography>

      {/* 구분선 */}
      <Box sx={{ height: "1px", bgcolor: t.borderLight }} />

      {/* 적합한 경우 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: t.textTertiary,
            letterSpacing: 1,
          }}
        >
          적합한 경우
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}
        >
          {data.whenToUse}
        </Typography>
      </Box>

      {/* 메트릭 3개 박스 */}
      <Box sx={{ display: "flex", gap: "8px" }}>
        {data.metrics.map((m) => (
          <Box
            key={m.label}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              bgcolor: t.bgSurface,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
              borderRadius: "8px",
              px: "12px",
              py: "10px",
            }}
          >
            <Typography
              sx={{ fontSize: 11, fontWeight: 500, color: t.textTertiary }}
            >
              {m.label}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: m.color }}>
              {m.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 데모 보기 버튼 */}
      <Box
        onClick={() => navigate({ to: data.href as "/rendering/ssg" })}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          height: 44,
          borderRadius: "8px",
          bgcolor: data.badgeColor,
          color: "#fff",
          cursor: "pointer",
          mt: "auto",
          transition: "opacity 0.15s",
          "&:hover": { opacity: 0.88 },
        }}
      >
        <PlayArrowIcon sx={{ fontSize: 18 }} />
        <Typography
          sx={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: "#fff" }}
        >
          {data.badge} 데모 보기
        </Typography>
      </Box>
    </Box>
  );
}

//  막대 그래프

const METHOD_META: Record<
  RenderingMethod,
  { label: string; color: string; lightColor: string; href: string }
> = {
  ssg: {
    label: "SSG",
    color: "#2563EB",
    lightColor: "#60A5FA",
    href: "/rendering/ssg",
  },
  ssr: {
    label: "SSR",
    color: "#16A34A",
    lightColor: "#4ADE80",
    href: "/rendering/ssr",
  },
  isr: {
    label: "ISR",
    color: "#EA580C",
    lightColor: "#FB923C",
    href: "/rendering/isr",
  },
};

function ChartRow({
  method,
  value,
  maxValue,
  visited,
}: {
  method: RenderingMethod;
  value: number | null;
  maxValue: number;
  visited: boolean;
}) {
  const navigate = useNavigate();
  const { label, color, lightColor, href } = METHOD_META[method];
  const pct = maxValue > 0 && value !== null ? (value / maxValue) * 100 : 0;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: "#71717A",
          width: 40,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>

      {visited ? (
        <>
          <Box
            sx={{
              flex: 1,
              height: 24,
              bgcolor: "#F8FAFC",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${Math.max(pct, 0.5)}%`,
                height: "100%",
                background: `linear-gradient(270deg, ${color} 0%, ${lightColor} 100%)`,
                borderRadius: "6px",
                transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color,
              width: 60,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {value!.toLocaleString()}ms
          </Typography>
        </>
      ) : (
        <Box
          onClick={() => navigate({ to: href as "/rendering/ssg" })}
          sx={{
            flex: 1,
            height: 24,
            bgcolor: "#F8FAFC",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
            transition: "opacity 0.15s",
            "&:hover": { opacity: 0.7 },
          }}
        >
          <ArrowForwardIcon sx={{ fontSize: 14, color }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color }}>
            {label} 데모로 이동하기
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function MetricSection({
  title,
  metricKey,
}: {
  title: string;
  metricKey: "buildTime" | "initialResponse";
}) {
  const metrics = useRenderingStore((s) => s.metrics);
  const methods: RenderingMethod[] = ["ssg", "ssr", "isr"];
  const values = methods.map((m) => metrics[m]?.[metricKey] ?? null);
  const defined = values.filter((v): v is number => v !== null);
  const maxValue = defined.length > 0 ? Math.max(...defined) : 1;

  return (
    <Box>
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          fontWeight: 600,
          color: "#18181B",
          mb: "10px",
        }}
      >
        {title}
      </Typography>
      <Stack spacing={1}>
        {methods.map((m, i) => (
          <ChartRow
            key={m}
            method={m}
            value={values[i]}
            maxValue={maxValue}
            visited={values[i] !== null}
          />
        ))}
      </Stack>
    </Box>
  );
}

//  메인 페이지

export default function RenderingIndex() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const metrics = useRenderingStore((s) => s.metrics);
  const visitedCount = Object.keys(metrics).length;

  return (
    <Box
      sx={{
        px: `${tokens.spacing[80]}px`,
        py: `${tokens.spacing[48]}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[40]}px`,
        bgcolor: t.bgSurface,
        minHeight: "100vh",
      }}
    >
      {/* 페이지 헤더 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${tokens.spacing[12]}px`,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            bgcolor: t.bgHighlight,
            borderRadius: tokens.radius.full,
            px: "14px",
            py: "6px",
          }}
        >
          <LayersIcon sx={{ fontSize: 16, color: t.accentBlue }} />
          <Typography
            sx={{ fontSize: 13, fontWeight: 600, color: t.accentBlue }}
          >
            렌더링 전략
          </Typography>
        </Box>
        <Typography
          component="h1"
          sx={{
            fontSize: 36,
            fontWeight: 700,
            color: t.textPrimary,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          렌더링 전략 비교
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.md,
            color: t.textSecondary,
            textAlign: "center",
          }}
        >
          SSG, SSR, ISR 세 가지 렌더링 방식의 특징과 차이점을 알아보세요.
        </Typography>
      </Box>

      {/* 전략 카드 3개 */}
      <Box
        sx={{
          display: "flex",
          gap: `${tokens.spacing[24]}px`,
          alignItems: "stretch",
        }}
      >
        {METHODS.map((m) => (
          <MethodCard key={m.badge} data={m} />
        ))}
      </Box>

      {/* 성능 비교 차트 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[20]}px`,
          p: "28px",
          bgcolor: t.bgPrimary,
          border: `1.5px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.lg}px`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.fontSize["2xl"],
              fontWeight: 600,
              color: t.textPrimary,
            }}
          >
            성능 비교 차트
          </Typography>
          <Box
            sx={{
              bgcolor: visitedCount === 3 ? t.accentGreenLight : t.bgSurface,
              borderRadius: tokens.radius.full,
              px: "12px",
              py: "4px",
              border: `1px solid ${visitedCount === 3 ? t.accentGreen : t.borderDefault}`,
            }}
          >
            <Typography
              sx={{
                fontSize: tokens.fontSize.xs,
                fontWeight: 600,
                color: visitedCount === 3 ? t.accentGreen : t.textSecondary,
              }}
            >
              {visitedCount}/3 데모 방문
            </Typography>
          </Box>
        </Box>

        <MetricSection title="빌드 시간" metricKey="buildTime" />
        <Box sx={{ height: 1, bgcolor: t.borderLight }} />
        <MetricSection title="초기 응답 시간" metricKey="initialResponse" />
      </Box>

      {/* 한눈에 비교 테이블 */}
      <Box
        sx={{
          p: "28px",
          bgcolor: t.bgPrimary,
          border: `1.5px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.lg}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.fontSize["2xl"],
            fontWeight: 600,
            color: t.textPrimary,
            mb: `${tokens.spacing[16]}px`,
          }}
        >
          한눈에 비교
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                {["항목", "SSG", "SSR", "ISR"].map((h) => (
                  <TableCell
                    key={h}
                    align={h === "항목" ? "left" : "center"}
                    sx={{
                      fontWeight: 700,
                      bgcolor: t.bgSurface,
                      color: t.textPrimary,
                      borderBottom: `1px solid ${t.borderDefault}`,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
              {[
                [
                  "데이터 신선도",
                  "빌드 시점",
                  "요청 시점 (실시간)",
                  "캐시 + 주기 갱신",
                ],
                [
                  "초기 응답 시간",
                  "⚡⚡ 매우 빠름",
                  "🐢 상대적으로 느림",
                  "⚡ 빠름",
                ],
                ["빌드 시간", "🐢 느림", "⚡ 빠름", "🔶 중간"],
                ["서버 필요 여부", "❌ 불필요", "😭 필요", "🔶 선택적"],
                ["서버 비용", "💚 매우 낮음", "🔴 높음", "💛 낮음"],
                [
                  "대표 사용 사례",
                  "블로그·문서",
                  "대시보드·개인화",
                  "뉴스·이커머스",
                ],
              ].map(([label, ssg, ssr, isr]) => (
                <TableRow key={label} hover>
                  <TableCell
                    sx={{
                      color: t.textSecondary,
                      borderBottom: `1px solid ${t.borderLight}`,
                    }}
                  >
                    {label}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    {ssg}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    {ssr}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    {isr}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}
