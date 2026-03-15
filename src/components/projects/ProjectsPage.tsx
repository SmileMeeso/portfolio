import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Modal } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../../theme/theme";
import type { TokensColor } from "../../theme/theme";

interface Screenshot {
  src: string;
  caption: string;
}

interface Project {
  period: string;
  title: string;
  description: string;
  contributions: string[];
  techStack: string[];
  screenshots?: Screenshot[];
}

interface Company {
  period: string;
  name: string;
  department?: string;
  type: "정규직" | "프리랜서" | "스타트업" | "파견직" | "개인";
  projects: Project[];
}

const companies: Company[] = [
  {
    period: "2025.10 ~ 재직중",
    name: "omelet",
    department: "개발팀",
    type: "정규직",
    projects: [
      {
        period: "2025.10 ~ 현재",
        title: "물류 최적화 서비스 개발",
        description:
          "다양한 파라미터를 등록하고, 파라미터를 이용해 가장 효율적인 루트를 찾아 고객에게 보여주는 물류 최적화 시스템. Storybook으로 기존 컴포넌트 정리 및 디자인 시스템 적용, 테스트 자동화로 QA 시간을 대폭 단축했습니다.",
        contributions: [
          "React + Next.js + TypeScript 기반 물류 최적화 UI 개발",
          "Storybook으로 기존 정리되지 않은 컴포넌트들을 정리하고 디자인 시스템 적용",
          "테스트 자동화 적극 활용 - 테스트에 걸리는 시간 대폭 감소",
          "위치 기반 서비스 개발 (경로 시각화)",
          "풀필먼트 서비스가 필요한 다양한 회사들과 컨택하고 서비스 납품",
        ],
        techStack: ["React", "Next.js", "TypeScript", "Storybook"],
        screenshots: [
          {
            src: "/images/projects/omelet_tms.png",
            caption:
              "물류 최적화 서비스 - 경로 시각화 및 파라미터 기반 최적 루트 탐색 화면",
          },
          {
            src: "/images/projects/omelet_storybook.png",
            caption: "Storybook으로 기존 컴포넌트 정리 및 디자인 시스템 적용",
          },
          {
            src: "/images/projects/omelet_unit_test.png",
            caption: "유닛 테스트 자동화 - QA 시간 대폭 단축",
          },
          {
            src: "/images/projects/omelet_e2e_test.png",
            caption: "E2E 테스트 자동화 - 주요 사용자 플로우 전체 커버",
          },
        ],
      },
    ],
  },
  {
    period: "2025.01 ~ 2025.03",
    name: "나눔사",
    type: "개인",
    projects: [
      {
        period: "2025.01 ~ 2025.03",
        title: "위치 기반 무료 나눔 플랫폼",
        description:
          "위치 기반 중고 물품 무료 나눔 플랫폼. Leaflet 지도와 리스트를 연동해 주변 나눔 게시글을 탐색하고, Firebase Auth로 구글·애플·카카오 소셜 로그인을 지원합니다. Docker + k8s + GitHub Actions + ArgoCD로 전체 CI/CD 파이프라인을 개인이 직접 구성했습니다.",
        contributions: [
          "Next.js + Recoil + Styled-components로 프론트엔드 개발",
          "Leaflet.js로 지도 기반 나눔 게시글 탐색 (지도 뷰 ↔ 리스트 뷰 연동)",
          "도로명 주소 API 연동 - 주소 검색으로 나눔 장소 지도 자동 이동",
          "Firebase Auth - 구글·애플·카카오 소셜 로그인 연동",
          "Socket.io - 이메일 인증 완료 시 사용자 조작 없이 인증 상태 자동 갱신",
          "FastAPI + PostgreSQL + SQLAlchemy로 위치 데이터 처리, AWS Secret Manager로 비밀 키 관리",
          "Docker 컨테이너화 ➞ k8s 배포·스케일링, GitHub Actions CI + ArgoCD CD 파이프라인 구성",
          "feature/dev/main 브랜치 전략으로 Docker image 태그 버전 관리, Kustomize로 k8s deployment 자동 반영",
          "iOS(Swift) / Android(Java) WebApp 개발 후 스토어 업로드",
        ],
        techStack: [
          "Next.js",
          "TypeScript",
          "Recoil",
          "Leaflet.js",
          "Firebase Auth",
          "Socket.io",
          "FastAPI",
          "PostgreSQL",
          "Docker",
          "Kubernetes",
          "GitHub Actions",
          "ArgoCD",
        ],
        screenshots: [
          {
            src: "/images/projects/nanumsa_detail.png",
            caption: "세부 정보 화면",
          },
          {
            src: "/images/projects/nanumsa_map_list.png",
            caption: "지도와 검색 가능한 리스트 화면",
          },
          { src: "/images/projects/nanumsa_login.png", caption: "로그인 화면" },
          {
            src: "/images/projects/nanumsa_address.png",
            caption: "주소 검색 화면",
          },
          {
            src: "/images/projects/nanumsa_ios_main.png",
            caption: "iOS 메인화면",
          },
          {
            src: "/images/projects/nanumsa_ios_detail.png",
            caption: "iOS 세부화면",
          },
          {
            src: "/images/projects/nanumsa_cicd.png",
            caption:
              "feature/dev/main 브랜치 따라 버전이 다르게 올라가게 함 - Docker image 태그 + Kustomize로 k8s deployment 자동 반영",
          },
          {
            src: "/images/projects/nanumsa_k8s.png",
            caption: "k8s로 컨테이너를 관리함",
          },
          {
            src: "/images/projects/nanumsa_argocd.png",
            caption:
              "GitHub Actions이 완료되어 deployment가 변경되고 도커의 새 버전이 생기면 ArgoCD에서 sync가 가능하다",
          },
        ],
      },
    ],
  },
  {
    period: "2025.08 ~ 2025.09",
    name: "SK AX",
    type: "프리랜서",
    projects: [
      {
        period: "2025.08 ~ 2025.09",
        title: "내부 교육 플랫폼 디자인 시스템 개발",
        description:
          "SK 구성원들이 교육을 받고 자신의 스킬을 확인할 수 있는 서비스. 모노레포 환경에서 Next.js ➞ React 전환 작업을 담당하고, Storybook 기반 디자인 시스템을 구축했습니다.",
        contributions: [
          "모노레포 환경에서 Next.js ➞ React 전환 작업",
          "Storybook 기반 디자인 시스템 개발 및 공통 컴포넌트 구축",
          "Tailwind + SCSS 스타일링 시스템 적용",
        ],
        techStack: ["React", "TypeScript", "SCSS", "Tailwind", "Storybook"],
      },
    ],
  },
  {
    period: "2025.05 ~ 2025.06",
    name: "SK 하이닉스",
    type: "프리랜서",
    projects: [
      {
        period: "2025.05 ~ 2025.06",
        title: "사내 디자인 시스템 개발",
        description:
          "SK 그룹사 사내 공통으로 사용할 디자인 시스템 개발. 유닛 테스트 포함 공통 컴포넌트를 개발하여 SK 그룹 사내 곳곳에서 사용 중입니다.",
        contributions: [
          "TypeScript + Storybook 기반 디자인 시스템 설계 및 개발",
          "공통 컴포넌트 개발 및 디자인 시스템 유닛 테스트 작성",
          "SK 그룹사 사내 전체 적용",
        ],
        techStack: ["TypeScript", "Storybook"],
      },
    ],
  },
  {
    period: "2022.07 ~ 2024.10",
    name: "(주)위대한상상",
    department: "R&D Center · Data Service팀",
    type: "정규직",
    projects: [
      {
        period: "2024.01 ~ 2024.10",
        title: "YoDa - 요기요 데이터 분석 포털",
        description:
          "요기요 임직원을 위한 데이터 분석 포털. 전국 가맹점을 지도 + 마커 클러스터링으로 탐색하고, 가맹점별 매출·주문·배달 통계를 차트로 제공합니다. 유저가 스스로 커스텀 가능한 대시보드가 특히 영업팀에서 호평을 받았습니다.",
        contributions: [
          "Next.js + TypeScript + Webpack + MUI5 환경 구축, FE 전체 담당",
          "Storybook 도입 및 GitHub Actions CI / ArgoCD CD 파이프라인 구성",
          "Drag & Drop 커스텀 대시보드 컴포넌트 개발",
          "Chart.js로 막대·선·파이 차트 구성, 통계 데이터 가공",
          "Leaflet.js 지도 기반 화면 설계 - 폴리곤·멀티폴리곤 최적화 및 마커 클러스터링으로 렌더링 부하 제거",
          "Excel / CSV / PDF 데이터 내보내기 기능 개발",
        ],
        techStack: [
          "Next.js",
          "TypeScript",
          "Webpack",
          "MUI5",
          "Chart.js",
          "Leaflet.js",
          "Storybook",
          "GitHub Actions",
          "ArgoCD",
        ],
        screenshots: [
          {
            src: "/images/projects/yoda_map.png",
            caption: "지도 기반 검색 및 클러스터링 제공",
          },
          {
            src: "/images/projects/yoda_chart.png",
            caption: "다양한 통계를 차트로 제공",
          },
        ],
      },
      {
        period: "2022.07 ~ 2023.12",
        title: "I.Log.Yo - 요기요 사용자 행동 로그 통합 관리",
        description:
          "요기요 서비스 전체 로그를 수집·정의·통계화하는 내부 플랫폼. 어떤 로그를 개발하면 되고, 누가 개발 중인지, 상태는 어떤지, 스펙은 어떤지를 통합 관리합니다. 편의 기능(JSON 파서 등)이 특히 개발자들에게 호평을 받았습니다.",
        contributions: [
          "Next.js + TypeScript + Webpack + MUI5 환경 구축, FE 전체 담당",
          "Storybook 최초 도입 및 GitHub Actions CI / ArgoCD CD 파이프라인 구성",
          "캡쳐 화면 위에 아이콘·주석을 추가하고 Drag & Drop 가능한 컴포넌트 개발",
          "Echarts로 막대·선·원형 차트 구성, 통계 데이터 가공 처리",
          "서비스 / 디바이스 / 스테이터스 / 타이틀 다중 필터 검색 + 키워드 검색 개발",
          "이미지 DnD 업로드, Copy&Paste 업로드 기능 - 반응형에서도 위치 고정 구현",
          "JSON 파서 등 로그 작성 편의 기능 개발, 로그 변경 히스토리 추적 화면 개발",
        ],
        techStack: [
          "Next.js",
          "TypeScript",
          "Webpack",
          "MUI5",
          "Echarts",
          "Storybook",
          "GitHub Actions",
          "ArgoCD",
        ],
        screenshots: [
          {
            src: "/images/projects/ilogyo_stats.png",
            caption: "다양한 로그의 상태를 통계로 제공하여 품질관리",
          },
          {
            src: "/images/projects/ilogyo_filter.png",
            caption: "필터 검색 / 키워드 검색 기능 제공",
          },
          {
            src: "/images/projects/ilogyo_detail.png",
            caption: "다양한 로그의 세부적인 정의 상태를 볼 수 있도록 함",
          },
        ],
      },
    ],
  },
  {
    period: "2021.04 ~ 2022.06",
    name: "웅진씽크빅",
    department: "IT 개발실",
    type: "프리랜서",
    projects: [
      {
        period: "2021.04 ~ 2022.06",
        title: "스마트올 중학 - AI 학습 플랫폼",
        description:
          "웅진씽크빅의 AI 학습 플랫폼 중학 버전. AI 문법 실력 진단, HLS 동영상 재생, RTSP 생중계(328명 동시 시청), 애플 펜슬 필기 기능을 제공합니다. 아이패드 버전은 런칭 후 완판될 정도로 성공적이었습니다.",
        contributions: [
          "React.js SPA 유지보수 및 업그레이드, TypeScript 전환 작업 담당",
          "기존 네이티브 액티비티 의존성 전부 제거 - 웹뷰 독립 구조로 리팩터링",
          "Video.js + node.js로 HLS 동영상 재생 및 RTSP 생중계(328명 동시 시청) 구현",
          "크롬 DevTools로 패키지 오류 메모리 누수 분석 ➞ 리스너 안정화 최적화",
          "코드 스플리팅으로 초기 로딩 속도 개선 - 이용자 만족도 향상",
          "Redux + ReduxSAGA + ContextAPI 전역 상태관리 설계, Redux-persist로 웹뷰 간 인증 공유",
          "iOS / Android / Flutter WebApp 세 플랫폼 대응",
        ],
        techStack: [
          "React.js",
          "TypeScript",
          "Webpack",
          "Video.js",
          "Redux",
          "ReduxSAGA",
          "ContextAPI",
          "Redux-persist",
          "Node.js",
          "HLS",
          "RTSP",
          "WebSocket",
        ],
        screenshots: [
          {
            src: "/images/projects/smartol_ai.png",
            caption: "AI 분석결과를 화면에 그래프와 함께 나타냄",
          },
          {
            src: "/images/projects/smartol_rtsp.png",
            caption: "RTSP로 화면을 여러 사람에게 생중계 함",
          },
          {
            src: "/images/projects/smartol_pencil.png",
            caption: "애플 펜슬을 이용해 필기가 가능하도록 함",
          },
          {
            src: "/images/projects/smartol_main.png",
            caption: "기본적인 서비스 화면",
          },
          {
            src: "/images/projects/smartol_memory_before.png",
            caption:
              "Before - 크롬 DevTools 성능 분석 중 패키지 오류로 인한 메모리 누수 감지",
          },
          {
            src: "/images/projects/smartol_memory_after.png",
            caption:
              "After - 이벤트 리스너 정리 및 누수 원인 제거 후 메모리 안정화 확인",
          },
        ],
      },
      {
        period: "2022.01 ~ 2022.02",
        title: "스마트올 초등 - 이벤트 페이지 개발",
        description:
          "스마트올 초등 서비스의 이벤트 페이지 개발. three.js로 귀여운 캐릭터들을 사양이 좋지 않은 패드 기기에서도 좋은 성능으로 구현했습니다.",
        contributions: [
          "three.js를 사용하여 캐릭터 3D 렌더링 - 저사양 패드에서도 좋은 성능 유지",
          "React.js + TypeScript + Webpack 환경에서 개발",
        ],
        techStack: ["React.js", "TypeScript", "Webpack", "three.js"],
      },
    ],
  },
  {
    period: "2021.01 ~ 2021.03",
    name: "해피브릿지",
    department: "개발팀",
    type: "스타트업",
    projects: [
      {
        period: "2021.02 ~ 2021.03",
        title: "유사투자자문업 관리 서비스",
        description:
          "회원 관리, 문자 발송(KT 크로샷 연동) 등의 기능을 갖춘 투자자문업 관리 플랫폼. React + MaterialUI + Laravel8로 FE/BE 전체를 개발했습니다.",
        contributions: [
          "React.js + MaterialUI로 화면 개발 (회원 관리, 통계 차트)",
          "Chart.js로 유저 통계 시각화",
          "Laravel8 + PHP7 + MySQL로 REST API 및 AWS EC2 환경 구성",
          "KT 크로샷 서비스 연동으로 문자 전송 기능 구현",
        ],
        techStack: [
          "React.js",
          "MaterialUI",
          "Chart.js",
          "Laravel8",
          "PHP7",
          "MySQL",
          "AWS EC2",
        ],
      },
      {
        period: "2021.02 ~ 2021.02",
        title: "유치원 일정관리 서비스",
        description:
          "유치원 선생님이 아이의 기기 NFC 태그로 구매 기능을 제공하고, 공지사항을 음성(STT)으로 남길 수 있는 서비스. FE/BE/iOS/Android 전체를 담당했습니다.",
        contributions: [
          "React.js + Bootstrap으로 모바일 기반 FE 개발",
          "D3.js로 NFC 사용량 시계열 차트 구현",
          "WebRTC 음성 녹음 기능 구현",
          "Laravel8 + GCP TTS / NCP TTS 연동, AWS EC2 + ELB + Route53 환경 구성",
          "Android NFC 태그 연동 로그인, iOS/Android WebView 앱 개발",
        ],
        techStack: [
          "React.js",
          "Bootstrap",
          "D3.js",
          "WebRTC",
          "Laravel8",
          "PHP7",
          "MySQL",
          "AWS",
          "Android",
          "iOS",
        ],
      },
    ],
  },
  {
    period: "2018.05 ~ 2020.12",
    name: "커넥트닷",
    department: "개발팀",
    type: "스타트업",
    projects: [
      {
        period: "2020.01 ~ 2020.12",
        title: "반려동물 건강관리 서비스",
        description:
          "반려동물의 건강 수치를 기록하고, 시계열 차트로 확인하거나 일기 형식으로 볼 수 있는 앱. Firebase 소셜 로그인, In-App Purchase, 광고 연동 포함. iOS/Android 스토어 업로드 성공.",
        contributions: [
          "React.js + PHP로 FE/BE 개발 전담",
          "Highcharts.js로 건강검사 수치 시계열 차트 구현",
          "Firebase 소셜 로그인 + FCM 푸시 메시지 연동",
          "Android/iOS 각각 In-App Purchase 개발, Admob/Adfit 광고 연동",
          "AWS Lightsail(Ubuntu) 서버 운영",
        ],
        techStack: [
          "React.js",
          "PHP",
          "MySQL",
          "Highcharts.js",
          "Firebase",
          "AWS Lightsail",
          "Android(Java)",
          "iOS(Swift)",
        ],
      },
      {
        period: "2019.10 ~ 2019.12",
        title: "유방암 관리 어플리케이션",
        description:
          "유방암 관련 투약 기록과 차트 확인, 투약 알림을 제공하는 앱. 병원 의사의 의뢰로 시작된 프로젝트로 내부적으로 잘 활용 중. FE/BE/Android 전체 담당.",
        contributions: [
          "React.js SPA + PHP7 REST API 개발",
          "Android broadcasting receiver + alarm manager 활용 투약 알림 구현",
          "쿠키 매니저를 활용한 웹과 앱 자동 로그인 연동",
        ],
        techStack: ["React.js", "PHP7", "Android(Java)"],
      },
      {
        period: "2018.12 ~ 2019.02",
        title: "부동산 기계학습 및 통계 툴",
        description:
          "다양한 파라미터를 입력하면 기계학습을 실행하고 결과를 차트로 시각화하는 툴. 이 서비스로 구글 스타트업 지원 사업에 당선됐습니다.",
        contributions: [
          "Vanilla JS + HistoryAPI로 SPA 구성",
          "Highcharts.js로 기계학습 결과 차트 시각화",
          "기계학습 모델 파라미터 구성 화면 개발, 세션이 끊겨도 결과를 볼 수 있도록 처리",
        ],
        techStack: ["Vanilla JS", "jQuery", "Highcharts.js"],
      },
      {
        period: "2018.05 ~ 2019.10",
        title: "부동산 빅데이터 분석 서비스",
        description:
          "네이버 부동산·호갱노노와 유사한 부동산 빅데이터 서비스. 네이버 지도 위에 아파트·연립·오피스텔 데이터를 조건 필터링으로 표시하고, 기계학습 가격 예측 결과를 차트로 제공합니다. iOS/Android WebApp 포함.",
        contributions: [
          "Vanilla JS + HistoryAPI로 SPA 구성, jQuery + Webpack + Babel로 크로스 브라우징 대응",
          "NaverMaps API로 지도에 마커 표시, Highcharts.js로 막대·선 차트 시각화",
          "조건 검색 필터 UI (아파트/연립/오피스텔/가격대/거래기간/지하철 등) 개발",
          "PostGIS 좌표 기반 인덱싱 및 지역별 클러스터링, PHP API 서버로 복합 필터 검색 구현",
          "Iamport 결제 연동, 로그인·추천·게시판·인증 구현",
          "Selenium + Python 스크래핑 배치 (경매·신규 분양), node.js APN 서버 구축",
          "iOS(Swift) / Android(Java) WebApp 개발, 스토어 업로드",
        ],
        techStack: [
          "Vanilla JS",
          "jQuery",
          "Webpack",
          "Babel",
          "NaverMaps API",
          "Highcharts.js",
          "PHP",
          "Python",
          "PostgreSQL",
          "PostGIS",
          "Selenium",
          "Node.js",
          "iOS(Swift)",
          "Android(Java)",
        ],
        screenshots: [
          {
            src: "/images/projects/realtor_map.png",
            caption: "필터를 통해 지도에 원하는 데이터만 나타나게 함",
          },
          {
            src: "/images/projects/realtor_clustering1.png",
            caption:
              "마커 클러스터링 구현 - 수만 건의 매물 데이터를 줌 레벨에 따라 자동 군집화",
          },
          {
            src: "/images/projects/realtor_clustering2.png",
            caption: "클러스터 클릭 시 해당 영역 매물 목록 표시 및 상세 진입",
          },
        ],
      },
    ],
  },
  {
    period: "2017.06 ~ 2018.05",
    name: "SK 플래닛",
    department: "11번가 로그 TF",
    type: "파견직",
    projects: [
      {
        period: "2017.06 ~ 2018.05",
        title: "11번가 사용자 행동 로그 수집 시스템",
        description:
          "11번가 서비스의 사용자 행동 로그를 수집·관리하는 내부 TF. 로그 정의 및 수집 파이프라인 관련 프론트엔드 개발을 담당했습니다.",
        contributions: ["사용자 행동 로그 수집 관련 프론트엔드 화면 개발"],
        techStack: ["JavaScript"],
      },
    ],
  },
];

const typeColor: Record<string, string> = {
  정규직: "#2563EB",
  프리랜서: "#16A34A",
  스타트업: "#CA8A04",
  파견직: "#6B7280",
  개인: "#9333EA",
};

function ScreenshotGallery({
  screenshots,
  t,
}: {
  screenshots: Screenshot[];
  t: TokensColor;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = () => setLightboxIndex(null);
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i - 1 + screenshots.length) % screenshots.length : null,
      ),
    [screenshots.length],
  );
  const next = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i + 1) % screenshots.length : null,
      ),
    [screenshots.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, prev, next]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[8]}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.fontSize.xs,
            fontWeight: 700,
            color: t.textTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          주요 화면
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: `${tokens.spacing[12]}px`,
            overflowX: "auto",
            pb: `${tokens.spacing[4]}px`,
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-track": {
              bgcolor: t.bgSurface,
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: t.borderDefault,
              borderRadius: 3,
            },
          }}
        >
          {screenshots.map((shot, idx) => (
            <Box
              key={shot.src}
              onClick={() => setLightboxIndex(idx)}
              sx={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: `${tokens.spacing[6]}px`,
                cursor: "zoom-in",
              }}
            >
              <Box
                sx={{
                  borderRadius: `${tokens.radius.md}px`,
                  overflow: "hidden",
                  border: `1px solid ${t.borderLight}`,
                  bgcolor: t.bgSurface,
                  transition: "box-shadow 0.15s",
                  "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.18)" },
                }}
              >
                <img
                  src={shot.src}
                  alt={shot.caption}
                  style={{
                    display: "block",
                    height: 240,
                    width: "auto",
                    maxWidth: 560,
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: tokens.fontSize.xs,
                  color: t.textSecondary,
                  maxWidth: 560,
                }}
              >
                {shot.caption}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Modal open={lightboxIndex !== null} onClose={close}>
        <Box
          onClick={close}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: "24px",
          }}
        >
          {/* 닫기 */}
          <Box
            onClick={close}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            }}
          >
            <CloseIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>

          {/* 이미지 */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              maxWidth: "100%",
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              }}
            >
              <ArrowBackIosNewIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                minWidth: 0,
              }}
            >
              {lightboxIndex !== null && (
                <img
                  src={screenshots[lightboxIndex].src}
                  alt={screenshots[lightboxIndex].caption}
                  style={{
                    display: "block",
                    maxHeight: "calc(100vh - 180px)",
                    maxWidth: "calc(100vw - 160px)",
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              )}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {lightboxIndex !== null && (
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.9)",
                      textAlign: "center",
                      maxWidth: 680,
                    }}
                  >
                    {screenshots[lightboxIndex].caption}
                  </Typography>
                )}
                <Typography
                  sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}
                >
                  {lightboxIndex !== null
                    ? `${lightboxIndex + 1} / ${screenshots.length}`
                    : ""}
                </Typography>
              </Box>
            </Box>

            <Box
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              }}
            >
              <ArrowForwardIosIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

function ProjectItem({
  project,
  accentColor,
  t,
  isLast,
}: {
  project: Project;
  accentColor: string;
  t: TokensColor;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        pb: isLast ? 0 : `${tokens.spacing[24]}px`,
        mb: isLast ? 0 : `${tokens.spacing[24]}px`,
        borderBottom: isLast ? "none" : `1px solid ${t.borderLight}`,
        display: "flex",
        flexDirection: "column",
        gap: `${tokens.spacing[16]}px`,
      }}
    >
      {/* 프로젝트 헤더 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: `${tokens.spacing[8]}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.fontSize.lg,
            fontWeight: 700,
            color: t.textPrimary,
          }}
        >
          {project.title}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[4]}px`,
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: 12, color: t.textTertiary }} />
          <Typography
            sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary }}
          >
            {project.period}
          </Typography>
        </Box>
      </Box>

      {/* 설명 */}
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          color: t.textSecondary,
          lineHeight: 1.75,
        }}
      >
        {project.description}
      </Typography>

      {/* 스크린샷 */}
      {project.screenshots && project.screenshots.length > 0 && (
        <ScreenshotGallery screenshots={project.screenshots} t={t} />
      )}

      {/* 기술 스택 */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {project.techStack.map((tech) => (
          <Chip
            key={tech}
            label={tech}
            size="small"
            sx={{
              fontSize: 11,
              bgcolor: t.bgSurface,
              color: t.textPrimary,
              border: `1px solid ${t.borderLight}`,
              borderRadius: `${tokens.radius.sm}px`,
              height: 24,
            }}
          />
        ))}
      </Box>

      {/* 주요 기여 토글 */}
      <Box>
        <Box
          onClick={() => setExpanded((v) => !v)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: `${tokens.spacing[4]}px`,
            cursor: "pointer",
            "&:hover": { opacity: 0.75 },
          }}
        >
          <Typography
            sx={{
              fontSize: tokens.fontSize.xs,
              fontWeight: 600,
              color: t.accentBlue,
            }}
          >
            주요 기여 {expanded ? "접기" : "보기"}
          </Typography>
          {expanded ? (
            <KeyboardArrowUpIcon sx={{ fontSize: 14, color: t.accentBlue }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ fontSize: 14, color: t.accentBlue }} />
          )}
        </Box>

        {expanded && (
          <Box
            sx={{
              mt: `${tokens.spacing[10]}px`,
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[6]}px`,
            }}
          >
            {project.contributions.map((item, i) => (
              <Box
                key={i}
                sx={{ display: "flex", gap: `${tokens.spacing[8]}px` }}
              >
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    bgcolor: accentColor,
                    flexShrink: 0,
                    mt: "8px",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function CompanyCard({ company, t }: { company: Company; t: TokensColor }) {
  const color = typeColor[company.type];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        bgcolor: t.bgPrimary,
        borderRadius: `${tokens.radius.lg}px`,
        border: `1.5px solid ${t.borderDefault}`,
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 4, bgcolor: color }} />

      <Box
        sx={{
          p: "28px",
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[24]}px`,
        }}
      >
        {/* 회사 헤더 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: `${tokens.spacing[12]}px`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[4]}px`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.spacing[8]}px`,
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.xl,
                  fontWeight: 700,
                  color: t.textPrimary,
                }}
              >
                {company.name}
              </Typography>
              <Box
                sx={{
                  px: "10px",
                  py: "3px",
                  bgcolor: `${color}18`,
                  borderRadius: `${tokens.radius.full}px`,
                  border: `1px solid ${color}40`,
                }}
              >
                <Typography
                  sx={{ fontSize: tokens.fontSize.xs, fontWeight: 600, color }}
                >
                  {company.type}
                </Typography>
              </Box>
            </Box>
            {company.department && (
              <Typography
                sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}
              >
                {company.department}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${tokens.spacing[6]}px`,
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 13, color: t.textTertiary }} />
            <Typography
              sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}
            >
              {company.period}
            </Typography>
          </Box>
        </Box>

        {/* 프로젝트 목록 */}
        <Box>
          {company.projects.map((project, i) => (
            <ProjectItem
              key={i}
              project={project}
              accentColor={color}
              t={t}
              isLast={i === company.projects.length - 1}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function ProjectsPage() {
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
              bgcolor: t.accentBlueLight,
              borderRadius: `${tokens.radius.full}px`,
              px: "14px",
              py: `${tokens.spacing[6]}px`,
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 16, color: t.accentBlue }} />
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.accentBlue,
              }}
            >
              경력 · 프로젝트
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: tokens.fontSize["3xl"],
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            Work Experience
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: `${tokens.spacing[8]}px`,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Object.entries(typeColor).map(([type, color]) => (
              <Box
                key={type}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[4]}px`,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: color,
                  }}
                />
                <Typography
                  sx={{ fontSize: tokens.fontSize.xs, color: t.textSecondary }}
                >
                  {type}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 경력 카드 목록 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[6]}px`,
            width: "100%",
            maxWidth: 1280,
          }}
        >
          <GroupIcon sx={{ fontSize: 14, color: t.textTertiary }} />
          <Typography
            sx={{ fontSize: tokens.fontSize.sm, color: t.textTertiary }}
          >
            총 경력 8년 2개월 · 최신순
          </Typography>
        </Box>

        {companies.map((company, i) => (
          <CompanyCard key={i} company={company} t={t} />
        ))}
      </Box>
    </Box>
  );
}
