import { Box, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { useTheme } from '@mui/material/styles'
import MemoryIcon from '@mui/icons-material/Memory'
import LayersIcon from '@mui/icons-material/Layers'
import { tokens, type TokensColor } from '../theme/theme'

export default function WelcomePage() {
  const theme = useTheme()
  const t = theme.palette.tokens.color

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        background: `radial-gradient(150% 150% at 50% 50%, #DBEAFE44 0%, transparent 100%)`,
        px: `${tokens.spacing[48]}px`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${tokens.spacing[40]}px`,
          width: '100%',
        }}
      >
        {/* 배지 */}
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: `${tokens.spacing[8]}px`,
            bgcolor: t.accentBlueLight, borderRadius: tokens.radius.full,
            px: `${tokens.spacing[16]}px`, py: `${tokens.spacing[6]}px`,
          }}
        >
          <Typography sx={{ fontSize: 16 }}>👋</Typography>
          <Typography sx={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: t.accentBlue }}>
            안녕하세요
          </Typography>
        </Box>

        {/* 타이틀 블록 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${tokens.spacing[16]}px` }}>
          <Typography
            component="h1"
            sx={{
              fontSize: tokens.fontSize['4xl'],
              fontWeight: 700,
              color: t.textPrimary,
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: -1,
              maxWidth: 700,
            }}
          >
            smile-portfolio에{'\n'}오신 것을 환영합니다
          </Typography>
          <Typography
            sx={{
              fontSize: tokens.fontSize.lg,
              color: t.textSecondary,
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            최신 웹 기술을 활용한 데모와 실험들을 만나보세요.{'\n'}
            WebAssembly, 렌더링 전략 비교 등 다양한 주제를 다룹니다.
          </Typography>
        </Box>

        {/* 버튼 행 */}
        <Box sx={{ display: 'flex', gap: `${tokens.spacing[16]}px` }}>
          <Box
            component={Link}
            to="/image-filter"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: `${tokens.spacing[10]}px`,
              bgcolor: t.accentBlue, color: t.textOnAccent,
              borderRadius: `${tokens.radius.md}px`,
              px: `${28}px`, py: '14px',
              fontWeight: 600, fontSize: tokens.fontSize.md,
              fontFamily: tokens.fontFamily,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.88 },
            }}
          >
            <MemoryIcon sx={{ fontSize: 20 }} />
            WebAssembly 데모
          </Box>

          <Box
            component={Link}
            to="/rendering"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: `${tokens.spacing[10]}px`,
              bgcolor: t.bgPrimary, color: t.textPrimary,
              border: `1.5px solid ${t.borderDefault}`,
              borderRadius: `${tokens.radius.md}px`,
              px: `${28}px`, py: '14px',
              fontWeight: 600, fontSize: tokens.fontSize.md,
              fontFamily: tokens.fontFamily,
              textDecoration: 'none',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: t.accentBlue },
            }}
          >
            <LayersIcon sx={{ fontSize: 20 }} />
            렌더링 전략 비교
          </Box>
        </Box>

        {/* 피처 카드 */}
        <Box
          sx={{
            display: 'flex', gap: `${tokens.spacing[20]}px`,
            px: `${tokens.spacing[48]}px`,
            flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          <FeatureCard
            badgeBg={t.accentPurpleLight}
            badgeIcon={<MemoryIcon sx={{ fontSize: 22, color: t.accentPurple }} />}
            title="WebAssembly 이미지 필터"
            desc="JavaScript와 Rust(WASM)의 이미지 처리 성능을 실시간으로 비교해보세요."
            t={t}
          />
          <FeatureCard
            badgeBg={t.accentGreenLight}
            badgeIcon={<LayersIcon sx={{ fontSize: 22, color: t.accentGreen }} />}
            title="렌더링 전략 비교"
            desc="SSG, SSR, ISR 렌더링 전략의 차이를 인터랙티브 데모로 경험해보세요."
            t={t}
          />
        </Box>
      </Box>
    </Box>
  )
}

interface FeatureCardProps {
  badgeBg: string
  badgeIcon: React.ReactNode
  title: string
  desc: string
  t: TokensColor
}

function FeatureCard({ badgeBg, badgeIcon, title, desc, t }: FeatureCardProps) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[12]}px`,
        width: 320, p: `${tokens.spacing[24]}px`,
        bgcolor: t.bgPrimary,
        border: `1.5px solid ${t.borderDefault}`,
        borderRadius: `${tokens.radius.lg}px`,
      }}
    >
      <Box
        sx={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: badgeBg, borderRadius: `${tokens.radius.md}px`,
        }}
      >
        {badgeIcon}
      </Box>
      <Typography sx={{ fontSize: tokens.fontSize.md, fontWeight: 600, color: t.textPrimary }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary, lineHeight: 1.5 }}>
        {desc}
      </Typography>
    </Box>
  )
}
