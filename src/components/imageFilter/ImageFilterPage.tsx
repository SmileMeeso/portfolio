import { useRef, useState, useCallback, useEffect } from "react";
import {
  getJsWorker,
  getWasmWorker,
  isWasmReady,
  onWasmReady,
} from "./workerSingletons";
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckIcon from "@mui/icons-material/Check";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { tokens, type TokensColor } from "../../theme/theme";

type FilterName =
  | "grayscale"
  | "invert"
  | "sepia"
  | "brightness"
  | "blur"
  | "pixelate"
  | "unsharpMask"
  | "edgeDetect";

interface PanelState {
  running: boolean;
  ms: number | null;
}

const FILTERS: { name: FilterName; label: string; desc: string }[] = [
  {
    name: "grayscale",
    label: "그레이스케일",
    desc: "이미지를 흑백으로 변환합니다",
  },
  {
    name: "invert",
    label: "색상 반전",
    desc: "모든 픽셀의 색상 값을 반전시킵니다",
  },
  {
    name: "sepia",
    label: "세피아",
    desc: "빈티지 느낌의 세피아 톤을 적용합니다",
  },
  {
    name: "brightness",
    label: "밝기 +50",
    desc: "이미지의 전체 밝기를 높입니다",
  },
  {
    name: "blur",
    label: "블러",
    desc: "분리형 슬라이딩 윈도우 박스 블러 (15x15)",
  },
  {
    name: "pixelate",
    label: "픽셀화",
    desc: "이미지를 픽셀 아트 스타일로 변환합니다",
  },
  {
    name: "unsharpMask",
    label: "언샤프 마스크",
    desc: "슬라이딩 윈도우 블러 기반 엣지 강조",
  },
  {
    name: "edgeDetect",
    label: "엣지 감지",
    desc: "Sobel 커널로 윤곽선을 추출합니다",
  },
];

const DEFAULT_IMAGE = "https://picsum.photos/seed/wasm/4000/3000";

const yieldToUI = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

export default function ImageFilterPage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;

  const [selectedFilter, setSelectedFilter] = useState<FilterName>("grayscale");
  const [jsPanel, setJsPanel] = useState<PanelState>({
    running: false,
    ms: null,
  });
  const [wasmPanel, setWasmPanel] = useState<PanelState>({
    running: false,
    ms: null,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const jsCanvasRef = useRef<HTMLCanvasElement>(null);
  const rustCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 모듈 레벨 싱글턴 사용 - 컴포넌트 재마운트 시 WASM 재초기화 없음
  const jsWorkerRef = useRef<Worker>(getJsWorker());
  const wasmWorkerRef = useRef<Worker>(getWasmWorker());

  useEffect(() => {
    if (isWasmReady()) {
      setWasmReady(true);
    } else {
      onWasmReady(() => setWasmReady(true));
    }
  }, []);

  const drawOriginal = useCallback(() => {
    const img = imageRef.current;
    const canvas = originalCanvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    setImageLoaded(true);
  }, []);

  const getImageData = useCallback(() => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return null;
    return canvas
      .getContext("2d")!
      .getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const putImageData = useCallback(
    (
      canvas: HTMLCanvasElement,
      data: Uint8ClampedArray | Uint8Array,
      w: number,
      h: number,
    ) => {
      canvas.width = w;
      canvas.height = h;
      canvas
        .getContext("2d")!
        .putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
    },
    [],
  );

  // filter 파라미터를 직접 받아 stale closure 방지
  const runFilter = useCallback(
    async (filterName: FilterName) => {
      const rawData = getImageData();
      if (
        !rawData ||
        !jsCanvasRef.current ||
        !rustCanvasRef.current ||
        !jsWorkerRef.current ||
        !wasmWorkerRef.current
      )
        return;

      setIsRunning(true);
      setJsPanel({ running: true, ms: null });
      setWasmPanel({ running: true, ms: null });
      await yieldToUI();

      const { width, height } = rawData;
      let settled = 0;
      const onSettled = () => {
        if (++settled === 2) setIsRunning(false);
      };

      const jsPixels = new Uint8ClampedArray(rawData.data);
      const jsHandler = (
        e: MessageEvent<{ filtered: Uint8ClampedArray; ms: number }>,
      ) => {
        jsWorkerRef.current!.removeEventListener("message", jsHandler);
        putImageData(jsCanvasRef.current!, e.data.filtered, width, height);
        setJsPanel({ running: false, ms: e.data.ms });
        onSettled();
      };
      jsWorkerRef.current.addEventListener("message", jsHandler);
      jsWorkerRef.current.postMessage(
        { filter: filterName, pixels: jsPixels, width, height },
        [jsPixels.buffer],
      );

      const wasmPixels = new Uint8ClampedArray(rawData.data);
      const wasmHandler = (
        e: MessageEvent<{ type: string; filtered?: Uint8Array; ms?: number }>,
      ) => {
        if (e.data.type !== "result") return;
        wasmWorkerRef.current!.removeEventListener("message", wasmHandler);
        putImageData(rustCanvasRef.current!, e.data.filtered!, width, height);
        setWasmPanel({ running: false, ms: e.data.ms! });
        onSettled();
      };
      wasmWorkerRef.current.addEventListener("message", wasmHandler);
      wasmWorkerRef.current.postMessage(
        { filter: filterName, pixels: wasmPixels, width, height },
        [wasmPixels.buffer],
      );
    },
    [getImageData, putImageData],
  );

  const ready = imageLoaded && wasmReady;

  // 필터 선택 시 즉시 실행
  const handleFilterSelect = (filter: FilterName) => {
    setSelectedFilter(filter);
    if (ready && !isRunning) {
      runFilter(filter);
    }
  };

  const bothDone = jsPanel.ms !== null && wasmPanel.ms !== null;
  const speedRatio =
    bothDone && wasmPanel.ms! > 0 ? jsPanel.ms! / wasmPanel.ms! : null;

  return (
    <Box
      sx={{
        px: `${tokens.spacing[80]}px`,
        py: `${tokens.spacing[40]}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[32]}px`,
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
        {/* 배지 - gap을 '6px' 문자열로 명시 */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            bgcolor: t.accentPurpleLight,
            borderRadius: `${tokens.radius.full}px`,
            px: "14px",
            py: "6px",
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="2"
                width="8"
                height="8"
                rx="1"
                fill={t.accentPurple}
              />
              <rect
                x="14"
                y="2"
                width="8"
                height="8"
                rx="1"
                fill={t.accentPurple}
                opacity="0.6"
              />
              <rect
                x="2"
                y="14"
                width="8"
                height="8"
                rx="1"
                fill={t.accentPurple}
                opacity="0.6"
              />
              <rect
                x="14"
                y="14"
                width="8"
                height="8"
                rx="1"
                fill={t.accentPurple}
                opacity="0.3"
              />
            </svg>
          </Box>
          <Typography
            sx={{
              fontSize: tokens.fontSize.sm,
              fontWeight: 600,
              color: t.accentPurple,
            }}
          >
            WebAssembly
          </Typography>
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: tokens.fontSize["3xl"],
            fontWeight: 700,
            color: t.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          이미지 필터 성능 비교
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.base,
            color: t.textTertiary,
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          JavaScript와 Rust(WebAssembly)의 이미지 처리 성능을 실시간으로
          비교합니다.{"\n"}
          다양한 필터를 적용하고 두 엔진의 처리 속도 차이를 확인해보세요.
        </Typography>
      </Box>

      {/* WASM 로딩 */}
      {!wasmReady && (
        <Box sx={{ maxWidth: 400, mx: "auto", width: "100%" }}>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            WASM 모듈 로드 중 (컴파일·워밍업)...
          </Typography>
          <LinearProgress sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {/* 커스텀 필터 콤보박스 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <FilterCombobox
          value={selectedFilter}
          onChange={handleFilterSelect}
          filters={FILTERS}
          t={t}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: 22,
              lineHeight: 1,
              animation: "pointLeft 0.8s ease-in-out infinite alternate",
              "@keyframes pointLeft": {
                from: { transform: "translateX(0)" },
                to: { transform: "translateX(-6px)" },
              },
            }}
          >
            👈
          </Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: t.accentPurple,
              whiteSpace: "nowrap",
            }}
          >
            여기서 필터를 골라주세요!
          </Typography>
        </Box>
      </Box>

      {/* 숨겨진 원본 이미지 로더 */}
      <img
        ref={imageRef}
        src={DEFAULT_IMAGE}
        alt="원본"
        crossOrigin="anonymous"
        onLoad={drawOriginal}
        style={{ display: "none" }}
      />

      {/* 캔버스 3개 */}
      <Box sx={{ display: "flex", gap: `${tokens.spacing[20]}px` }}>
        {/* 원본 */}
        <ResultCard
          title="원본 이미지"
          subtitle="4000 x 3000px"
          borderColor={t.borderDefault}
          t={t}
        >
          <canvas
            ref={originalCanvasRef}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {!imageLoaded && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          )}
        </ResultCard>

        {/* JavaScript 결과 */}
        <ResultCard
          title="JavaScript"
          subtitle={
            jsPanel.running
              ? "처리 중..."
              : jsPanel.ms !== null
                ? "처리 시간"
                : "필터 미적용"
          }
          badge={jsPanel.ms !== null ? `${jsPanel.ms.toFixed(3)}ms` : undefined}
          badgeColor="#FFC107"
          borderColor={jsPanel.ms !== null ? "#FFC107" : t.borderDefault}
          t={t}
        >
          <Box
            sx={{
              position: "relative",
              background: t.bgSurface,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <canvas
              ref={jsCanvasRef}
              style={{
                width: "100%",
                height: "auto",
                display:
                  jsPanel.ms !== null || jsPanel.running ? "block" : "none",
              }}
            />
            {jsPanel.ms === null && !jsPanel.running && (
              <EmptyCanvasPlaceholder t={t} />
            )}
            {jsPanel.running && <LoadingOverlay color="#FFC107" />}
          </Box>
        </ResultCard>

        {/* Rust / WASM 결과 */}
        <ResultCard
          title="Rust (WebAssembly)"
          subtitle={
            wasmPanel.running
              ? "처리 중..."
              : wasmPanel.ms !== null
                ? "처리 시간"
                : "필터 미적용"
          }
          badge={
            wasmPanel.ms !== null ? `${wasmPanel.ms.toFixed(3)}ms` : undefined
          }
          badgeColor={t.accentGreen}
          borderColor={wasmPanel.ms !== null ? t.accentGreen : t.borderDefault}
          t={t}
        >
          <Box
            sx={{
              position: "relative",
              background: t.bgSurface,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <canvas
              ref={rustCanvasRef}
              style={{
                width: "100%",
                height: "auto",
                display:
                  wasmPanel.ms !== null || wasmPanel.running ? "block" : "none",
              }}
            />
            {wasmPanel.ms === null && !wasmPanel.running && (
              <EmptyCanvasPlaceholder t={t} />
            )}
            {wasmPanel.running && <LoadingOverlay color={t.accentGreen} />}
          </Box>
        </ResultCard>
      </Box>

      {/* 처리 소요 시간 비교 차트 */}
      <Box
        sx={{
          bgcolor: t.bgPrimary,
          border: `1.5px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.lg}px`,
          p: `${tokens.spacing[32]}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[24]}px`,
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
            처리 소요 시간 비교
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.sm,
              color: t.textSecondary,
              mt: "4px",
            }}
          >
            {jsPanel.ms !== null || wasmPanel.ms !== null
              ? "단위: ms / 낮을수록 빠름"
              : "필터를 적용 후 결과를 보세요"}
          </Typography>
        </Box>

        {jsPanel.ms !== null || wasmPanel.ms !== null ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: `${tokens.spacing[8]}px`,
              }}
            >
              <BenchmarkBar
                label="JavaScript"
                ms={jsPanel.ms}
                color="#FFC107"
                maxMs={Math.max(jsPanel.ms ?? 0, wasmPanel.ms ?? 0)}
                t={t}
              />
              <BenchmarkBar
                label="Rust (WASM)"
                ms={wasmPanel.ms}
                color={t.accentGreen}
                maxMs={Math.max(jsPanel.ms ?? 0, wasmPanel.ms ?? 0)}
                t={t}
              />
            </Box>

            {speedRatio !== null && (
              <>
                <Box sx={{ height: 1, bgcolor: t.borderLight }} />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${tokens.spacing[12]}px`,
                  }}
                >
                  <TrendingUpIcon
                    sx={{
                      fontSize: 20,
                      color: speedRatio >= 1 ? t.accentBlue : t.accentRed,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.base,
                      fontWeight: 500,
                      color: t.textSecondary,
                    }}
                  >
                    Rust(WASM)가 JavaScript보다
                  </Typography>
                  <Box
                    sx={{
                      bgcolor:
                        speedRatio >= 1 ? t.accentBlueLight : t.accentRedLight,
                      borderRadius: 6,
                      px: "12px",
                      py: "4px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: tokens.fontSize.sm,
                        fontWeight: 700,
                        color: speedRatio >= 1 ? t.accentBlue : t.accentRed,
                      }}
                    >
                      {speedRatio >= 1
                        ? `${speedRatio.toFixed(2)}배 더 빠름`
                        : `${(1 / speedRatio).toFixed(2)}배 더 느림`}
                    </Typography>
                  </Box>
                  {selectedFilter === "edgeDetect" &&
                    speedRatio !== null &&
                    speedRatio < 1 && (
                      <Tooltip
                        title={
                          <Box sx={{ p: "4px", maxWidth: 320 }}>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 600, mb: "6px" }}
                            >
                              왜 엣지 감지는 JavaScript가 더 빠를 수 있나요?
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.85)",
                              }}
                            >
                              Sobel은 3x3 고정 커널로 연산량이 작습니다. V8 JIT
                              컴파일러는 이런 단순·반복 루프를 네이티브 CPU
                              명령어로 공격적으로 최적화하기 때문에 WASM의 실행
                              속도 이점이 상쇄될 수 있습니다.{"\n\n"}
                              WASM이 압도적으로 빠른 경우는{" "}
                              <strong>블러·언샤프 마스크</strong>처럼 연산량이
                              훨씬 많은 필터입니다.
                            </Typography>
                          </Box>
                        }
                        arrow
                        placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor:
                                t.bgSurface === "#fff" ? "#1e1e2e" : "#2a2a3e",
                              border: `1px solid ${t.borderDefault}`,
                              borderRadius: `${tokens.radius.md}px`,
                              boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
                              p: "12px 16px",
                            },
                          },
                          arrow: {
                            sx: {
                              color:
                                t.bgSurface === "#fff" ? "#1e1e2e" : "#2a2a3e",
                            },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "help",
                            color: t.textTertiary,
                            transition: "color 0.15s",
                            "&:hover": { color: t.accentBlue },
                          }}
                        >
                          <InfoOutlinedIcon
                            sx={{ fontSize: 18, color: "inherit" }}
                          />
                          <Typography
                            sx={{
                              fontSize: tokens.fontSize.sm,
                              color: "inherit",
                            }}
                          >
                            왜 WASM이 더 느린가요?
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                </Box>
              </>
            )}
          </>
        ) : (
          <EmptyChartState t={t} />
        )}
      </Box>

      {/* 기술 노트 */}
      <TechNotes t={t} />
    </Box>
  );
}

//  커스텀 필터 콤보박스

interface FilterComboboxProps {
  value: FilterName;
  onChange: (f: FilterName) => void;
  filters: { name: FilterName; label: string; desc: string }[];
  t: TokensColor;
}

function FilterCombobox({ value, onChange, filters, t }: FilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedItem = filters.find((f) => f.name === value)!;

  const handleSelect = (name: FilterName) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <Box sx={{ position: "relative", width: 320 }}>
      {/* 트리거 */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "16px",
          py: "12px",
          bgcolor: t.bgPrimary,
          border: `1.5px solid ${open ? t.accentBlue : t.borderDefault}`,
          borderRadius: open
            ? `${tokens.radius.md}px ${tokens.radius.md}px 0 0`
            : `${tokens.radius.md}px`,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TuneIcon
            sx={{ fontSize: 18, color: open ? t.accentBlue : t.textTertiary }}
          />
          <Typography
            sx={{
              fontSize: tokens.fontSize.base,
              fontWeight: 500,
              color: open ? t.textPrimary : t.textTertiary,
            }}
          >
            {open || value ? selectedItem.label : "필터를 선택하세요"}
          </Typography>
        </Box>
        {open ? (
          <KeyboardArrowUpIcon sx={{ fontSize: 18, color: t.accentBlue }} />
        ) : (
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: t.textTertiary }} />
        )}
      </Box>

      {/* 드롭다운 */}
      {open && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            bgcolor: t.bgPrimary,
            border: `1.5px solid ${t.borderDefault}`,
            borderTop: "none",
            borderRadius: `0 0 ${tokens.radius.md}px ${tokens.radius.md}px`,
            boxShadow: `0 8px 24px ${t.shadowColorLg}`,
            overflow: "hidden",
          }}
        >
          {filters.map((f) => {
            const isSelected = f.name === value;
            return (
              <Box
                key={f.name}
                onClick={() => handleSelect(f.name)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: "16px",
                  py: "12px",
                  bgcolor: isSelected ? t.bgHighlight : "transparent",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: isSelected ? t.bgHighlight : t.bgSurface,
                  },
                }}
              >
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "2px" }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? t.accentBlue : t.textPrimary,
                    }}
                  >
                    {f.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: t.textTertiary }}>
                    {f.desc}
                  </Typography>
                </Box>
                {isSelected && (
                  <CheckIcon
                    sx={{ fontSize: 16, color: t.accentBlue, flexShrink: 0 }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {open && (
        <Box
          onClick={() => setOpen(false)}
          sx={{ position: "fixed", inset: 0, zIndex: 49 }}
        />
      )}
    </Box>
  );
}

//  결과 카드

interface ResultCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  borderColor: string;
  children: React.ReactNode;
  t: TokensColor;
}

function ResultCard({
  title,
  subtitle,
  badge,
  badgeColor,
  borderColor,
  children,
  t,
}: ResultCardProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: t.bgPrimary,
        border: `1.5px solid ${borderColor}`,
        borderRadius: `${tokens.radius.lg}px`,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <Box
        sx={{
          p: `${tokens.spacing[20]}px`,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
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
              fontSize: tokens.fontSize.md,
              fontWeight: 600,
              color: t.textPrimary,
            }}
          >
            {title}
          </Typography>
          {badge && (
            <Box
              sx={{
                bgcolor: badgeColor,
                borderRadius: `${tokens.radius.full}px`,
                px: "12px",
                py: "3px",
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {badge}
              </Typography>
            </Box>
          )}
        </Box>
        {subtitle && (
          <Typography
            sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

//  로딩 오버레이

function LoadingOverlay({ color }: { color: string }) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        background: "rgba(0,0,0,0.45)",
        borderRadius: 1,
      }}
    >
      <CircularProgress sx={{ color }} size={52} thickness={4} />
      <Typography variant="caption" color="white" fontWeight="bold">
        처리 중...
      </Typography>
    </Box>
  );
}

//  빈 차트 상태

function EmptyChartState({ t }: { t: TokensColor }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${tokens.spacing[12]}px`,
        py: `${tokens.spacing[40]}px`,
        bgcolor: t.bgSurface,
        borderRadius: `${tokens.radius.md}px`,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" fill={t.borderDefault} />
        <rect
          x="10"
          y="7"
          width="4"
          height="14"
          rx="1"
          fill={t.borderDefault}
        />
        <rect
          x="17"
          y="4"
          width="4"
          height="17"
          rx="1"
          fill={t.borderDefault}
        />
      </svg>
      <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}>
        필터를 선택해 비교해 보세요!
      </Typography>
    </Box>
  );
}

//  빈 캔버스 플레이스홀더

function EmptyCanvasPlaceholder({ t }: { t: TokensColor }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: `${tokens.spacing[8]}px`,
        bgcolor: t.bgSurface,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={t.borderDefault} />
        <rect x="14" y="3" width="7" height="7" rx="1" fill={t.borderDefault} />
        <rect x="3" y="14" width="7" height="7" rx="1" fill={t.borderDefault} />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1"
          fill={t.borderDefault}
        />
      </svg>
      <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}>
        필터를 선택해 성능을 측정하세요
      </Typography>
    </Box>
  );
}

//  벤치마크 바

function BenchmarkBar({
  label,
  ms,
  color,
  maxMs,
  t,
}: {
  label: string;
  ms: number | null;
  color: string;
  maxMs: number;
  t: TokensColor;
}) {
  const pct = ms !== null && maxMs > 0 ? (ms / maxMs) * 100 : 0;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.spacing[12]}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          color: t.textSecondary,
          width: 100,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 24,
          bgcolor: t.bgSurface,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: "100%",
            bgcolor: color,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </Box>
      {ms !== null && (
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            fontWeight: 600,
            color: t.textPrimary,
            width: 70,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {ms.toFixed(3)}ms
        </Typography>
      )}
    </Box>
  );
}

//  기술 노트

/** 픽셀당 연산량 기준으로 정리한 필터별 WASM 우위 경향 */
const FILTER_NOTES: {
  label: string;
  cost: string;
  tendency: string;
  level: "high" | "mid" | "low";
}[] = [
  {
    label: "언샤프 마스크",
    cost: "블러 1회 + 원본 합성 · 픽셀당 연산 최다",
    tendency: "WASM 우위 큼",
    level: "high",
  },
  {
    label: "블러 (15×15)",
    cost: "분리형 슬라이딩 윈도우 · 인덱스 계산 비중 큼",
    tendency: "WASM 우위 큼",
    level: "high",
  },
  {
    label: "픽셀화",
    cost: "블록 평균 · 1패스지만 블록당 누적 연산",
    tendency: "WASM 우위 중간",
    level: "mid",
  },
  {
    label: "그레이스케일 · 반전 · 세피아 · 밝기",
    cost: "픽셀당 산술 2~4회 · 1패스 O(N)",
    tendency: "격차 작음 (메모리 대역폭 지배)",
    level: "low",
  },
  {
    label: "엣지 감지 (Sobel)",
    cost: "3×3 고정 커널 · 2패스 · 루프가 단순",
    tendency: "격차 작거나 역전",
    level: "low",
  },
];

function TechNotes({ t }: { t: TokensColor }) {
  const levelColor: Record<string, string> = {
    high: t.accentGreen,
    mid: t.accentBlue,
    low: t.accentOrange,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[16]}px`,
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
          기술 노트
        </Typography>
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            color: t.textSecondary,
            mt: "4px",
          }}
        >
          이 벤치마크가 무엇을 측정하고 무엇을 측정하지 않는지, 그리고 구현에서
          선택한 근사와 그 한계를 정리했습니다.
        </Typography>
      </Box>

      {/* 노트 1 — 측정 방법 */}
      <NoteCard title="1. 무엇을 측정하고, 무엇을 측정하지 않는가" t={t}>
        <NoteSubtitle text="측정 범위" color={t.accentBlue} t={t} />
        <NoteList
          t={t}
          items={[
            "두 엔진 모두 각자의 전용 Web Worker에서 실행합니다. 메인 스레드의 렌더링·레이아웃 비용이 계측에 섞이지 않습니다.",
            "`performance.now()`로 필터 연산 구간만 계측합니다. WASM 쪽은 픽셀을 linear memory로 복사하는 구간과 결과를 꺼내는 `slice()` 구간이 모두 계측 밖에 있어, 순수 커널 실행 시간만 남습니다.",
            "기본 이미지는 4000×3000 = 1,200만 픽셀, RGBA 48MB입니다. 워커로 넘길 때 ArrayBuffer를 transfer해 복사 비용 없이 소유권만 이전합니다.",
          ]}
        />

        <NoteSubtitle
          text="측정에서 빠진 것 — 숫자를 읽을 때 감안할 점"
          color={t.accentOrange}
          t={t}
        />
        <NoteList
          t={t}
          items={[
            "WASM 워커는 초기화 시 `warmup()`으로 48MB 버퍼와 gray 스크래치 버퍼를 미리 확보하고 모든 필터를 한 번씩 실행합니다. cold start와 `memory.grow`를 페이지 진입 시점으로 옮겨 둔 것입니다. JS 쪽에는 대응하는 워밍업이 없어 첫 실행에는 V8 티어업 비용이 포함됩니다. 같은 필터를 두세 번 실행한 뒤의 값을 비교하는 편이 정확합니다.",
            "WASM 필터는 전부 in-place로 정적 버퍼를 재사용하지만, JS 필터는 함수 안에서 결과 배열을 매번 새로 할당합니다. 즉 48MB 할당 비용이 JS 계측 구간 안에 들어 있습니다. 격차의 일부는 연산 속도가 아니라 할당 회피에서 나옵니다.",
            "단일 실행값이며 N회 중앙값이 아닙니다. GC 타이밍이나 다른 탭의 부하에 따라 편차가 생깁니다.",
          ]}
        />
      </NoteCard>

      {/* 노트 2 — 필터별 우위 */}
      <NoteCard title="2. 필터별로 WASM 우위가 갈리는 이유" t={t}>
        <Typography
          sx={{
            fontSize: tokens.fontSize.base,
            color: t.textSecondary,
            lineHeight: 1.8,
          }}
        >
          모든 필터가 같은 비율로 빨라지지 않습니다. 갈리는 기준은 언어가 아니라
          <strong> 픽셀당 연산량</strong>입니다. 픽셀당 산술이 몇 번뿐이면
          병목이 연산이 아니라 48MB를 훑는 메모리 대역폭으로 옮겨가고, 이때는
          어떤 언어로 써도 비슷한 시간이 나옵니다.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: `${tokens.spacing[8]}px`,
          }}
        >
          {FILTER_NOTES.map((f) => (
            <Box
              key={f.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.spacing[12]}px`,
                flexWrap: "wrap",
                bgcolor: t.bgSurface,
                border: `1px solid ${t.borderLight}`,
                borderRadius: `${tokens.radius.sm}px`,
                px: `${tokens.spacing[12]}px`,
                py: `${tokens.spacing[10]}px`,
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 600,
                  color: t.textPrimary,
                  minWidth: 200,
                }}
              >
                {f.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.sm,
                  color: t.textSecondary,
                  flex: 1,
                  minWidth: 220,
                }}
              >
                {f.cost}
              </Typography>
              <Box
                sx={{
                  bgcolor: `${levelColor[f.level]}18`,
                  borderRadius: `${tokens.radius.xs}px`,
                  px: "8px",
                  py: "3px",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.xs,
                    fontWeight: 700,
                    color: levelColor[f.level],
                  }}
                >
                  {f.tendency}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Callout
          text="WASM은 'JavaScript보다 빠른 언어'가 아니라, 픽셀당 연산량이 큰 커널에서만 이득이 나는 도구입니다. 도입 판단은 취향이 아니라 이 측정으로 해야 합니다."
          color={t.accentBlue}
          t={t}
        />
      </NoteCard>

      {/* 노트 3 — 맨해튼 거리 */}
      <NoteCard title="3. 엣지 감지에서 sqrt 대신 맨해튼 거리를 쓴 이유" t={t}>
        <Typography
          sx={{
            fontSize: tokens.fontSize.base,
            color: t.textSecondary,
            lineHeight: 1.8,
          }}
        >
          Sobel 그래디언트 크기의 교과서 정의는 유클리드 거리(L2)입니다. 이
          구현은 두 엔진 모두 맨해튼 거리(L1) 근사를 사용합니다.
        </Typography>

        <Formula
          t={t}
          lines={[
            "// 교과서 정의 (L2)",
            "mag = sqrt(Gx * Gx + Gy * Gy)",
            "",
            "// 이 구현 (L1 근사) — JS · Rust 동일",
            "mag = min(255, |Gx| + |Gy|)",
          ]}
        />

        <NoteSubtitle text="선택한 이유" color={t.accentGreen} t={t} />
        <NoteList
          t={t}
          items={[
            "정수 파이프라인이 끊기지 않습니다. gray 버퍼는 `Int32Array` / `Vec<i32>`이고 Gx·Gy도 i32입니다. sqrt를 쓰면 픽셀마다 i32 → 부동소수 → sqrt → i32 왕복 변환이 생깁니다. sqrt 자체는 V8과 WASM 모두 하드웨어 명령 하나로 내려가므로, 실제 비용은 sqrt가 아니라 1,200만 번의 형변환 왕복입니다.",
            "벤치마크가 공정해집니다. 두 구현이 완전히 같은 수식을 쓰기 때문에, 측정된 차이가 `Math.sqrt`와 WASM `f64.sqrt`의 코드젠 차이가 아니라 루프 구조와 메모리 접근 패턴의 차이로 좁혀집니다. 비교하려는 대상만 남기는 것이 목적이었습니다.",
            "출력 품질 손실이 작습니다. L1은 항상 L2 이상이고 최대 √2배(약 41%)까지 커집니다. 오차가 0인 곳은 순수 수평·수직 엣지, 최대인 곳은 45° 대각 엣지입니다. 결과값은 255로 clamp되어 화면 휘도로만 쓰이므로 강한 엣지는 어느 쪽이든 포화되고, 실제로 보이는 차이는 대각선 윤곽이 조금 더 밝게 나오는 정도입니다.",
          ]}
        />

        <NoteSubtitle
          text="이 근사를 쓰면 안 되는 경우"
          color={t.accentRed}
          t={t}
        />
        <Typography
          sx={{
            fontSize: tokens.fontSize.base,
            color: t.textSecondary,
            lineHeight: 1.8,
          }}
        >
          그래디언트 크기를 화면에 그리는 것이 아니라 후속 연산의 입력으로 쓸
          때는 L2로 돌려야 합니다. Canny의 non-maximum suppression, 임계값 기반
          엣지 판정, 그래디언트 방향과 함께 쓰는 특징점 추출처럼 값의 절대 크기가
          판단 기준이 되는 경우, 엣지 방향에 따라 최대 41%까지 편향되는 값은
          결과를 왜곡합니다. 여기서는 최종 출력이 시각화라는 점이 확실했기 때문에
          근사를 선택했습니다.
        </Typography>
      </NoteCard>
    </Box>
  );
}

function NoteCard({
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
        bgcolor: t.bgPrimary,
        border: `1.5px solid ${t.borderDefault}`,
        borderRadius: `${tokens.radius.lg}px`,
        p: `${tokens.spacing[32]}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[16]}px`,
      }}
    >
      <Typography
        component="h3"
        sx={{
          fontSize: tokens.fontSize.lg,
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

function NoteSubtitle({
  text,
  color,
  t,
}: {
  text: string;
  color: string;
  t: TokensColor;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${tokens.spacing[8]}px`,
      }}
    >
      <Box sx={{ width: 3, height: 14, bgcolor: color, borderRadius: 2 }} />
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          fontWeight: 700,
          color: t.textPrimary,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

/** 백틱으로 감싼 구간을 인라인 코드로 렌더링 */
function renderInlineCode(text: string, t: TokensColor) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <Box
        key={i}
        component="code"
        sx={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: tokens.fontSize.sm,
          bgcolor: t.bgSurface,
          border: `1px solid ${t.borderLight}`,
          borderRadius: `${tokens.radius.xs}px`,
          px: "5px",
          py: "1px",
          color: t.textPrimary,
        }}
      >
        {part.slice(1, -1)}
      </Box>
    ) : (
      part
    ),
  );
}

function NoteList({ items, t }: { items: string[]; t: TokensColor }) {
  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        pl: `${tokens.spacing[20]}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[10]}px`,
      }}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item}
          sx={{
            fontSize: tokens.fontSize.base,
            color: t.textSecondary,
            lineHeight: 1.8,
            "&::marker": { color: t.textTertiary },
          }}
        >
          {renderInlineCode(item, t)}
        </Box>
      ))}
    </Box>
  );
}

function Formula({ lines, t }: { lines: string[]; t: TokensColor }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        bgcolor: t.bgSurface,
        border: `1px solid ${t.borderDefault}`,
        borderRadius: `${tokens.radius.sm}px`,
        p: `${tokens.spacing[16]}px`,
        overflowX: "auto",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: tokens.fontSize.sm,
        lineHeight: 1.9,
      }}
    >
      {lines.map((line, i) => (
        <Box
          key={i}
          component="span"
          sx={{
            display: "block",
            color: line.startsWith("//") ? t.textTertiary : t.textPrimary,
            minHeight: line === "" ? "0.9em" : undefined,
          }}
        >
          {line}
        </Box>
      ))}
    </Box>
  );
}

function Callout({
  text,
  color,
  t,
}: {
  text: string;
  color: string;
  t: TokensColor;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: `${tokens.spacing[10]}px`,
        bgcolor: `${color}14`,
        borderLeft: `3px solid ${color}`,
        borderRadius: `${tokens.radius.sm}px`,
        px: `${tokens.spacing[16]}px`,
        py: `${tokens.spacing[12]}px`,
      }}
    >
      <Typography
        sx={{
          fontSize: tokens.fontSize.base,
          color: t.textPrimary,
          lineHeight: 1.8,
          fontWeight: 500,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
