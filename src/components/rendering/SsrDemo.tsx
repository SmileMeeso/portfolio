import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useRenderingStore } from "../../store/useRenderingStore";

interface ServerData {
  generatedAt: string;
  viewCount: number;
  requestId: string;
}

function fetchFromServer(): Promise<ServerData> {
  // 네트워크 지연 시뮬레이션 (SSR에서 서버가 DB 조회하는 시간)
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          generatedAt: new Date().toLocaleString("ko-KR", { hour12: false }),
          viewCount: Math.floor(Math.random() * 50000) + 10000,
          requestId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        }),
      600 + Math.random() * 400, // 600~1000ms 지연
    ),
  );
}

export default function SsrDemo() {
  const navigate = useNavigate();
  const [data, setData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const saveMetrics = useRenderingStore((s) => s.saveMetrics);
  const isMountFetch = useRef(true);

  // 응답을 화면 상태로 반영하는 부분만 분리한다.
  // effect 는 이 함수를 .then 콜백에서만 호출하므로 동기 setState 가 없다.
  const applyResult = useCallback(
    (result: ServerData, initialResponse: number) => {
      setData(result);
      setLoading(false);
      setRequestCount((n) => n + 1);
      // 마운트 시 첫 요청만 저장 (페이지 진입 기준 초기 응답)
      if (isMountFetch.current) {
        isMountFetch.current = false;
        saveMetrics("ssr", {
          buildTime: 0, // SSR은 빌드 단계 없음
          initialResponse,
          measuredAt: new Date().toLocaleString("ko-KR", { hour12: false }),
        });
      }
    },
    [saveMetrics],
  );

  // 페이지 마운트(= 요청) 시마다 새로 fetch ➞ SSR 시뮬레이션
  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    void fetchFromServer().then((result) => {
      if (cancelled) return; // 응답 전에 페이지를 떠난 경우 상태를 건드리지 않는다
      applyResult(result, Math.round(performance.now() - t0));
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  // 수동 재요청 — 로딩 초기화는 이벤트 핸들러에서 처리
  const handleRefetch = () => {
    setLoading(true);
    setData(null);
    const t0 = performance.now();
    void fetchFromServer().then((result) =>
      applyResult(result, Math.round(performance.now() - t0)),
    );
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
        <Chip label="SSR" color="success" />
        <Typography variant="h5" fontWeight="bold">
          Server-Side Rendering 데모
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        페이지 데이터는 <strong>요청마다 서버에서 새로 생성</strong>됩니다. "새
        요청 시뮬레이션" 버튼을 누를 때마다 생성 시각, 조회수, Request ID가
        달라집니다.
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>시뮬레이션 방법</strong>: 마운트·버튼 클릭 시 600~1000ms 지연 후
        새 데이터를 생성합니다. 실제 SSR은 서버에서{" "}
        <code>getServerSideProps</code>가 매 요청마다 실행되어 최신 데이터로
        HTML을 생성합니다.
      </Alert>

      {/* 뉴스 카드 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, minHeight: 200 }}>
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={150}
            gap={2}
          >
            <CircularProgress color="success" />
            <Typography variant="body2" color="text.secondary">
              서버에서 HTML 생성 중...
            </Typography>
          </Box>
        ) : data ? (
          <>
            <Stack direction="row" spacing={1} mb={1}>
              <Chip label="기술" size="small" />
              <Chip
                label="실시간 데이터"
                size="small"
                variant="outlined"
                color="success"
              />
              <Chip
                label={`REQ: ${data.requestId}`}
                size="small"
                variant="outlined"
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
                  조회수 (요청 시점 DB 조회)
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {data.viewCount.toLocaleString()}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  서버 응답 생성 시각
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {data.generatedAt}
                </Typography>
              </Box>
            </Stack>
          </>
        ) : null}
      </Paper>

      {/* 새 요청 버튼 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="success"
            onClick={handleRefetch}
            disabled={loading}
          >
            새 요청 시뮬레이션
          </Button>
          <Typography variant="body2" color="text.secondary">
            {requestCount > 0 && `${requestCount}번째 요청 - 매번 다른 데이터`}
          </Typography>
        </Stack>
      </Paper>

      {/* 설명 */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #2e7d3222, #43a04722)",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          SSR 동작 원리
        </Typography>
        <Stack spacing={1}>
          {[
            "1. 브라우저가 서버에 HTTP 요청 전송",
            "2. 서버에서 getServerSideProps 실행 ➞ DB/API fetch",
            "3. 최신 데이터로 HTML 동적 생성 ➞ 클라이언트 전송",
            "4. 같은 URL이라도 요청 시점마다 다른 HTML 반환 가능",
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
          {`export async function getServerSideProps(context) {
  const data = await fetchLatestArticle()  // 매 요청마다 실행
  return { props: { data, requestId: context.req.headers['x-request-id'] } }
}

export default function Page({ data, requestId }) {
  return <Article data={data} requestId={requestId} />
}`}
        </Box>
      </Paper>
    </Container>
  );
}
