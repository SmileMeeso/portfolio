import { useEffect, useState } from "react";
import { useRenderingStore } from "../../store/useRenderingStore";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

// 모듈이 처음 로드(번들 파싱)된 시점 = "빌드 시점" 시뮬레이션
// 실제 SSG에서 빌드 타임에 getStaticProps가 실행되는 것과 동일한 개념
const BUILD_TIME = new Date().toLocaleString("ko-KR", { hour12: false });
const BUILD_VIEW_COUNT = 18_472;

export default function SsgDemo() {
  const navigate = useNavigate();
  const [refreshCount, setRefreshCount] = useState(0);
  const saveMetrics = useRenderingStore((s) => s.saveMetrics);

  useEffect(() => {
    // 정적 데이터는 상수이므로 초기 응답 ≈ 0ms (동기 접근)
    const t0 = performance.now();
    void BUILD_TIME; // 상수 참조 - 실제 SSG는 이 데이터가 HTML에 이미 포함됨
    const initialResponse = Math.round(performance.now() - t0);
    saveMetrics("ssg", {
      buildTime: 2800, // 시뮬레이션: 전체 페이지 사전 생성 비용
      initialResponse,
      measuredAt: new Date().toLocaleString("ko-KR", { hour12: false }),
    });
  }, [saveMetrics]);

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
        <Chip label="SSG" color="primary" />
        <Typography variant="h5" fontWeight="bold">
          Static Site Generation 데모
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        페이지 데이터는 <strong>빌드(모듈 로드) 시점</strong>에 한 번
        생성됩니다. 아무리 새로고침해도 생성 시각과 조회수가 변하지 않습니다.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>시뮬레이션 방법</strong>: 모듈 최초 import 시점에 상수로 고정된
        값을 사용합니다. 실제 Next.js SSG는 빌드 타임에{" "}
        <code>getStaticProps</code>를 실행하여 HTML에 데이터를 직접 삽입합니다.
      </Alert>

      {/* 뉴스 카드 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} mb={1}>
          <Chip label="기술" size="small" />
          <Chip
            label="정적 콘텐츠"
            size="small"
            variant="outlined"
            color="primary"
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
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {BUILD_VIEW_COUNT.toLocaleString()}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              빌드(데이터 생성) 시각
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {BUILD_TIME}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* 새로고침 버튼 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setRefreshCount((n) => n + 1)}
          >
            새로고침 시뮬레이션 ({refreshCount}회)
          </Button>
          <Typography variant="body2" color="text.secondary">
            {refreshCount === 0
              ? "버튼을 눌러보세요 - 데이터가 변하지 않습니다."
              : `${refreshCount}번 눌렀지만 빌드 시각과 조회수는 그대로입니다. `}
          </Typography>
        </Stack>
      </Paper>

      {/* 설명 */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1976d222, #42a5f522)",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          SSG 동작 원리
        </Typography>
        <Stack spacing={1}>
          {[
            "1. 빌드 시 getStaticProps 실행 ➞ DB/API에서 데이터 fetch",
            "2. 데이터가 포함된 HTML 파일 생성 ➞ CDN에 배포",
            "3. 사용자 요청 시 CDN이 즉시 HTML 반환 (서버 처리 없음)",
            "4. 콘텐츠 변경 시 재빌드 + 재배포 필요",
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
  const data = await fetchArticle()   // 빌드 타임에만 실행
  return { props: { data } }
}

export default function Page({ data }) {
  return <Article data={data} />     // data는 빌드 시점에 고정
}`}
        </Box>
      </Paper>
    </Container>
  );
}
