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
