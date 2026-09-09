import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Modal } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MemoryIcon from "@mui/icons-material/Memory";
import { Link } from "@tanstack/react-router";
import VideoPlayerModal from "./VideoPlayerModal";
import { tokens } from "../theme/theme";
import type { TokensColor } from "../theme/theme";

//  Profile 데이터

const languageSkills = [
  "JavaScript (TypeScript)",
  "Python",
  "PHP",
  "Java",
  "Dart",
  "Swift",
  "C",
  "C#",
];
const frameworkSkills = [
  "React.js",
  "Next.js",
  "Redux",
  "Recoil",
  "MUI",
  "Tailwind CSS",
  "Fabric.js",
  "Video.js",
  "Leaflet.js",
  "WebRTC",
  "PWA",
  "Express.js",
  "FastAPI",
];
const aiSkills = ["Claude Code", "CLAUDE.md", "Subagents", "Custom Commands"];
const serverSkills = ["Node.js", "Linux (Ubuntu, CentOS)", "Firebase"];
const toolingSkills = ["Storybook", "Webpack", "Vite"];
const devOpsSkills = ["GitHub Actions", "Docker", "k8s", "ArgoCD", "AWS EC2"];
const dbSkills = ["PostgreSQL", "MySQL"];
const etcSkills = ["Git", "GitHub", "JIRA", "Slack"];

//  Projects 데이터

interface Screenshot {
  src: string;
  caption: string;
  videoSrc?: string;
}

interface Project {
  period: string;
  title: string;
  description: string;
  problem?: string[];
  impact?: string[];
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

const typeColor: Record<string, string> = {
  정규직: "#2563EB",
  프리랜서: "#16A34A",
  스타트업: "#CA8A04",
  파견직: "#6B7280",
  개인: "#9333EA",
};

/** 핵심 역량 — 협업 관점. 각 항목은 아래 companies 의 실제 근거와 대응된다 */
const coreCompetencies: {
  title: string;
  body: string;
  evidence: string;
  color: string;
}[] = [
  {
    title: "직군 경계 없이 같은 언어로 대화합니다",
    body: "프론트엔드를 중심으로 백엔드·앱·인프라를 직접 개발해 왔습니다. 서버·DB·k8s를 스스로 구성해 본 경험이 있어 백엔드·인프라 동료와 구현 제약을 놓고 바로 논의할 수 있고, iOS·Android·Flutter에서 웹뷰가 어떻게 동작해야 하는지 알기 때문에 앱 개발자와 역할 경계를 먼저 정리합니다.",
    evidence:
      "나눔사에서 FE·BE·iOS·Android·인프라·디자인 전 영역 단독 수행 · 웅진씽크빅에서 3개 플랫폼 웹뷰 동시 대응",
    color: "#2563EB",
  },
  {
    title: "디자이너와 프론트엔드 사이에 공용 언어를 만듭니다",
    body: "컴포넌트가 정리되지 않아 같은 UI를 매번 다시 만드는 상황을 여러 팀에서 반복해 겪고, Storybook 기반 디자인 시스템을 직접 제안·구축했습니다. 디자이너와 컴포넌트 단위로 합의하는 구조를 만들어 중복 개발과 재작업을 줄였습니다.",
    evidence:
      "omelet · SK AX · SK 하이닉스 디자인 시스템 설계·구축 · 요기요와 I.Log.Yo에 팀 최초 Storybook 도입",
    color: "#9333EA",
  },
  {
    title: "비개발자의 반복 요청을 제품 기능으로 바꿉니다",
    body: "영업팀·데이터 분석가·데이터 사이언티스트가 각기 다른 통계를 매번 개발팀에 요청하는 구조를 문제로 정의하고, 직접 통계를 구성할 수 있는 Drag & Drop 커스텀 대시보드를 선제적으로 기획·개발했습니다. 요청을 받아 처리하는 대신 요청이 생기는 원인을 없애는 쪽을 택합니다.",
    evidence: "요기요 YoDa — 개발팀 요청 건수 약 절반으로 감소",
    color: "#16A34A",
  },
  {
    title: "AI 워크플로를 개인 도구가 아닌 팀 표준으로 만듭니다",
    body: "팀원마다 AI 코딩 도구를 쓰는 방식이 달라 산출물 품질이 갈리는 문제를 프롬프트 실력이 아닌 컨텍스트 부재로 진단하고, 아키텍처·컨벤션·금지사항을 규칙 문서로 명문화해 코드와 같은 저장소에서 버전 관리했습니다. 판단 기준이 반복되는 작업은 전용 서브에이전트·커스텀 커맨드로 표준화했습니다.",
    evidence:
      "omelet — 3인 팀 전체가 동일한 하네스 공유, 리뷰가 스타일 지적 대신 설계 논의에 쓰이기 시작",
    color: "#DB2777",
  },
  {
    title: "다음 사람이 이어받을 수 있는 상태로 넘깁니다",
    body: "테스트와 문서가 없어 배포마다 수동 QA에 며칠이 드는 상황을 파악해 E2E·유닛 테스트 체계를 직접 설계·도입했고, Storybook으로 모듈화와 문서화를 함께 확보했습니다. 제가 없어도 굴러가는 상태를 만드는 것까지가 일의 끝이라고 봅니다.",
    evidence:
      "SK 하이닉스 — 배포당 수동 QA 2~3일에서 1일 이내로 단축 · I.Log.Yo — 안정화 후 다른 FE 개발자에게 인수인계 완료",
    color: "#EA580C",
  },
];

/** 경력 요약표 — 상세 프로젝트 타임라인(companies) 위에 스캔용으로 노출 */
const careerSummary: {
  period: string;
  company: string;
  role: string;
  type: keyof typeof typeColor;
}[] = [
  {
    period: "2025.10 ~ 재직중",
    company: "omelet",
    role: "개발팀 · 물류 최적화 서비스 FE 전담, AI 하네스 설계",
    type: "정규직",
  },
  {
    period: "2025.08 ~ 2025.09",
    company: "SK AX",
    role: "내부 교육 플랫폼 디자인 시스템 구축",
    type: "프리랜서",
  },
  {
    period: "2025.05 ~ 2025.06",
    company: "SK 하이닉스",
    role: "그룹사 공통 디자인 시스템 테스트 자동화",
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
    role: "R&D Center · Data Service팀",
    type: "정규직",
  },
  {
    period: "2021.04 ~ 2022.06",
    company: "웅진씽크빅",
    role: "IT 개발실 · 스마트올 중학 / 초등",
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
    company: "PSR (SK 플래닛 파견)",
    role: "11번가 로그 TF",
    type: "파견직",
  },
];

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
          "다양한 파라미터를 등록하고 파라미터를 이용해 가장 효율적인 루트를 찾아 고객에게 보여주는 물류 최적화 시스템을 개발했습니다. BE 2명·FE 1명 총 3인 팀에서 FE 전체 담당.",
        problem: [
          "프로젝트마다 서로 다른 디자인이 혼재해 컴포넌트 재사용이 어렵고 유지보수 비용이 높았습니다.",
          "수동 QA에 의존하고 있어 배포마다 많은 시간이 소요되고 릴리스 사이클이 느렸습니다.",
          "프론트엔드 취약점 이슈가 반복적으로 발생해 보안 뉴스를 빠르게 확인할 수 있는 체계가 필요했습니다.",
        ],
        impact: [
          "풀필먼트 솔루션의 첫 고객사 납품을 성공적으로 이끌었습니다.",
          "Storybook 기반 디자인 시스템과 테스트 자동화가 팀 표준으로 정착되며 개발 품질과 속도를 함께 개선했습니다.",
          "위치 기반 경로 시각화 기능을 안정적으로 설계·납품하며 다수의 풀필먼트 고객사 확보에 직접 기여했습니다.",
        ],
        contributions: [
          "직접 디자인 시스템을 설계하고 디자이너가 피그마 변경사항을 커밋 가능하도록 하는 구조 추가",
          "기존 정리되지 않은 컴포넌트 구조의 문제를 분석하고, 모노레포, Storybook 기반 디자인 시스템 도입을 제안·적용하여 컴포넌트를 체계화",
          "테스트 자동화 체계가 없는 상황을 파악하고 E2E·유닛 테스트를 직접 설계·도입해 QA 시간을 대폭 단축",
          "정리된 개발 환경을 기반으로 위치 기반 경로 시각화 서비스를 설계·구현",
          "보안 뉴스를 가져오는 슬랙 봇을 사용해 프론트엔드 취약점 문제에 대응",
        ],
        techStack: [
          "React",
          "Next.js",
          "TypeScript",
          "Storybook",
          "Jest",
          "Playwright",
        ],
        screenshots: [
          {
            src: "/images/projects/omelet_figma.png",
            caption:
              "3개 프로젝트에서 사용할 디자인 시스템의 figma 문서 작업 + FE 코드를 설계함",
          },
          {
            src: "/images/projects/omelet_figma_components.png",
            caption:
              "디자인 시스템을 사용해 산출된 컴포넌트를 피그마 컴포넌트로 생성",
          },
          {
            src: "/images/projects/omelet_figma_design-tokens.png",
            caption:
              "디자이너가 git에 직접 디자인 관련 변수 커밋 가능하도록 플러그인 사용",
          },
          {
            src: "/images/projects/omelet_storybook.png",
            caption: "Storybook으로 기존 컴포넌트 정리 및 디자인 시스템 적용",
          },
          {
            src: "/images/projects/omelet_storybook2.png",
            caption: "Storybook으로 기존 컴포넌트 정리 및 디자인 시스템 적용2",
          },

          {
            src: "/images/projects/omelet_tms.png",
            caption:
              "물류 최적화 서비스 - 경로 시각화 및 파라미터 기반 최적 루트 탐색 화면",
            videoSrc: "/images/projects/tms_dnd.mp4",
          },
          {
            src: "/images/projects/tms_job_list.png",
            caption: "물류 최적화 서비스 - 작업 목록 화면",
          },
          {
            src: "/images/projects/tms_new_job.png",
            caption: "물류 최적화 서비스 - 신규 작업 등록 화면",
          },
          {
            src: "/images/projects/tms_order.png",
            caption: "물류 최적화 서비스 - 주문 관리 화면",
          },
          {
            src: "/images/projects/omelet_vuln.png",
            caption: "프론트 보안 이슈 알림",
          },

          {
            src: "/images/projects/omelet_unit_test.png",
            caption: "유닛 테스트 자동화 - QA 시간 대폭 단축",
          },
          {
            src: "/images/projects/omelet_e2e_test.png",
            caption: "E2E 테스트 자동화 - 주요 사용자 플로우 전체 커버",
          },
          { src: "/images/projects/tms_vuln.png", caption: "취약점 분석 화면" },
        ],
      },
      {
        period: "2025.10 ~ 현재",
        title: "AI 하네스 엔지니어링 — 팀 개발 워크플로 표준화",
        description:
          "Claude Code를 개인 생산성 도구가 아닌 팀 인프라로 다루기 위해, 컨텍스트 규칙 문서와 작업별 전용 서브에이전트·커스텀 커맨드를 설계해 팀 표준으로 정착시켰습니다. BE 2명·FE 1명 총 3인 팀 전체가 동일한 하네스를 공유합니다.",
        problem: [
          "팀원마다 AI 코딩 도구를 쓰는 방식이 달라 같은 요청에도 산출물의 구조와 컨벤션이 갈리고, 리뷰에서 스타일 지적이 반복됐습니다.",
          "프로젝트의 아키텍처·컨벤션·금지사항이 사람의 머릿속에만 있어 세션마다 같은 맥락을 다시 설명해야 했고, 설명이 빠지면 디자인 시스템을 우회하는 코드가 생성됐습니다.",
          "코드리뷰·테스트 작성·Storybook 스토리 생성처럼 판단 기준이 이미 정해진 반복 작업이 매번 즉흥적인 프롬프트로 처리되고 있었습니다.",
        ],
        impact: [
          "AI 산출물이 팀 컨벤션과 디자인 시스템을 따르도록 통제되어, 리뷰가 스타일 지적 대신 설계 논의에 쓰이기 시작했습니다.",
          "프로젝트 규칙이 개인의 기억이 아니라 저장소에서 버전 관리되는 문서로 관리되기 시작했습니다.",
          "Storybook 디자인 시스템·테스트 자동화에 이어 AI 워크플로까지 팀 표준으로 정착시켜, 도구를 도입한 것이 아니라 체계를 설계해 개발 문화를 개선했습니다.",
        ],
        contributions: [
          "팀원별로 AI 산출물 품질이 갈리는 원인을 프롬프트 실력이 아닌 컨텍스트 부재로 진단하고, 아키텍처·코드 컨벤션·디자인 시스템 사용 규칙·금지사항을 컨텍스트 규칙 문서로 명문화",
          "규칙 문서를 코드와 같은 저장소에서 버전 관리해, 코드 변경과 규칙 변경이 동일한 리뷰 절차를 거치는 구조 설계",
          "코드리뷰·테스트 작성·Storybook 스토리 생성 등 판단 기준이 반복되는 작업을 작업별 전용 서브에이전트와 커스텀 커맨드로 분리해 표준화",
          "서브에이전트마다 역할과 참조 범위를 좁게 정의해, 하나의 에이전트가 과도한 컨텍스트를 들고 판단 품질이 흔들리는 문제를 방지",
          "하네스의 사용법과 한계를 팀에 공유하고 피드백을 받아 규칙과 커맨드를 반복 개선",
        ],
        techStack: [
          "Claude Code",
          "CLAUDE.md",
          "Subagents",
          "Custom Commands",
          "TypeScript",
          "Storybook",
        ],
      },
    ],
  },
  {
    period: "2025.01 ~ 2025.09",
    name: "프리랜서 / 개인 프로젝트",
    department: "디자인 시스템 · 풀스택 개발",
    type: "프리랜서",
    projects: [
      {
        period: "2025.08 ~ 2025.09",
        title: "SK AX 내부 교육 플랫폼 — 디자인 시스템 구축",
        description:
          "SK 구성원 대상 교육·스킬 관리 서비스. FE 2명·서버 2명 팀에서 Next.js → React 전환 및 Storybook 기반 디자인 시스템 구축을 담당했습니다.",
        problem: [
          "SEO·SSR이 필요하지 않음에도 Next.js를 사용해 불필요한 빌드 복잡도가 있었습니다.",
          "프로젝트 간 프론트 컴포넌트를 관리하는 시스템이 없어 중복 개발이 빈번했습니다.",
        ],
        impact: [
          "Next.js 의존성 제거로 빌드 복잡도를 낮추고 모노레포 환경의 패키지 관리를 단순화했습니다.",
          "Storybook 기반 디자인 시스템을 설계·구축해 컴포넌트 중복 개발을 방지하는 체계를 마련했습니다.",
        ],
        contributions: [
          "SEO·SSR이 불필요한 점을 분석하고 Next.js → React 전환을 제안·실행",
          "프로젝트 간 컴포넌트 중복 문제를 파악하고 Storybook 기반 디자인 시스템 구축 주도",
        ],
        techStack: ["React", "TypeScript", "SCSS", "Tailwind", "Storybook"],
      },
      {
        period: "2025.05 ~ 2025.06",
        title: "SK 하이닉스 그룹사 공통 디자인 시스템 — 테스트 자동화",
        description:
          "SK 사내 공통 Ant Design 포크 기반 디자인 시스템의 Storybook 유지보수를 담당하며, 부재했던 유닛 테스트 체계를 도입했습니다.",
        problem: [
          "컴포넌트 테스트 코드가 전무해 배포당 수동 QA에 2~3일이 소요되고 있었습니다.",
        ],
        impact: [
          "유닛 테스트 도입으로 배포당 수동 QA 2~3일 → 1일 이내로 단축했습니다.",
          "SK 그룹사 전체에 배포되는 라이브러리의 품질 기준을 정의하고 테스트 체계를 수립했습니다.",
        ],
        contributions: ["디자인 시스템 유지보수 및 유닛 테스트 체계 설계·구현"],
        techStack: ["TypeScript", "Storybook", "Ant Design"],
      },
      {
        period: "2025.01 ~ 2025.03",
        title: "위치 기반 무료 나눔 플랫폼 — 풀스택 개발",
        description:
          "무료 나눔 장소를 공유하는 위치 기반 서비스. FE·BE·iOS·Android·인프라·디자인까지 전 영역을 기획하고 개발했습니다.",
        problem: [
          "기존 중고 나눔이 지역 커뮤니티나 오픈채팅에 분산되어 있어 위치 기반 통합 플랫폼의 필요성을 정의했습니다.",
        ],
        impact: [
          "기획부터 스토어 출시까지 전 과정을 완수하여 서비스를 런칭했습니다.",
          "k8s + ArgoCD GitOps 파이프라인을 설계·구성하며 컨테이너 오케스트레이션과 CD 자동화 역량을 확보했습니다.",
        ],
        contributions: [
          "Next.js + Recoil + Leaflet.js로 지도 기반 프론트엔드 설계·개발",
          "Python FastAPI + PostgreSQL로 RESTful API 및 위치 데이터 스키마 설계",
          "Docker, k8s, GitHub Actions, ArgoCD 기반 GitOps 파이프라인 설계·구축",
          "iOS(Swift) / Android(Java) WebApp 개발 후 스토어 출시",
        ],
        techStack: [
          "Next.js",
          "TypeScript",
          "Recoil",
          "Leaflet.js",
          "Firebase Auth",
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
              "브랜치 전략 기반 Docker image 태그 + Kustomize로 k8s deployment 자동 반영",
          },
          {
            src: "/images/projects/nanumsa_k8s.png",
            caption: "k8s 컨테이너 관리",
          },
          {
            src: "/images/projects/nanumsa_argocd.png",
            caption: "GitHub Actions 완료 후 ArgoCD에서 자동 sync",
          },
        ],
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
          "요기요의 전체 데이터와 ML 결과를 차트·지도로 시각화하고, 사용자별 커스텀이 가능한 대시보드를 개발한 프로젝트. FE 아키텍처 설계부터 전체 구현까지 주도했습니다.",
        problem: [
          "영업팀, 데이터 분석가, 데이터 사이언티스트마다 필요한 통계가 달라 매번 개발팀에 요청하는 비효율적 구조가 있었습니다.",
        ],
        impact: [
          "직접 기획한 Drag & Drop 커스텀 대시보드로 영업팀이 스스로 통계를 구성할 수 있게 되어 개발팀 요청 건수를 약 절반으로 줄였습니다.",
          "Leaflet 마커 클러스터링 도입을 제안·적용해 수만 개 가맹점의 렌더링 성능을 대폭 개선했습니다.",
          "Storybook + GitHub Actions CI/CD를 팀 최초로 도입하여 개발 문화 개선을 이끌었습니다.",
        ],
        contributions: [
          "팀 표준 템플릿(Next.js + Webpack + TypeScript)을 기반으로 프로젝트 환경 설계·구축",
          "Storybook 도입 필요성을 판단하고 직접 설치·구성, GitHub Actions + ArgoCD 기반 CI/CD 파이프라인 설계·구축",
          "영업팀의 반복 요청 패턴을 분석하고 Drag & Drop 커스텀 대시보드를 선제적으로 기획·개발",
          "Chart.js 기반 데이터 시각화와 Leaflet.js 기반 지도(폴리곤, 멀티폴리곤, 마커 클러스터링) 설계·구현",
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
          "요기요의 사용자 행동 로그 개발·관리 프로세스를 통합하는 플랫폼. 기존 분산 관리 방식의 문제를 해결하기 위해 FE 전체를 설계부터 주도했습니다.",
        problem: [
          "로그 정의서가 스프레드시트와 노션에 분산되어 어떤 로그가 개발 중인지, 담당자가 누구인지 파악하기 어려웠습니다.",
          "로그 품질 관리를 위한 통합 플랫폼이 없어 팀 간 소통 비용이 컸습니다.",
          "기획자가 로그 정의를 수십 건씩 연속 입력하는데 필드마다 마우스로 이동해야 해 입력 흐름이 계속 끊겼습니다.",
        ],
        impact: [
          "분산된 로그 관리를 통합 플랫폼으로 일원화하여 팀 간 소통 비용을 줄이고 로그 품질을 향상시켰습니다.",
          "실사용자의 불편을 직접 관찰하고 선제적으로 기획한 JSON 파서 등 편의 기능이 개발자들에게 높은 평가를 받았습니다.",
          "키보드만으로 입력을 완결할 수 있게 만들어 기획자의 반복 입력 속도를 높였습니다. 접근성 대응이 별도 비용이 아니라 실사용자의 생산성 개선과 같은 방향이라는 것을 확인한 경험입니다.",
          "Storybook 최초 도입 + CI/CD 구축 경험이 이후 YoDa 프로젝트의 개발 문화 기반이 되었습니다.",
          "플랫폼 안정화 후 다른 FE 개발자에게 성공적으로 인수인계했습니다.",
        ],
        contributions: [
          "Next.js + TypeScript + Webpack + MUI5 환경 구축, FE 전체 담당",
          "팀에 Storybook이 없던 상황에서 도입 필요성을 직접 판단하고 최초 도입, GitHub Actions + ArgoCD 기반 CI/CD 라인 구축",
          "캡쳐 화면 위에 아이콘·주석을 추가하고 Drag & Drop 가능한 컴포넌트 개발",
          "대량의 행동 로그 작성 시 반복되는 불편을 파악하고 JSON 파서 등 편의 기능을 선제적으로 기획·개발",
          "기획자의 연속 입력 흐름을 관찰하고 마우스 없이 폼을 완결할 수 있도록 포커스 순서와 이동 규칙을 설계해 키보드 내비게이션 구현",
          "로그 변경 이력 추적의 필요성을 판단하고 git diff 형태의 히스토리 화면 설계·구현",
          "Echarts로 막대·선·원형 차트 구성, 통계 데이터 가공 처리",
          "서비스 / 디바이스 / 스테이터스 / 타이틀 다중 필터 검색 + 키워드 검색 개발",
          "이미지 DnD 업로드, Copy&Paste 업로드 기능 — 반응형에서도 위치 고정 구현",
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
          "저사양 패드 기기에서 동작하는 스마트올 중학 웹앱 프로젝트. FE 1명·BE 1명·Android 1명·iOS/Flutter 1명·퍼블리셔(외주)로 구성된 팀에서 웹 FE 전체를 단독으로 책임졌습니다.",
        problem: [
          "기존 코드가 네이티브 액티비티에 종속되어 웹뷰 단독 실행이 불가능했습니다.",
          "서드파티 패키지 오류로 인한 메모리 누수가 발생해 앱이 점점 느려지고 크래시가 잦아지는 문제가 있었습니다.",
        ],
        impact: [
          "네이티브 의존성 완전 제거 → 웹뷰 독립 실행 가능, 크로스 플랫폼 유지보수 비용 대폭 감소",
          "Webpack esbuild + 코드 스플리팅으로 초기 로딩 8s → 0.7s (91% 개선)",
          "크롬 DevTools 메모리 프로파일링으로 누수 원인을 특정·제거하여 앱 안정성을 확보했습니다.",
          "아이패드 버전 런칭 후 완판 성과로 이어졌고, 안드로이드 초기 이용자에게도 기술적 개선이 체감된다는 코멘트를 받았습니다.",
        ],
        contributions: [
          "Video.js 기반 동영상 플레이어 설계·개발",
          "저사양·다양한 스펙의 패드 환경에 맞춘 최적화를 스스로 분석·적용",
          "웹뷰가 네이티브 액티비티에 종속된 구조적 문제를 발견하고 메뉴를 웹으로 전환하는 아키텍처 변경 제안·실행",
          "HLS 프로토콜 기반 라이브 스트리밍 서비스를 Node.js 서버와 함께 구현하고 RTSP 생중계(328명 동시 시청) 대응",
          "크롬 DevTools로 패키지 오류 메모리 누수 분석 → 리스너 안정화 최적화",
          "Webpack esbuild + 코드 스플리팅으로 초기 로딩 속도 8s → 0.7s",
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
          "스마트올 초등 서비스 이벤트 페이지 개발. three.js로 저사양 학습기에서도 동작하는 3D 캐릭터 렌더링을 직접 설계·구현했습니다.",
        problem: [
          "이벤트 페이지에 3D 캐릭터를 표현하고 싶었지만, 학습기 사양이 낮아 일반적인 3D 렌더링 방식으로는 버벅임이 심했습니다.",
        ],
        impact: [
          "저사양 패드의 성능 제약 안에서 최적화 전략을 직접 설계·적용하여 속도와 안정성을 모두 확보한 채 성공적으로 마무리했습니다.",
          "제약 조건이 명확한 환경에서 성능 중심 설계 사고방식을 체득했습니다.",
        ],
        contributions: [
          "three.js 드로우콜 최소화·텍스처 압축 등 최적화 전략 수립·적용",
          "저사양 기기에서도 부드럽게 동작하는 캐릭터 3D 렌더링 구현",
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
          "회원 관리, 문자 발송(KT 크로샷 연동) 등의 기능을 갖춘 투자자문업 관리 플랫폼. FE·BE·인프라(AWS) 전 영역을 혼자 담당.",
        problem: [
          "발주사에서 회원 관리, 문자 발송, 통계 확인을 각각 별도 도구로 처리해 업무 효율이 낮았습니다.",
          "통합 관리 시스템이 없어 운영 담당자가 여러 곳을 오가며 작업해야 했습니다.",
        ],
        impact: [
          "하나의 플랫폼으로 회원·문자·통계를 통합 관리해 운영 담당자의 업무 흐름 단순화",
          "FE·BE·인프라(AWS) 전 영역을 혼자 담당하며 풀스택 단독 개발 역량을 확인했습니다.",
          "사업 방향 변경으로 서비스 출시에 이르지는 못했지만, 요구사항 정의부터 인프라 구성까지 독립적으로 완수했습니다.",
        ],
        contributions: [
          "React.js + MaterialUI로 회원 관리 및 통계 차트 화면 설계·개발",
          "Chart.js 기반 사용자 통계 시각화 화면 기획·구현",
          "Laravel8 + PHP7 + MySQL 기반 REST API 서버 설계·개발",
          "AWS EC2(Ubuntu) 인프라 구성 및 KT 크로샷 문자 전송 기능 연동",
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
          "유치원 선생님이 아이의 기기 NFC 태그로 구매 기능을 제공하고, 공지사항을 음성(STT)으로 남길 수 있는 서비스. FE·BE·iOS·Android 전체 담당.",
        problem: [
          "Highcharts.js가 프로덕션에서 유료인 점을 발견하고 NFC 사용량 시계열 차트를 다른 방식으로 구현해야 했습니다.",
        ],
        impact: [
          "WebRTC 음성 녹음, Android NFC 태그 연동, iOS·Android 멀티플랫폼까지 MVP를 독립적으로 기획·완성했습니다.",
          "NFC·WebRTC·TTS 등 다양한 하드웨어 연동 기술을 동시에 적용하며 디바이스 API 경험 폭을 넓혔습니다.",
          "다수 어린이집 시연을 성공적으로 진행했습니다.",
        ],
        contributions: [
          "React.js + Bootstrap으로 모바일 기반 FE 설계·개발",
          "Highcharts.js 대신 D3.js로 전환해 NFC 사용량 시계열 차트 구현",
          "WebRTC 기반 음성 녹음 기능 설계·구현",
          "Laravel8 서버에서 GCP TTS + NCP TTS 연동 구현",
          "AWS EC2 + ELB + Route53으로 인프라 구성, SSL·DNS 설정",
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
          "Android(Java)",
          "iOS(Swift)",
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
          "반려동물의 건강 수치를 기록하고, 시계열 차트로 확인하거나 일기 형식으로 볼 수 있는 앱. FE·BE·iOS·Android 전체 담당. iOS/Android 스토어 업로드 성공.",
        impact: [
          "기획부터 스토어 출시·수익화까지 전 과정을 독립적으로 완수하여 서비스를 성공적으로 런칭했습니다.",
          "iOS·Android 스토어 출시를 독립적으로 완수하며 서비스 배포 전 과정을 체득했습니다.",
          "In-App Purchase·광고 연동 등 수익화 구조를 직접 설계·구현하며 비즈니스 맥락 이해도를 높였습니다.",
        ],
        contributions: [
          "React.js + PHP로 FE/BE 개발 전담",
          "Highcharts.js 기반 건강검사 수치별 시계열 차트 설계·구현",
          "Firebase 소셜 로그인 + FCM 푸시 메시지 연동",
          "이메일 알림, 로그인, 이미지 업로드 기능을 포함한 PHP 서버 설계·개발",
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
        impact: [
          "병원 의사의 의뢰를 받아 독립적으로 기획·개발을 완수했으며, 현재까지 내부적으로 활용되고 있습니다.",
          "의료 현장의 실사용자(환자·의사) 니즈를 직접 반영하며 도메인 중심 UX 설계 역량을 습득했습니다.",
          "Android 알림 매니저 기반 복약 알림 구현으로 네이티브 API 활용 경험을 확보했습니다.",
        ],
        contributions: [
          "React.js SPA 아키텍처 설계·구현",
          "PHP 기반 로그인, 일정 관리, 인증 등 서버 기능 설계·개발",
          "Android BroadcastReceiver + AlarmManager를 활용한 복약 알림 시스템 설계·구현 및 DB 연동",
          "쿠키 매니저를 활용한 웹과 앱 자동 로그인 연동",
        ],
        techStack: ["React.js", "PHP7", "Android(Java)"],
      },
      {
        period: "2018.12 ~ 2019.02",
        title: "부동산 기계학습 및 통계 툴",
        description:
          "다양한 파라미터·제약조건을 입력하면 기계학습을 실행하고 결과를 차트로 시각화하는 툴. 이 서비스로 구글 스타트업 지원 사업에 당선됐습니다.",
        impact: [
          "이 서비스로 구글 스타트업 지원 사업에 당선되며 제품의 시장 가치를 입증했습니다.",
          "비개발자 친화적 ML 파라미터 UI를 직접 기획·설계한 경험으로 사용자 중심 인터페이스 설계 역량을 확보했습니다.",
        ],
        contributions: [
          "Vanilla JS + History API로 SPA 구조 설계·구현",
          "Highcharts.js 기반 시세 추이 시각화 개발",
          "비개발자도 ML 모델을 구성할 수 있는 파라미터 입력 UI 기획·설계·개발",
          "세션이 끊겨도 결과를 확인할 수 있는 비동기 결과 조회 기능 설계·구현",
        ],
        techStack: ["Vanilla JS", "jQuery", "Highcharts.js"],
      },
      {
        period: "2018.05 ~ 2019.10",
        title: "부동산 빅데이터 분석 서비스",
        description:
          "지도 기반으로 다양한 부동산 정보를 확인하고 검색 필터로 탐색할 수 있는 부동산 빅데이터 분석 서비스. FE·BE·iOS·Android 전 영역을 스스로 기획하고 단독으로 개발했습니다.",
        impact: [
          "독립적으로 기획·개발한 서비스가 장기간 운영되었으며, 여러 차례 국가 사업 선정에 직접 기여했습니다.",
          "PostGIS 좌표 기반 클러스터링을 직접 설계·적용하여 수만 건 마커의 줌 레벨별 자동 군집화로 지도 성능 문제를 해결했습니다.",
          "iOS·Android WebApp 이중 배포를 독립적으로 완수하며 하이브리드 앱 개발 역량을 확보했습니다.",
          "결제·인증·스크래핑·푸시 알림까지 Full-stack으로 설계·구현하며 서비스 단독 런칭 역량을 입증했습니다.",
        ],
        contributions: [
          "Vanilla JS + History API로 SPA 설계·구현, jQuery + Webpack + Babel로 크로스 브라우징 대응",
          "Naver Maps API 기반 지도 서비스 설계·개발, Highcharts.js 기반 데이터 시각화",
          "조건 검색 필터 UI (아파트/연립/오피스텔/가격대/거래기간/지하철 등) 개발",
          "PHP CRUD 서버와 PostgreSQL + PostGIS 기반 위치 데이터 스키마 설계·구현",
          "Python + Selenium 기반 경매 데이터 스크래핑과 주소 기반 데이터 매핑·정규화",
          "PostGIS 좌표 클러스터링을 적용해 대량 마커 성능 문제 해결",
          "Iamport 결제 연동, 로그인·추천·게시판·인증·푸시 알림 구현",
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
    name: "PSR (SK 플래닛 파견)",
    department: "11번가 로그 TF",
    type: "파견직",
    projects: [
      {
        period: "2017.06 ~ 2018.05",
        title: "11번가 사용자 행동 로그 수집 시스템",
        description:
          "11번가 서비스의 사용자 행동 로그를 수집·관리하는 내부 TF. 데이터 분석가들과 함께하는 팀에서 FE 화면 개발 담당.",
        problem: [
          "11번가 전반의 사용자 행동 로그가 분산 관리되어 어떤 로그가 정의됐는지, 개발 상태는 어떤지 파악하기 어려웠습니다.",
        ],
        impact: [
          "대형 이커머스 플랫폼의 로그 수집 파이프라인 구조를 직접 경험하며 데이터 엔지니어링 관점의 시야를 확장했습니다.",
          "TF 조직 내 다양한 직군과 협업하며 로그 정의·수집·관리 프로세스 전반을 이해했습니다.",
        ],
        contributions: [
          "사용자 행동 로그 수집 관련 프론트엔드 화면 설계·개발",
          "수집된 로그 기반 오류율 분석 및 엑셀 리포트 화면 기획·구현",
        ],
        techStack: ["JavaScript"],
      },
    ],
  },
];

//  공통 컴포넌트

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

/**
 * 원본 스크린샷 경로 → 용도별 WebP 경로.
 * 원본 PNG는 public/images/projects/ 에 그대로 두고,
 * 갤러리는 thumb/(높이 480 = 표시 240의 2배), 라이트박스는 large/(가로 1920)를 쓴다.
 * .png 가 아니면 원본 경로를 그대로 반환한다.
 */
const screenshotSrc = (src: string, size: "thumb" | "large") =>
  src.replace(/\/([^/]+)\.png$/, `/${size}/$1.webp`);

function ScreenshotGallery({
  screenshots,
  t,
}: {
  screenshots: Screenshot[];
  t: TokensColor;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("");

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

  const openVideo = (src: string, caption: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoSrc(src);
    setVideoTitle(caption);
    setVideoOpen(true);
  };

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
              <Box sx={{ position: "relative" }}>
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
                    src={screenshotSrc(shot.src, "thumb")}
                    alt={shot.caption}
                    loading="lazy"
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
                {shot.videoSrc && (
                  <Box
                    onClick={(e) => openVideo(shot.videoSrc!, shot.caption, e)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background 0.15s, transform 0.15s",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.82)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <PlayArrowIcon sx={{ color: "#fff", fontSize: 20 }} />
                  </Box>
                )}
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

      {/* 이미지 라이트박스 */}
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
                  src={screenshotSrc(screenshots[lightboxIndex].src, "large")}
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

      <VideoPlayerModal
        open={videoOpen}
        src={videoSrc}
        title={videoTitle}
        onClose={() => setVideoOpen(false)}
      />
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

      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          color: t.textSecondary,
          lineHeight: 1.75,
        }}
      >
        {project.description}
      </Typography>

      {project.screenshots && project.screenshots.length > 0 && (
        <ScreenshotGallery screenshots={project.screenshots} t={t} />
      )}

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
              gap: `${tokens.spacing[12]}px`,
            }}
          >
            {project.problem && project.problem.length > 0 && (
              <Box
                sx={{
                  bgcolor: t.accentOrangeLight,
                  border: `1px solid ${t.accentOrange}40`,
                  borderRadius: `${tokens.radius.md}px`,
                  px: `${tokens.spacing[16]}px`,
                  py: `${tokens.spacing[12]}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `${tokens.spacing[8]}px`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.xs,
                    fontWeight: 700,
                    color: t.accentOrange,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Problem
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${tokens.spacing[6]}px`,
                  }}
                >
                  {project.problem.map((item, i) => (
                    <Box
                      key={i}
                      sx={{ display: "flex", gap: `${tokens.spacing[8]}px` }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: t.accentOrange,
                          flexShrink: 0,
                          mt: "8px",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: tokens.fontSize.sm,
                          color: t.textSecondary,
                          lineHeight: 1.75,
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {project.impact && project.impact.length > 0 && (
              <Box
                sx={{
                  bgcolor: t.accentGreenLight,
                  border: `1px solid ${t.accentGreen}40`,
                  borderRadius: `${tokens.radius.md}px`,
                  px: `${tokens.spacing[16]}px`,
                  py: `${tokens.spacing[12]}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `${tokens.spacing[8]}px`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.xs,
                    fontWeight: 700,
                    color: t.accentGreen,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Impact &amp; Learning
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${tokens.spacing[6]}px`,
                  }}
                >
                  {project.impact.map((item, i) => (
                    <Box
                      key={i}
                      sx={{ display: "flex", gap: `${tokens.spacing[8]}px` }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: t.accentGreen,
                          flexShrink: 0,
                          mt: "8px",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: tokens.fontSize.sm,
                          color: t.textSecondary,
                          lineHeight: 1.75,
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            <Box
              sx={{
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

//  메인 홈 페이지

function calcCareer(startYear: number, startMonth: number): string {
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months > 0 ? `${years}년 ${months}개월` : `${years}년`;
}

export default function HomePage() {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const careerDuration = calcCareer(2017, 6);
  const careerYears = Math.floor(
    ((new Date().getFullYear() - 2017) * 12 + (new Date().getMonth() + 1 - 6)) /
      12,
  );

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
        {/*  프로필 헤더  */}
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
            {`Frontend Developer · 총 ${careerDuration} 경력`}
          </Typography>
        </Box>

        {/*  연락처  */}
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
              icon: (
                <LanguageIcon sx={{ fontSize: 16, color: t.accentPurple }} />
              ),
              label: "meeso-not-miso.com",
              href: "https://www.meeso-not-miso.com/",
            },
            {
              icon: <SchoolIcon sx={{ fontSize: 16, color: t.accentPurple }} />,
              label: "명지대학교 기계공학과 졸업",
            },
          ].map(({ icon, label, href }) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {icon}
              <Typography
                component={href ? "a" : "span"}
                href={href}
                target={href ? "_blank" : undefined}
                rel={href ? "noreferrer" : undefined}
                sx={{
                  fontSize: tokens.fontSize.sm,
                  color: t.textSecondary,
                  textDecoration: "none",
                  "&:hover": href ? { color: t.accentPurple } : undefined,
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/*  핵심 역량  */}
        <SectionCard title="핵심 역량" t={t}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[16]}px`,
            }}
          >
            {coreCompetencies.map((c, i) => (
              <Box
                key={c.title}
                sx={{
                  display: "flex",
                  gap: `${tokens.spacing[16]}px`,
                  alignItems: "flex-start",
                  pb:
                    i < coreCompetencies.length - 1
                      ? `${tokens.spacing[16]}px`
                      : 0,
                  borderBottom:
                    i < coreCompetencies.length - 1
                      ? `1px solid ${t.borderLight}`
                      : "none",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 30,
                    height: 30,
                    borderRadius: `${tokens.radius.sm}px`,
                    bgcolor: `${c.color}18`,
                    border: `1px solid ${c.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: "2px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      fontWeight: 700,
                      color: c.color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${tokens.spacing[6]}px`,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.md,
                      fontWeight: 700,
                      color: t.textPrimary,
                      lineHeight: 1.5,
                    }}
                  >
                    {c.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.base,
                      color: t.textSecondary,
                      lineHeight: 1.8,
                    }}
                  >
                    {c.body}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.sm,
                      color: c.color,
                      lineHeight: 1.6,
                      fontWeight: 500,
                    }}
                  >
                    {c.evidence}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/*  자기소개  */}
        <SectionCard title="자기소개" t={t}>
          <Typography
            sx={{
              fontSize: tokens.fontSize.base,
              color: t.textSecondary,
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {`"코드 한 줄이 제품이 되는 전 과정을, 직접 설계하고 완성합니다"

저는 ${careerYears}년간 프론트엔드를 중심으로 백엔드, 앱, 인프라까지 직접 영역을 넓혀 온 개발자입니다. 인력이 부족한 환경에서도 스스로 기술 스택을 학습해 풀스택 개발을 완수해 왔고, 그 과정에서 어떤 포지션의 동료와도 기술적 맥락을 공유하며 소통할 수 있는 넓은 시야를 갖게 됐습니다.

제품 품질을 스스로 정의하고 끌어올립니다.
웅진씽크빅 재직 당시, 낮은 사양의 패드에서 앱이 점점 느려지는 현상을 발견하고 스스로 크롬 DevTools 메모리 프로파일링을 수행해 누수 원인을 특정·제거했습니다. 그 결과 아이패드 버전 런칭 후 완판이라는 성과로 이어졌습니다. 요기요(위대한상상)에서는 수만 개의 가맹점 마커 렌더링 병목을 먼저 분석하고 Leaflet 마커 클러스터링 도입을 제안·적용해 해결했으며, 영업팀의 반복 요청 패턴을 파악해 Drag & Drop 커스텀 대시보드를 선제적으로 기획·개발하여 개발팀 요청 건수를 절반으로 줄였습니다.

필요한 개발 문화를 직접 제안하고 정착시킵니다.
팀에 Storybook이 없던 환경에서 도입 필요성을 판단하고 직접 제안·구축했으며, GitHub Actions + ArgoCD 기반 CI/CD 파이프라인 역시 스스로 설계해 여러 프로젝트에 정착시켰습니다. Storybook 도입을 통해 모듈화와 문서화를 동시에 확보했고, 신규 개발자 온보딩 시간 단축과 팀 간 협업 비용 절감이라는 실질적 효과를 이끌어 냈습니다. SK 하이닉스 프리랜서 프로젝트에서는 그룹사 전체에 배포되는 디자인 시스템에 테스트 자동화 체계가 부재한 점을 파악하고 직접 설계·구축했습니다. 최근에는 팀원마다 AI 코딩 도구를 쓰는 방식이 달라 산출물 품질이 흔들리는 문제를 프롬프트 실력이 아닌 컨텍스트 부재로 진단하고, Claude Code의 컨텍스트 규칙 문서와 작업별 전용 서브에이전트·커스텀 커맨드를 설계해 3인 팀의 표준 하네스로 정착시켰습니다.

더 나은 방향이 보이면 먼저 제안하고, 틀리면 빠르게 인정합니다.
기술적 판단이 틀렸을 때 빠르게 인정하고 방향을 수정하는 것이 팀의 속도를 높인다고 믿습니다. 문제를 발견하면 먼저 원인을 분석해 동료에게 공유하고, 해결 방향을 함께 논의하는 것을 선호합니다.

배달, 교육, 물류, 부동산, 의료 등 다양한 도메인에서 제품을 직접 설계하고 완성해 온 경험을 바탕으로, 새로운 환경에서도 스스로 맥락을 파악하고 빠르게 기여할 수 있다고 자신합니다. 주어진 일만 하는 것이 아니라, 제품을 함께 만들어가는 동료가 되고 싶습니다.`}
          </Typography>
        </SectionCard>

        {/*  기술 스택  */}
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
                category: "Programming Languages",
                skills: languageSkills,
                color: "#7C3AED",
              },
              {
                category: "Framework / Library",
                skills: frameworkSkills,
                color: "#9333EA",
              },
              { category: "AI Tooling", skills: aiSkills, color: "#DB2777" },
              { category: "Server", skills: serverSkills, color: "#2563EB" },
              { category: "Tooling", skills: toolingSkills, color: "#0891B2" },
              { category: "DevOps", skills: devOpsSkills, color: "#16A34A" },
              { category: "DB", skills: dbSkills, color: "#EA580C" },
              { category: "Etc", skills: etcSkills, color: "#6B7280" },
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

        {/*  경력 요약  */}
        <SectionCard title="경력 요약" t={t}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {careerSummary.map((item, i) => (
              <Box
                key={item.period + item.company}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${tokens.spacing[16]}px`,
                  flexWrap: "wrap",
                  py: `${tokens.spacing[12]}px`,
                  borderBottom:
                    i < careerSummary.length - 1
                      ? `1px solid ${t.borderLight}`
                      : "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textTertiary,
                    width: 150,
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.period}
                </Typography>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.base,
                    fontWeight: 600,
                    color: t.textPrimary,
                    width: 200,
                    flexShrink: 0,
                  }}
                >
                  {item.company}
                </Typography>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textSecondary,
                    flex: 1,
                    minWidth: 200,
                  }}
                >
                  {item.role}
                </Typography>
                <Box
                  sx={{
                    flexShrink: 0,
                    bgcolor: `${typeColor[item.type]}18`,
                    border: `1px solid ${typeColor[item.type]}40`,
                    borderRadius: `${tokens.radius.full}px`,
                    px: "10px",
                    py: "3px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.xs,
                      fontWeight: 700,
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

        {/*  Work Experience 헤더  */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${tokens.spacing[16]}px`,
            width: "100%",
            maxWidth: 1280,
            pt: `${tokens.spacing[16]}px`,
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
            {`총 경력 ${careerDuration} · 최신순`}
          </Typography>
        </Box>

        {/*  회사 카드 목록  */}
        {companies.map((company, i) => (
          <CompanyCard key={i} company={company} t={t} />
        ))}

        {/*  기술 역량 데모  */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: `${tokens.spacing[16]}px`,
            width: "100%",
            maxWidth: 1280,
            pt: `${tokens.spacing[16]}px`,
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
            <MemoryIcon sx={{ fontSize: 16, color: t.accentPurple }} />
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.accentPurple,
              }}
            >
              기술 역량 데모
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: tokens.fontSize["3xl"],
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            Live Demo
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.md,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 1.7,
              maxWidth: 640,
            }}
          >
            실무 프로젝트에서 활용한 기술을 직접 체험할 수 있는 데모입니다.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: `${tokens.spacing[20]}px`,
          }}
        >
          {[
            {
              to: "/image-filter",
              title: "WebAssembly 이미지 필터",
              desc: "Rust → WASM 빌드로 브라우저에서 네이티브 수준의 이미지 처리를 구현합니다. Web Worker 싱글턴 패턴으로 UI 블로킹 없이 실시간 필터를 적용합니다.",
              relation:
                "저사양 패드 최적화(웅진씽크빅), 대량 데이터 처리 성능 개선(요기요) 경험에서 비롯된 성능 중심 사고를 보여줍니다.",
              color: "#7C3AED",
            },
            {
              to: "/cad",
              title: "미니 CAD — 3D 모델링·조립",
              desc: "2D 스케치 → 3D 돌출 → 모서리 기반 조립 → 4방향 설계도까지, CAD 소프트웨어의 핵심 워크플로우를 Three.js로 구현합니다.",
              relation:
                "Fabric.js 기반 캡처 편집(요기요 I.Log.Yo), three.js 3D 렌더링 최적화(웅진씽크빅 초등) 등 복잡한 Canvas/3D 인터랙션 구현 역량을 보여줍니다.",
              color: "#2563EB",
            },
            {
              to: "/a11y",
              title: "웹 접근성 — 키보드·스크린리더·모달",
              desc: "키보드 내비게이션, 스크린리더 폼, 모달 포커스 트랩 등 WCAG 기준의 접근성 패턴을 구현합니다.",
              relation:
                "다양한 사용자 환경 대응(저사양 패드, 멀티 플랫폼 WebView) 경험에서 확장된 사용자 중심 개발 역량을 보여줍니다.",
              color: "#EA580C",
            },
          ].map(({ to, title, desc, relation, color }) => (
            <Box
              key={to}
              component={Link}
              to={to}
              sx={{
                bgcolor: t.bgPrimary,
                borderRadius: `${tokens.radius.lg}px`,
                border: `1.5px solid ${t.borderDefault}`,
                overflow: "hidden",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:hover": {
                  borderColor: color,
                  boxShadow: `0 4px 20px ${color}18`,
                },
              }}
            >
              <Box sx={{ height: 4, bgcolor: color }} />
              <Box
                sx={{
                  p: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: `${tokens.spacing[12]}px`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.lg,
                    fontWeight: 700,
                    color: t.textPrimary,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: tokens.fontSize.sm,
                    color: t.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </Typography>
                <Box
                  sx={{
                    bgcolor: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: `${tokens.radius.md}px`,
                    px: `${tokens.spacing[12]}px`,
                    py: `${tokens.spacing[10]}px`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.xs,
                      fontWeight: 600,
                      color,
                      mb: "4px",
                    }}
                  >
                    실무 연결
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: tokens.fontSize.xs,
                      color: t.textSecondary,
                      lineHeight: 1.7,
                    }}
                  >
                    {relation}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
