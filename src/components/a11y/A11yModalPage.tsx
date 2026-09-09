import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import CodeIcon from '@mui/icons-material/Code'
import { tokens } from '../../theme/theme'
import type { TokensColor } from '../../theme/theme'

function A11yBadge({ t }: { t: TokensColor }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: `${tokens.spacing[6]}px`,
      bgcolor: t.accentPurpleLight,
      borderRadius: `${tokens.radius.full}px`,
      px: '14px', py: `${tokens.spacing[6]}px`,
    }}>
      <AccessibilityNewIcon sx={{ fontSize: 16, color: t.accentPurple }} />
      <Typography sx={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: t.accentPurple }}>접근성</Typography>
    </Box>
  )
}

function SectionCard({ title, children, t }: { title: string; children: React.ReactNode; t: TokensColor }) {
  return (
    <Box sx={{
      width: '100%', maxWidth: 1280,
      bgcolor: t.bgPrimary,
      borderRadius: `${tokens.radius.lg}px`,
      border: `1.5px solid ${t.borderDefault}`,
      p: '28px',
      display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[20]}px`,
    }}>
      <Typography component="h2" sx={{ fontSize: tokens.fontSize.xl, fontWeight: 700, color: t.textPrimary }}>{title}</Typography>
      {children}
    </Box>
  )
}

/** 모달 미리보기 (절대 위치 다이얼로그) */
function MockModal({
  dialogBorder,
  annotationText,
  annotationColor,
  t,
}: {
  dialogBorder: string
  annotationText: string
  annotationColor: string
  t: TokensColor
}) {
  return (
    <Box sx={{
      position: 'relative',
      bgcolor: '#F1F5F9',
      borderRadius: `${tokens.radius.sm}px`,
      height: 191,
      width: '100%',
      overflow: 'hidden',
    }}>
      {/* 떠 있는 다이얼로그 */}
      <Box sx={{
        position: 'absolute',
        top: 20, left: '50%', transform: 'translateX(-50%)',
        width: 240,
        bgcolor: t.bgPrimary,
        borderRadius: `${tokens.radius.md}px`,
        border: dialogBorder,
        p: '16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        boxShadow: `0px 4px 16px ${t.shadowColor}`,
      }}>
        <Typography sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.textPrimary }}>삭제 확인</Typography>
        <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary }}>
          이 항목을 삭제하시겠습니까?
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Box sx={{
            borderRadius: `${tokens.radius.sm}px`,
            border: `1px solid ${t.borderDefault}`,
            px: '12px', py: '6px',
          }}>
            <Typography sx={{ fontSize: tokens.fontSize.xs, color: t.textPrimary }}>취소</Typography>
          </Box>
          <Box sx={{
            borderRadius: `${tokens.radius.sm}px`,
            bgcolor: t.accentRed,
            px: '12px', py: '6px',
          }}>
            <Typography sx={{ fontSize: tokens.fontSize.xs, color: '#fff' }}>삭제</Typography>
          </Box>
        </Box>
      </Box>

      {/* 하단 annotation */}
      <Typography sx={{
        position: 'absolute',
        bottom: 16, left: '50%', transform: 'translateX(-50%)',
        fontSize: tokens.fontSize.xs,
        fontWeight: 600,
        color: annotationColor,
        whiteSpace: 'nowrap',
      }}>
        {annotationText}
      </Typography>
    </Box>
  )
}

const badPoints = [
  'role="dialog" 미사용',
  'aria-modal 속성 없음',
  '포커스 트랩 없음',
  'Esc 키로 닫히지 않음',
  '닫힌 후 포커스 복귀 없음',
]

const goodPoints = [
  'role="dialog" + aria-modal="true"',
  'aria-labelledby로 제목 연결',
  '포커스 트랩으로 모달 내 순환',
  'Esc 키로 모달 닫기 지원',
  '닫힌 후 트리거 요소로 포커스 복귀',
]

export default function A11yModalPage() {
  const theme = useTheme()
  const t = theme.palette.tokens.color

  const requirements = [
    {
      icon: <LockIcon sx={{ fontSize: 24, color: t.accentPurple }} />,
      title: 'Focus Trap',
      desc: '모달이 열리면 포커스가 모달 내부에서만 순환하도록 제한합니다',
    },
    {
      icon: <KeyboardIcon sx={{ fontSize: 24, color: t.accentPurple }} />,
      title: 'Keyboard Support',
      desc: 'Esc로 닫기, Tab으로 이동, Enter로 실행 등 키보드 조작을 지원합니다',
    },
    {
      icon: <CodeIcon sx={{ fontSize: 24, color: t.accentPurple }} />,
      title: 'ARIA Attributes',
      desc: 'role, aria-modal, aria-labelledby 등으로 스크린 리더에 의미를 전달합니다',
    },
  ]

  return (
    <Box sx={{ bgcolor: t.bgSurface, minHeight: 'calc(100vh - 64px)' }}>
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: `${tokens.spacing[40]}px`,
        px: `${tokens.spacing[80]}px`, py: `${tokens.spacing[48]}px`,
      }}>

        {/* 헤더 */}
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: `${tokens.spacing[16]}px`,
          width: '100%', maxWidth: 1280,
        }}>
          <A11yBadge t={t} />
          <Typography component="h1" sx={{ fontSize: tokens.fontSize['3xl'], fontWeight: 700, color: t.textPrimary }}>
            모달 접근성
          </Typography>
          <Typography sx={{ fontSize: tokens.fontSize.md, color: t.textSecondary, textAlign: 'center', maxWidth: 600 }}>
            다이얼로그가 열렸을 때 키보드와 스크린 리더 사용자를 위한 접근성 패턴을 소개합니다
          </Typography>
        </Box>

        {/* Section: 잘못된 모달 vs 올바른 모달 */}
        <SectionCard title="잘못된 모달 vs 올바른 모달" t={t}>
          <Box sx={{ display: 'flex', gap: `${tokens.spacing[20]}px` }}>

            {/* Bad Modal */}
            <Box sx={{
              flex: 1,
              bgcolor: t.bgPrimary,
              borderRadius: `${tokens.radius.md}px`,
              border: `1px solid ${t.borderDefault}`,
              overflow: 'hidden',
            }}>
              <Box sx={{ height: 4, bgcolor: t.accentRed }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px`, px: `${tokens.spacing[20]}px`, py: `${tokens.spacing[16]}px` }}>
                <CancelIcon sx={{ fontSize: 20, color: t.accentRed }} />
                <Typography sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.accentRed }}>Bad Modal</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[16]}px`, px: `${tokens.spacing[20]}px`, pb: `${tokens.spacing[20]}px` }}>
                <MockModal
                  dialogBorder={`1px solid ${t.borderDefault}`}
                  annotationText="포커스가 배경으로 이탈!"
                  annotationColor={t.accentRed}
                  t={t}
                />
                {badPoints.map((text) => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px` }}>
                    <CloseIcon sx={{ fontSize: 16, color: t.accentRed, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textPrimary }}>{text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Good Modal */}
            <Box sx={{
              flex: 1,
              bgcolor: t.bgPrimary,
              borderRadius: `${tokens.radius.md}px`,
              border: `1px solid ${t.borderDefault}`,
              overflow: 'hidden',
            }}>
              <Box sx={{ height: 4, bgcolor: t.accentGreen }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px`, px: `${tokens.spacing[20]}px`, py: `${tokens.spacing[16]}px` }}>
                <CheckCircleIcon sx={{ fontSize: 20, color: t.accentGreen }} />
                <Typography sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.accentGreen }}>Good Modal</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[16]}px`, px: `${tokens.spacing[20]}px`, pb: `${tokens.spacing[20]}px` }}>
                <MockModal
                  dialogBorder={`2px solid ${t.accentGreen}`}
                  annotationText="포커스가 모달 안에 갇힘"
                  annotationColor={t.accentGreen}
                  t={t}
                />
                {goodPoints.map((text) => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px` }}>
                    <CheckIcon sx={{ fontSize: 16, color: t.accentGreen, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textPrimary }}>{text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>
        </SectionCard>

        {/* Section: 올바른 모달의 3가지 필수 요소 */}
        <SectionCard title="올바른 모달의 3가지 필수 요소" t={t}>
          <Box sx={{ display: 'flex', gap: `${tokens.spacing[20]}px` }}>
            {requirements.map((req) => (
              <Box key={req.title} sx={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: `${tokens.spacing[12]}px`,
                bgcolor: t.bgSurface,
                borderRadius: `${tokens.radius.md}px`,
                p: `${tokens.spacing[24]}px`,
              }}>
                <Box sx={{
                  width: 48, height: 48,
                  borderRadius: `${tokens.radius.full}px`,
                  bgcolor: t.accentPurpleLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {req.icon}
                </Box>
                <Typography sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.textPrimary, textAlign: 'center' }}>
                  {req.title}
                </Typography>
                <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary, textAlign: 'center' }}>
                  {req.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>

      </Box>
    </Box>
  )
}
