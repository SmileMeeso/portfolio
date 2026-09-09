import { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { tokens } from '../../theme/theme'
import type { TokensColor } from '../../theme/theme'

/** 포커스 트랩이 순환시킬 대상 */
const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** 두 모달의 겉모습을 똑같이 맞춰, 차이가 시각이 아니라 동작에서만 나오게 한다 */
function useModalStyles(t: TokensColor) {
  return {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 1300,
      bgcolor: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: `${tokens.spacing[20]}px`,
    },
    dialog: {
      width: '100%',
      maxWidth: 420,
      bgcolor: t.bgPrimary,
      borderRadius: `${tokens.radius.lg}px`,
      border: `1.5px solid ${t.borderDefault}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      p: `${tokens.spacing[24]}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: `${tokens.spacing[16]}px`,
      outline: 'none',
    },
    title: {
      fontSize: tokens.fontSize.lg,
      fontWeight: 700,
      color: t.textPrimary,
      m: 0,
    },
    desc: {
      fontSize: tokens.fontSize.sm,
      color: t.textSecondary,
      lineHeight: 1.7,
      m: 0,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      fontSize: tokens.fontSize.sm,
      color: t.textPrimary,
      bgcolor: t.bgSurface,
      border: `1px solid ${t.borderDefault}`,
      borderRadius: `${tokens.radius.sm}px`,
      px: '10px',
      py: '8px',
      outline: 'none',
      '&:focus-visible': { outline: '3px solid #FBBF24', outlineOffset: '2px' },
    },
    hint: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      border: `1px dashed ${t.borderDefault}`,
      borderRadius: `${tokens.radius.sm}px`,
      px: `${tokens.spacing[12]}px`,
      py: `${tokens.spacing[10]}px`,
      bgcolor: t.bgSurface,
    },
    hintLabel: {
      fontSize: tokens.fontSize.xs,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      color: t.textTertiary,
    },
    hintText: {
      fontSize: tokens.fontSize.xs,
      lineHeight: 1.7,
      m: 0,
    },
    row: {
      display: 'flex',
      gap: `${tokens.spacing[8]}px`,
      justifyContent: 'flex-end',
    },
    ghostBtn: {
      fontFamily: 'inherit',
      fontSize: tokens.fontSize.sm,
      fontWeight: 600,
      color: t.textSecondary,
      bgcolor: 'transparent',
      border: `1px solid ${t.borderDefault}`,
      borderRadius: `${tokens.radius.sm}px`,
      px: `${tokens.spacing[16]}px`,
      py: '8px',
      cursor: 'pointer',
      outline: 'none',
      '&:focus-visible': { outline: '3px solid #FBBF24', outlineOffset: '2px' },
    },
    solidBtn: {
      fontFamily: 'inherit',
      fontSize: tokens.fontSize.sm,
      fontWeight: 600,
      color: '#fff',
      bgcolor: t.accentPurple,
      border: 'none',
      borderRadius: `${tokens.radius.sm}px`,
      px: `${tokens.spacing[16]}px`,
      py: '8px',
      cursor: 'pointer',
      outline: 'none',
      '&:focus-visible': { outline: '3px solid #FBBF24', outlineOffset: '2px' },
      '&:hover': { opacity: 0.9 },
    },
    trigger: {
      fontFamily: 'inherit',
      fontSize: tokens.fontSize.sm,
      fontWeight: 600,
      borderRadius: `${tokens.radius.sm}px`,
      px: `${tokens.spacing[20]}px`,
      py: '10px',
      cursor: 'pointer',
      outline: 'none',
      '&:focus-visible': { outline: '3px solid #FBBF24', outlineOffset: '2px' },
      '&:hover': { opacity: 0.9 },
    },
  }
}

export default function ModalDemo({ t }: { t: TokensColor }) {
  const s = useModalStyles(t)

  const [badOpen, setBadOpen] = useState(false)
  const [goodOpen, setGoodOpen] = useState(false)
  const goodTriggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 올바른 모달만 가지는 동작: 포커스 이동 · 트랩 · Esc · 배경 스크롤 잠금 · 포커스 복귀
  useEffect(() => {
    if (!goodOpen) return

    // 정리 함수가 도는 시점에 ref 가 바뀌어 있을 수 있으므로 지금 값을 붙잡아 둔다
    const trigger = goodTriggerRef.current
    dialogRef.current?.focus() // 열리면 포커스를 다이얼로그 안으로 옮긴다

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGoodOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => !n.hasAttribute('disabled'))
      if (nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      // 다이얼로그 자신에 포커스가 있을 때 Shift+Tab 하면 배경으로 빠져나가므로 막는다
      if (e.shiftKey && (active === dialog || active === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // 배경 스크롤 잠금

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      trigger?.focus() // 닫으면 열었던 버튼으로 되돌린다
    }
  }, [goodOpen])

  return (
    <>
      <Typography sx={{ fontSize: tokens.fontSize.sm, color: t.textSecondary, lineHeight: 1.7 }}>
        두 모달은 레이아웃도 스타일도 같습니다. 다른 것은 마크업의 의미와 동작뿐입니다.
        직접 열어 <strong>Tab 을 계속 눌러보고</strong>, <strong>Esc 를 눌러보고</strong>,
        닫은 뒤 <strong>다시 Tab 을 눌러보세요</strong>. 각 모달 안에 무엇을 확인하면
        되는지 적어두었습니다.
      </Typography>

      <Box sx={{ display: 'flex', gap: `${tokens.spacing[20]}px`, flexWrap: 'wrap' }}>
        {/*  Bad  */}
        <Box sx={{
          flex: '1 1 280px',
          display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[12]}px`,
          bgcolor: t.bgSurface,
          border: `1px solid ${t.accentRed}40`,
          borderRadius: `${tokens.radius.md}px`,
          p: `${tokens.spacing[20]}px`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px` }}>
            <CancelIcon sx={{ fontSize: 18, color: t.accentRed }} />
            <Typography component="h3" sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.accentRed }}>
              Bad Modal
            </Typography>
          </Box>
          <Typography sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary, lineHeight: 1.6 }}>
            의미 없는 div · 포커스 이동 없음 · 트랩 없음 · Esc 없음 · 복귀 없음
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={() => setBadOpen(true)}
            sx={{ ...s.trigger, color: '#fff', bgcolor: t.accentRed, border: 'none', alignSelf: 'flex-start' }}
          >
            Bad Modal 열기
          </Box>
        </Box>

        {/*  Good  */}
        <Box sx={{
          flex: '1 1 280px',
          display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[12]}px`,
          bgcolor: t.bgSurface,
          border: `1px solid ${t.accentGreen}40`,
          borderRadius: `${tokens.radius.md}px`,
          p: `${tokens.spacing[20]}px`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px` }}>
            <CheckCircleIcon sx={{ fontSize: 18, color: t.accentGreen }} />
            <Typography component="h3" sx={{ fontSize: tokens.fontSize.base, fontWeight: 700, color: t.accentGreen }}>
              Good Modal
            </Typography>
          </Box>
          <Typography sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary, lineHeight: 1.6 }}>
            role=dialog · aria-modal · aria-labelledby · 포커스 트랩 · Esc · 복귀
          </Typography>
          <Box
            component="button"
            type="button"
            ref={goodTriggerRef}
            onClick={() => setGoodOpen(true)}
            sx={{ ...s.trigger, color: '#fff', bgcolor: t.accentGreen, border: 'none', alignSelf: 'flex-start' }}
          >
            Good Modal 열기
          </Box>
        </Box>
      </Box>

      {/*
        Bad — 보조기기 입장에서는 그냥 div 더미다.
        role 도 이름도 없고, 열려도 포커스는 뒤쪽 페이지에 그대로 남아 있다.
        Tab 을 누르면 모달을 통과해 배경 링크로 새어 나간다.
      */}
      {badOpen && (
        <Box sx={s.overlay}>
          <Box sx={s.dialog}>
            {/* 제목이지만 heading 도 아니고 다이얼로그와 연결되지도 않는다 */}
            <Box component="p" sx={{ ...s.title }}>
              구독을 취소할까요?
            </Box>
            <Box component="p" sx={s.desc}>
              취소하면 이번 달 남은 기간까지만 이용할 수 있습니다.
            </Box>
            <Box sx={s.hint}>
              <Box component="span" sx={s.hintLabel}>
                데모 안내
              </Box>
              <Box component="p" sx={{ ...s.hintText, color: t.accentRed }}>
                Tab 을 몇 번 누르면 포커스가 모달을 빠져나가 뒤쪽 페이지로
                넘어갑니다. 모달에 가려 지금 어디에 포커스가 있는지도 보이지
                않습니다. Esc 를 눌러도 닫히지 않고, 닫은 뒤에는 포커스가
                페이지 맨 처음으로 되돌아갑니다.
              </Box>
            </Box>
            <Box component="input" type="email" placeholder="확인용 이메일" sx={s.input} />
            <Box sx={s.row}>
              <Box component="button" type="button" onClick={() => setBadOpen(false)} sx={s.ghostBtn}>
                닫기
              </Box>
              <Box component="button" type="button" onClick={() => setBadOpen(false)} sx={s.solidBtn}>
                구독 취소
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/*
        Good — role="dialog" + aria-modal 로 배경을 가린 대화상자임을 알리고,
        aria-labelledby 로 제목을, aria-describedby 로 설명을 연결한다.
        tabIndex={-1} 은 열릴 때 포커스를 받기 위한 것이지 탭 순서에 넣으려는 게 아니다.
      */}
      {goodOpen && (
        <Box sx={s.overlay}>
          <Box
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="good-modal-title"
            aria-describedby="good-modal-desc"
            tabIndex={-1}
            sx={s.dialog}
          >
            <Box component="h2" id="good-modal-title" sx={s.title}>
              구독을 취소할까요?
            </Box>
            <Box component="p" id="good-modal-desc" sx={s.desc}>
              취소하면 이번 달 남은 기간까지만 이용할 수 있습니다.
            </Box>
            <Box sx={s.hint}>
              <Box component="span" sx={s.hintLabel}>
                데모 안내
              </Box>
              <Box component="p" sx={{ ...s.hintText, color: t.accentGreen }}>
                Tab 을 계속 눌러도 포커스가 모달 안에서만 순환합니다. Esc 를
                누르면 닫히고, 닫히는 순간 포커스는 모달을 열었던 버튼으로
                되돌아갑니다.
              </Box>
            </Box>
            <Box component="label" htmlFor="good-modal-email" sx={{ ...s.desc, fontWeight: 600, color: t.textPrimary }}>
              확인용 이메일
            </Box>
            <Box component="input" id="good-modal-email" type="email" sx={s.input} />
            <Box sx={s.row}>
              <Box component="button" type="button" onClick={() => setGoodOpen(false)} sx={s.ghostBtn}>
                닫기
              </Box>
              <Box component="button" type="button" onClick={() => setGoodOpen(false)} sx={s.solidBtn}>
                구독 취소
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}
