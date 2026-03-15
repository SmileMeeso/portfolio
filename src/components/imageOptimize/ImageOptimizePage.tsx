import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TuneIcon from "@mui/icons-material/Tune";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { tokens, type TokensColor } from "../../theme/theme";

// 같은 seed ➞ 동일한 사진, 다른 해상도로 비교
const BEFORE_URL = "https://picsum.photos/seed/imgopt/1920/1080";
const AFTER_URL = "https://picsum.photos/seed/imgopt/828/466";

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

const FEATURES = [
  {
    icon: "📐",
    title: "자동 리사이즈",
    desc: "뷰포트·디바이스에 맞게 이미지를 자동 리사이즈합니다. 1920px 원본을 모바일에서는 828px로 줄여 불필요한 데이터 전송을 없앱니다.",
  },
  {
    icon: "🗜️",
    title: "WebP / AVIF 변환",
    desc: "브라우저 지원 여부를 감지해 JPEG·PNG를 자동으로 WebP 또는 AVIF로 변환합니다. JPEG 대비 평균 25–50% 용량을 절감합니다.",
  },
  {
    icon: "⚡",
    title: "Lazy Load + priority",
    desc: "뷰포트 밖 이미지는 지연 로딩하고, priority prop을 설정한 LCP 이미지는 <link rel=preload>로 우선 로드해 LCP를 개선합니다.",
  },
  {
    icon: "🖼️",
    title: "Blur Placeholder",
    desc: "이미지 로드 전 블러 미리보기를 표시해 레이아웃 이동(CLS)을 방지합니다. placeholder='blur' + blurDataURL 조합으로 사용합니다.",
  },
];

const CODE_EXAMPLE = `// Before - 일반 <img>
<img src="/hero.jpg" alt="Hero" />
// ➞ 원본 1920×1080 JPEG 그대로 전송, 포맷 변환 없음

// After - Next.js <Image>
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={828}
  height={466}
  priority            // LCP 이미지 ➞ <link rel="preload">
  placeholder="blur"  // CLS 방지
  blurDataURL="..."
/>
// ➞ 자동 WebP·AVIF 변환 + 리사이즈 + CDN 캐싱`;

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
          Next Image로 성능 최적화하기
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.md,
            color: t.textSecondary,
            textAlign: "center",
            maxWidth: 560,
          }}
        >
          원본 이미지와 최적화된 이미지를 직접 fetch해 파일 크기와 로드 시간을
          실측합니다.
        </Typography>
      </Box>

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
            subtitle="1920 × 1080 · JPEG (최적화 없음)"
            desc="포맷 변환·리사이즈 없이 원본 해상도로 직접 서빙합니다."
            result={before}
            status={status}
            accentColor={RED}
            bgColor={RED_LIGHT}
            dimension="1920 × 1080"
            t={t}
          />
          <ImageCard
            label="AFTER"
            title="최적화 이미지"
            subtitle="828 × 466 · WebP* (Next.js Image)"
            desc="리사이즈 + WebP 변환 + 지연 로딩으로 용량과 LCP를 개선합니다."
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

      {/* Next.js Image 최적화 기법 */}
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
          Next.js Image가 하는 일
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
          * 이 데모는 picsum.photos의 JPEG를 사용합니다. 실제 Next.js 환경에서는
          WebP·AVIF로 자동 변환됩니다.
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
                      background: `linear-gradient(90deg, ${GREEN} 0%, ${tokens.color.accentGreenLight} 100%)`,
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
