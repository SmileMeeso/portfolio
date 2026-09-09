import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TuneIcon from "@mui/icons-material/Tune";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { tokens, type TokensColor } from "../../theme/theme";

// 같은 seed ➞ 동일한 사진, 다른 해상도로 비교
// 이 사이트의 실제 스크린샷 한 쌍.
// before 는 비교용으로만 남겨둔 원본이고, after 는 갤러리가 지금 서빙하는 파일이다.
const BEFORE_URL = "/images/optimize-demo/original.png";
const AFTER_URL = "/images/projects/thumb/omelet_storybook.webp";

const ACCENT = tokens.color.accentPurple;
const ACCENT_LIGHT = tokens.color.accentPurpleLight;
const RED = tokens.color.accentRed;
const RED_LIGHT = tokens.color.accentRedLight;
const GREEN = tokens.color.accentGreen;
const GREEN_LIGHT = tokens.color.accentGreenLight;

interface ImageResult {
  sizeKB: number;
  loadMs: number;
  objectUrl: string;
}

type Status = "idle" | "loading" | "done";

/** 이 사이트를 실제로 최적화하며 적용한 것들 */
const FEATURES = [
  {
    icon: "📐",
    title: "표시 크기에 맞춘 두 벌 변환",
    desc: "5074px 원본을 240px 높이로 그리고 있었습니다. 갤러리용 480px, 라이트박스용 1920px 두 벌을 미리 만들어 용도에 맞는 쪽만 내려보냅니다.",
  },
  {
    icon: "🗜️",
    title: "WebP · 영상 재인코딩",
    desc: "글자가 많은 스크린샷이라 cwebp -sharp_yuv 로 가장자리 번짐을 억제했습니다. 오디오가 없는 46MB .mov 는 H.264 MP4 로 다시 인코딩했습니다.",
  },
  {
    icon: "⚡",
    title: "lazy 로딩 · 라우트 코드 스플리팅",
    desc: "가로 스크롤 갤러리는 화면에 걸치는 것만 받습니다. three.js 696KB 는 미니 CAD 에 들어갈 때만 내려옵니다.",
  },
  {
    icon: "🧹",
    title: "빌드 산출물에서 원본 분리",
    desc: "Vite 는 public/ 을 통째로 복사합니다. 참조되지 않는 원본 PNG 32MB 가 매 배포에 실리고 있어 저장소 밖으로 옮겼습니다.",
  },
];

/** 실측값 — 이 사이트를 최적화하기 전과 후 */
const SITE_RESULTS = [
  {
    label: "스크린샷 36장",
    before: 32.1,
    after: 4.5,
    unit: "MB",
    note: "WebP 두 벌 (썸네일 1.0 + 라이트박스 3.5)",
  },
  {
    label: "데모 영상",
    before: 46.1,
    after: 2.16,
    unit: "MB",
    note: ".mov → H.264 MP4 (CRF 20, faststart)",
  },
  {
    label: "홈 진입 JS",
    before: 1322,
    after: 494,
    unit: "KB",
    note: "라우트 코드 스플리팅 · gzip 384 → 160 KB",
  },
  {
    label: "빌드 산출물 (dist)",
    before: 87,
    after: 9.9,
    unit: "MB",
    note: "위 세 가지 + 미참조 원본 제외",
  },
];

const CODE_EXAMPLE = `# 스크린샷 — 표시 크기에 맞춰 두 벌로 변환
# -sharp_yuv 는 글자 가장자리 색 번짐을 줄여준다 (스크린샷에 특히 유효)
cwebp -q 82 -m 6 -sharp_yuv -resize 0 480  src.png -o thumb/src.webp
cwebp -q 88 -m 6 -sharp_yuv -resize 1920 0 src.png -o large/src.webp

# 데모 영상 — 오디오 없는 3434×1820 / 23Mbps .mov
ffmpeg -i demo.mov -vf scale=1920:-2 -c:v libx264 -preset slow -crf 20 \\
       -pix_fmt yuv420p -movflags +faststart -an demo.mp4

// 갤러리는 썸네일, 라이트박스는 큰 쪽을 쓴다
const screenshotSrc = (src, size) =>
  src.replace(/\\/([^/]+)\\.png$/, \`/\${size}/$1.webp\`)

<img src={screenshotSrc(shot.src, "thumb")} loading="lazy" />

// 라우트 단위 코드 스플리팅 — three.js 는 /cad 에서만 내려온다
TanStackRouterVite({ autoCodeSplitting: true })`;

//  메인 페이지

export default function ImageOptimizePage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  const [status, setStatus] = useState<Status>("idle");
  const [before, setBefore] = useState<ImageResult | null>(null);
  const [after, setAfter] = useState<ImageResult | null>(null);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => urls.forEach(URL.revokeObjectURL);
  }, []);

  const handleCompare = useCallback(async () => {
    setStatus("loading");
    setBefore(null);
    setAfter(null);

    const measure = async (url: string): Promise<ImageResult> => {
      const t0 = performance.now();
      const res = await fetch(url);
      const blob = await res.blob();
      const loadMs = Math.round(performance.now() - t0);
      const objectUrl = URL.createObjectURL(blob);
      blobUrlsRef.current.push(objectUrl);
      return { sizeKB: Math.round(blob.size / 1024), loadMs, objectUrl };
    };

    const [b, a] = await Promise.all([measure(BEFORE_URL), measure(AFTER_URL)]);
    setBefore(b);
    setAfter(a);
    setStatus("done");
  }, []);

  const sizeReduction =
    before && after
      ? Math.round((1 - after.sizeKB / before.sizeKB) * 100)
      : null;
  const lcpReduction =
    before && after
      ? Math.round((1 - after.loadMs / before.loadMs) * 100)
      : null;

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
            bgcolor: ACCENT_LIGHT,
            borderRadius: tokens.radius.full,
            px: "14px",
            py: "6px",
          }}
        >
          <TuneIcon sx={{ fontSize: 16, color: ACCENT }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>
            이미지 최적화
          </Typography>
        </Box>
        <Typography
          component="h1"
          sx={{
            fontSize: tokens.fontSize["3xl"],
            fontWeight: 700,
            color: t.textPrimary,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          이 사이트를 87MB에서 9.9MB로
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.md,
            color: t.textSecondary,
            textAlign: "center",
            maxWidth: 560,
          }}
        >
          일반론이 아니라 이 포트폴리오를 실제로 최적화한 기록입니다. 아래
          비교는 지금 브라우저에서 직접 fetch 해 측정합니다.
        </Typography>
      </Box>

      <SiteResults t={t} />

      {/* Before / After 비교 카드 */}
      <Box
        sx={{
          p: "28px",
          bgcolor: t.bgPrimary,
          border: `1.5px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.lg}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[24]}px`,
        }}
      >
        {/* 헤더 + 버튼 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: tokens.fontSize["2xl"],
                fontWeight: 600,
                color: t.textPrimary,
              }}
            >
              Before / After 비교
            </Typography>
            <Typography
              sx={{
                fontSize: tokens.fontSize.xs,
                color: t.textTertiary,
                mt: "4px",
              }}
            >
              동일한 사진(seed: imgopt)을 원본 해상도와 최적화 해상도로 각각
              fetch합니다.
            </Typography>
          </Box>
          <Button
            onClick={handleCompare}
            disabled={status === "loading"}
            startIcon={
              status === "loading" ? (
                <CircularProgress size={14} color="inherit" />
              ) : status === "done" ? (
                <AutorenewIcon />
              ) : (
                <PlayArrowIcon />
              )
            }
            sx={{
              bgcolor: ACCENT,
              color: "#fff",
              fontWeight: 600,
              px: "20px",
              py: "10px",
              borderRadius: `${tokens.radius.sm}px`,
              "&:hover": { bgcolor: ACCENT, opacity: 0.88 },
              "&.Mui-disabled": {
                bgcolor: ACCENT,
                opacity: 0.5,
                color: "#fff",
              },
            }}
          >
            {status === "idle"
              ? "비교 시작"
              : status === "loading"
                ? "측정 중..."
                : "다시 측정"}
          </Button>
        </Box>

        {/* 카드 2개 */}
        <Box
          sx={{
            display: "flex",
            gap: `${tokens.spacing[24]}px`,
            alignItems: "stretch",
          }}
        >
          <ImageCard
            label="BEFORE"
            title="원본 이미지"
            subtitle="5052 × 2494 · PNG (원본 그대로)"
            desc="포맷 변환·리사이즈 없이 원본 해상도로 직접 서빙합니다."
            result={before}
            status={status}
            accentColor={RED}
            bgColor={RED_LIGHT}
            dimension="5052 × 2494"
            t={t}
          />
          <ImageCard
            label="AFTER"
            title="최적화 이미지"
            subtitle="973 × 480 · WebP (갤러리가 쓰는 파일)"
            desc="표시 높이 240px의 2배로 리사이즈하고 cwebp -sharp_yuv 로 변환했습니다. 98% 줄었는데도 Storybook 사이드바의 컴포넌트 이름까지 읽힙니다."
            result={after}
            status={status}
            accentColor={GREEN}
            bgColor={GREEN_LIGHT}
            dimension="828 × 466"
            t={t}
          />
        </Box>

        {/* 개선 결과 */}
        {status === "done" && before && after && (
          <>
            <Box sx={{ height: 1, bgcolor: t.borderLight }} />
            <ImprovementSection
              before={before}
              after={after}
              sizeReduction={sizeReduction!}
              lcpReduction={lcpReduction!}
              t={t}
            />
          </>
        )}
      </Box>

      {/* 적용한 기법 */}
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
            mb: `${tokens.spacing[24]}px`,
          }}
        >
          이 사이트에 적용한 것
        </Typography>
        <Box sx={{ display: "flex", gap: `${tokens.spacing[16]}px` }}>
          {FEATURES.map((f) => (
            <Box
              key={f.title}
              sx={{
                flex: 1,
                p: "20px",
                bgcolor: t.bgSurface,
                borderRadius: `${tokens.radius.md}px`,
                border: `1px solid ${t.borderLight}`,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Typography sx={{ fontSize: 22 }}>{f.icon}</Typography>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 600,
                  color: t.textPrimary,
                }}
              >
                {f.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.xs,
                  color: t.textSecondary,
                  lineHeight: 1.65,
                }}
              >
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 코드 예시 */}
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
          코드 예시
        </Typography>
        <Box
          component="pre"
          sx={{
            p: "20px",
            bgcolor: t.bgSurface,
            borderRadius: `${tokens.radius.md}px`,
            border: `1px solid ${t.borderLight}`,
            fontSize: tokens.fontSize.sm,
            lineHeight: 1.75,
            overflowX: "auto",
            color: t.textPrimary,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            whiteSpace: "pre",
            m: 0,
          }}
        >
          {CODE_EXAMPLE}
        </Box>
        <Typography
          sx={{
            fontSize: tokens.fontSize.xs,
            color: t.textTertiary,
            mt: "12px",
          }}
        >
          두 파일 모두 이 사이트가 호스팅합니다. After 는 데모용으로 따로 만든
          것이 아니라 경력 섹션의 갤러리가 실제로 내려보내는 파일이고, Before 는
          비교를 위해 한 장만 남겨둔 원본입니다. 나머지 원본 35장은 저장소 밖에
          있습니다. 로드 시간은 네트워크 상태에 따라 달라지며, 로컬에서는 둘 다
          거의 0ms 로 나옵니다.
        </Typography>
      </Box>
    </Box>
  );
}

//  ImageCard

interface ImageCardProps {
  label: string;
  title: string;
  subtitle: string;
  desc: string;
  result: ImageResult | null;
  status: Status;
  accentColor: string;
  bgColor: string;
  dimension: string;
  t: TokensColor;
}

/** 이 사이트의 실측 개선치 */
function SiteResults({ t }: { t: TokensColor }) {
  return (
    <Box
      sx={{
        p: "28px",
        bgcolor: t.bgPrimary,
        border: `1.5px solid ${t.borderDefault}`,
        borderRadius: `${tokens.radius.lg}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[20]}px`,
      }}
    >
      <Box>
        <Typography
          component="h2"
          sx={{
            fontSize: tokens.fontSize["2xl"],
            fontWeight: 600,
            color: t.textPrimary,
          }}
        >
          실측 결과
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            color: t.textSecondary,
            mt: "4px",
          }}
        >
          측정 → 원인 파악 → 조치 → 재측정 순으로 진행했습니다. 막대는 개선 후
          남은 비율입니다.
        </Typography>
      </Box>

      {SITE_RESULTS.map((r) => {
        const pct = Math.max((r.after / r.before) * 100, 1);
        const cut = Math.round((1 - r.after / r.before) * 100);
        return (
          <Box
            key={r.label}
            sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: `${tokens.spacing[10]}px`,
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 700,
                  color: t.textPrimary,
                  minWidth: 150,
                }}
              >
                {r.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  color: t.textTertiary,
                  textDecoration: "line-through",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.before} {r.unit}
              </Typography>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.base,
                  fontWeight: 700,
                  color: GREEN,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.after} {r.unit}
              </Typography>
              <Box
                sx={{
                  bgcolor: GREEN_LIGHT,
                  borderRadius: `${tokens.radius.xs}px`,
                  px: "8px",
                  py: "2px",
                }}
              >
                <Typography
                  sx={{ fontSize: tokens.fontSize.xs, fontWeight: 700, color: GREEN }}
                >
                  {cut}% 감소
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: t.bgSurface,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  bgcolor: GREEN,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }}
              />
            </Box>

            <Typography
              sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary }}
            >
              {r.note}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function ImageCard({
  label,
  title,
  subtitle,
  desc,
  result,
  status,
  accentColor,
  bgColor,
  dimension,
  t,
}: ImageCardProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        p: "20px",
        border: `2px solid ${accentColor}`,
        borderRadius: `${tokens.radius.md}px`,
        bgcolor: t.bgPrimary,
      }}
    >
      {/* 배지 + 타이틀 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Box
          sx={{ bgcolor: bgColor, borderRadius: 100, px: "10px", py: "4px" }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 0.8,
            }}
          >
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: tokens.fontSize.md,
            fontWeight: 600,
            color: t.textPrimary,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: tokens.fontSize.xs,
            fontWeight: 600,
            color: accentColor,
            mb: "4px",
          }}
        >
          {subtitle}
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            color: t.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </Typography>
      </Box>

      {/* 이미지 영역 */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 260,
          bgcolor: t.bgSurface,
          borderRadius: `${tokens.radius.sm}px`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {status === "idle" && (
          <Typography
            sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}
          >
            "비교 시작"을 눌러주세요
          </Typography>
        )}
        {status === "loading" && (
          <CircularProgress size={32} sx={{ color: accentColor }} />
        )}
        {status === "done" && result && (
          <Box
            component="img"
            src={result.objectUrl}
            alt={title}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </Box>

      {/* 메트릭 3개 */}
      {result ? (
        <Box sx={{ display: "flex", gap: "8px" }}>
          <MetricBox
            label="파일 크기"
            value={`${result.sizeKB} KB`}
            color={accentColor}
            t={t}
          />
          <MetricBox
            label="로드 시간"
            value={`${result.loadMs} ms`}
            color={accentColor}
            t={t}
          />
          <MetricBox
            label="해상도"
            value={dimension}
            color={accentColor}
            t={t}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: "8px" }}>
          {["파일 크기", "로드 시간", "해상도"].map((l) => (
            <Box
              key={l}
              sx={{
                flex: 1,
                p: "10px 12px",
                bgcolor: t.bgSurface,
                borderRadius: `${tokens.radius.sm}px`,
              }}
            >
              <Typography
                sx={{ fontSize: 11, color: t.textTertiary, fontWeight: 500 }}
              >
                {l}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: t.textDisabled,
                  fontWeight: 700,
                  mt: "4px",
                }}
              >
                -
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function MetricBox({
  label,
  value,
  color,
  t,
}: {
  label: string;
  value: string;
  color: string;
  t: TokensColor;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        p: "10px 12px",
        bgcolor: t.bgSurface,
        borderRadius: `${tokens.radius.sm}px`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <Typography sx={{ fontSize: 11, color: t.textTertiary, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, color, fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

//  ImprovementSection

interface ImprovementProps {
  before: ImageResult;
  after: ImageResult;
  sizeReduction: number;
  lcpReduction: number;
  t: TokensColor;
}

function ImprovementSection({
  before,
  after,
  sizeReduction,
  lcpReduction,
  t,
}: ImprovementProps) {
  const rows = [
    {
      label: "파일 크기",
      beforeVal: before.sizeKB,
      afterVal: after.sizeKB,
      beforeLabel: `${before.sizeKB} KB`,
      afterLabel: `${after.sizeKB} KB`,
      reduction: sizeReduction,
    },
    {
      label: "로드 시간 (LCP 기준)",
      beforeVal: before.loadMs,
      afterVal: after.loadMs,
      beforeLabel: `${before.loadMs} ms`,
      afterLabel: `${after.loadMs} ms`,
      reduction: lcpReduction,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[20]}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: tokens.fontSize.md,
          fontWeight: 600,
          color: t.textPrimary,
        }}
      >
        개선 효과
      </Typography>
      {rows.map((row) => {
        const afterPct = Math.max((row.afterVal / row.beforeVal) * 100, 1);
        const improved = row.reduction > 0;
        return (
          <Box
            key={row.label}
            sx={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* 레이블 + 수치 + 배지 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 600,
                  color: t.textPrimary,
                }}
              >
                {row.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Typography
                  sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary }}
                >
                  {row.beforeLabel} ➞ {row.afterLabel}
                </Typography>
                <Box
                  sx={{
                    bgcolor: improved
                      ? GREEN_LIGHT
                      : tokens.color.accentRedLight,
                    borderRadius: 100,
                    px: "10px",
                    py: "3px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: improved ? GREEN : RED,
                    }}
                  >
                    {improved
                      ? `↓ ${row.reduction}% 절감`
                      : `↑ ${Math.abs(row.reduction)}% 증가`}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Before/After 막대 비교 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: RED,
                    width: 50,
                    flexShrink: 0,
                  }}
                >
                  Before
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 14,
                    bgcolor: t.bgSurface,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      bgcolor: RED,
                      borderRadius: 4,
                      opacity: 0.7,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: RED,
                    width: 70,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {row.beforeLabel}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: GREEN,
                    width: 50,
                    flexShrink: 0,
                  }}
                >
                  After
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 14,
                    bgcolor: t.bgSurface,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${afterPct}%`,
                      height: "100%",
                      bgcolor: GREEN,
                      borderRadius: 4,
                      transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: GREEN,
                    width: 70,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {row.afterLabel}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
