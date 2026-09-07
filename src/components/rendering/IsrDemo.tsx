import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useRenderingStore } from "../../store/useRenderingStore";
import { tokens } from "../../theme/theme";

const REVALIDATE_SECONDS = 10;

type CacheStatus = "fresh" | "stale" | "revalidating";

interface CachedData {
  generatedAt: string;
  viewCount: number;
  version: number;
}

function generateData(version: number): CachedData {
  return {
    generatedAt: new Date().toLocaleString("ko-KR", { hour12: false }),
    viewCount: Math.floor(Math.random() * 50000) + 10000,
    version,
  };
}

const STATUS_LABEL: Record<CacheStatus, string> = {
  fresh: "캐시 신선 (FRESH)",
  stale: "캐시 만료 (STALE) - 다음 요청 시 백그라운드 갱신",
  revalidating: "백그라운드 재생성 중...",
};

const STATUS_COLOR: Record<CacheStatus, "success" | "warning" | "info"> = {
  fresh: "success",
  stale: "warning",
  revalidating: "info",
};

export default function IsrDemo() {
  const navigate = useNavigate();
  const [data, setData] = useState<CachedData | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>("fresh");
  const [secondsLeft, setSecondsLeft] = useState(REVALIDATE_SECONDS);
  const [requestCount, setRequestCount] = useState(0);
  const versionRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveMetrics = useRenderingStore((s) => s.saveMetrics);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(REVALIDATE_SECONDS);
    setCacheStatus("fresh");

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setCacheStatus("stale");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // 마운트 시 최초 데이터 생성 (= 빌드 시점 또는 첫 재검증)
  useEffect(() => {
    const t0 = performance.now();
    const initial = generateData(versionRef.current);
    const initialResponse = Math.round(performance.now() - t0);
    setData(initial);
    startTimer();
    saveMetrics("isr", {
      buildTime: 1100, // 시뮬레이션: 일부 페이지만 사전 생성
      initialResponse, // 캐시 히트 ≈ 0ms
      measuredAt: new Date().toLocaleString("ko-KR", { hour12: false }),
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // saveMetrics 는 zustand 셀렉터로 참조가 안정적이므로 마운트 1회 실행이 유지된다
  }, [saveMetrics]);

  // "페이지 방문" 시뮬레이션 - stale이면 백그라운드 재검증 트리거
  const simulateRequest = () => {
    setRequestCount((n) => n + 1);
    if (cacheStatus === "stale") {
      // stale-while-revalidate: 먼저 캐시된 데이터 반환하고 백그라운드에서 갱신
      setCacheStatus("revalidating");
      setTimeout(() => {
        versionRef.current += 1;
        setData(generateData(versionRef.current));
        startTimer();
      }, 800); // 백그라운드 재생성 시뮬레이션
    }
    // fresh/revalidating이면 그냥 캐시 반환 (즉시)
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="text"
        onClick={() => navigate({ to: "/rendering" })}
        sx={{ mb: 2 }}
      >
        ← 비교 페이지로
      </Button>

      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Chip
          label="ISR"
          sx={{ bgcolor: tokens.color.accentOrange, color: "#fff" }}
        />
        <Typography variant="h5" fontWeight="bold">
          Incremental Static Regeneration 데모
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        캐시된 데이터를 <strong>즉시 반환</strong>하고, 재검증 주기(
        {REVALIDATE_SECONDS}초)가 지나면{" "}
        <strong>다음 요청 시 백그라운드에서 갱신</strong>합니다.
        (stale-while-revalidate 패턴)
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>시뮬레이션 방법</strong>: {REVALIDATE_SECONDS}초 타이머로 캐시
        만료를 시뮬레이션합니다. "페이지 방문" 버튼이 STALE 상태일 때 클릭하면
        캐시를 즉시 반환하면서 백그라운드 재생성을 트리거합니다.
      </Alert>

      {/* 캐시 상태 표시 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            캐시 상태
          </Typography>
          <Chip
            label={STATUS_LABEL[cacheStatus]}
            color={STATUS_COLOR[cacheStatus]}
            size="small"
          />
        </Stack>
        {cacheStatus === "fresh" && (
          <>
            <LinearProgress
              variant="determinate"
              value={(secondsLeft / REVALIDATE_SECONDS) * 100}
              color="success"
              sx={{ borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              mt={0.5}
              display="block"
            >
              재검증까지 {secondsLeft}초 남음 (revalidate: {REVALIDATE_SECONDS})
            </Typography>
          </>
        )}
        {cacheStatus === "stale" && (
          <Typography variant="body2" color="warning.main">
            캐시가 만료되었습니다.{" "}
            <Box
              component="span"
              onClick={simulateRequest}
              sx={{
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
                "&:hover": { opacity: 0.75 },
              }}
            >
              페이지 방문 시뮬레이션
            </Box>
            을 눌러 재검증을 트리거하세요.
          </Typography>
        )}
        {cacheStatus === "revalidating" && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} color="info" />
            <Typography variant="body2" color="info.main">
              백그라운드에서 새 데이터 생성 중... (사용자는 이미 캐시 응답 받음)
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* 뉴스 카드 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {data ? (
          <>
            <Stack direction="row" spacing={1} mb={1}>
              <Chip label="기술" size="small" />
              <Chip
                label={`v${data.version} - ${cacheStatus === "fresh" ? "최신" : cacheStatus === "stale" ? "만료됨" : "갱신 중"}`}
                size="small"
                variant="outlined"
                color={STATUS_COLOR[cacheStatus]}
              />
            </Stack>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              TypeScript 5.8 릴리스 - 새로운 기능 살펴보기
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              작성자: 김개발 | 카테고리: 웹 개발
            </Typography>
            <Typography variant="body2" mb={2}>
              TypeScript 5.8에서는 조건부 반환 타입 추론 개선, 성능 향상, 새로운
              strictness 옵션 등 다양한 기능이 추가되었습니다.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  조회수
                </Typography>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {data.viewCount.toLocaleString()}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  캐시 생성 시각 (v{data.version})
                </Typography>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {data.generatedAt}
                </Typography>
              </Box>
            </Stack>
          </>
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={150}
          >
            <CircularProgress color="warning" />
          </Box>
        )}
      </Paper>

      {/* 방문 시뮬레이션 버튼 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="warning"
            onClick={simulateRequest}
            disabled={cacheStatus === "revalidating"}
          >
            페이지 방문 시뮬레이션
          </Button>
          <Typography variant="body2" color="text.secondary">
            {requestCount === 0
              ? "버튼을 눌러 요청을 시뮬레이션하세요."
              : cacheStatus === "stale"
                ? `${requestCount}번째 방문 - STALE! 캐시 반환 + 백그라운드 재생성`
                : `${requestCount}번째 방문 - 캐시 즉시 반환 ⚡`}
          </Typography>
        </Stack>
      </Paper>

      {/* 설명 */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #e65c0022, #f9d42322)",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          ISR 동작 원리 (stale-while-revalidate)
        </Typography>
        <Stack spacing={1}>
          {[
            "1. 빌드 시 일부 페이지 HTML 사전 생성 (SSG처럼)",
            "2. 요청 시 캐시된 HTML 즉시 반환 (빠른 응답)",
            "3. revalidate 시간이 지난 후 첫 요청: 캐시 반환 + 백그라운드 재생성 트리거",
            "4. 재생성 완료 후 새 요청부터 새 HTML 제공",
          ].map((s) => (
            <Typography key={s} variant="body2">
              {s}
            </Typography>
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          Next.js 코드 예시
        </Typography>
        <Box
          component="pre"
          sx={{
            mt: 1,
            p: 2,
            background: "rgba(0,0,0,0.06)",
            borderRadius: 1,
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {`export async function getStaticProps() {
  const data = await fetchArticle()
  return {
    props: { data },
    revalidate: ${REVALIDATE_SECONDS},  // 10초마다 백그라운드 재생성
  }
}

export default function Page({ data }) {
  return <Article data={data} />
}`}
        </Box>
      </Paper>
    </Container>
  );
}
