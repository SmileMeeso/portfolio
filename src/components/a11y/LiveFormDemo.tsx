import { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { tokens } from "../../theme/theme";
import type { TokensColor } from "../../theme/theme";

/** 시각적으로만 감추고 접근성 트리에는 남긴다 (display:none 은 스크린리더에서도 사라진다) */
const srOnly = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

/** OS 별 스크린리더 실행 방법. 설치가 필요 없는 기본 도구를 먼저 둔다. */
const screenReaders = [
  {
    os: "macOS",
    name: "VoiceOver",
    keys: "⌘ + F5",
    note: "기본 내장 — 같은 키로 끕니다",
  },
  {
    os: "Windows",
    name: "내레이터",
    keys: "Ctrl + Win + Enter",
    note: "기본 내장 — 같은 키로 끕니다",
  },
  {
    os: "Windows",
    name: "NVDA",
    keys: "Ctrl + Alt + N",
    note: "nvaccess.org 에서 무료 설치 · 끄기는 Insert + Q",
  },
];

export default function LiveFormDemo({ t }: { t: TokensColor }) {
  const inputSx = {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: tokens.fontSize.sm,
    color: t.textPrimary,
    bgcolor: t.bgSurface,
    border: `1px solid ${t.borderDefault}`,
    borderRadius: `${tokens.radius.sm}px`,
    px: "10px",
    py: "8px",
    outline: "none",
    "&:focus-visible": { outline: "3px solid #FBBF24", outlineOffset: "2px" },
  };
  const submitSx = {
    fontFamily: "inherit",
    fontSize: tokens.fontSize.sm,
    fontWeight: 600,
    color: "#fff",
    bgcolor: t.accentPurple,
    border: "none",
    borderRadius: `${tokens.radius.sm}px`,
    px: `${tokens.spacing[20]}px`,
    py: "8px",
    cursor: "pointer",
    alignSelf: "flex-start",
    outline: "none",
    "&:focus-visible": { outline: "3px solid #FBBF24", outlineOffset: "2px" },
    "&:hover": { opacity: 0.9 },
  };

  // Before
  const [bName, setBName] = useState("");
  const [bGender, setBGender] = useState("");
  const [bError, setBError] = useState("");

  // After
  const [aName, setAName] = useState("");
  const [aGender, setAGender] = useState("");
  const [aStatus, setAStatus] = useState<{
    ok: boolean;
    msg: string;
    field?: "name" | "gender";
  } | null>(null);
  const aNameRef = useRef<HTMLInputElement>(null);

  function submitBefore(e: React.FormEvent) {
    e.preventDefault();
    if (!bName.trim()) return setBError("이름을 입력해주세요");
    if (!bGender) return setBError("성별을 선택해주세요");
    setBError("");
  }

  function submitAfter(e: React.FormEvent) {
    e.preventDefault();
    if (!aName.trim()) {
      setAStatus({ ok: false, msg: "이름을 입력해주세요", field: "name" });
      aNameRef.current?.focus(); // 에러가 난 필드로 포커스를 옮겨준다
      return;
    }
    if (!aGender) {
      setAStatus({ ok: false, msg: "성별을 선택해주세요", field: "gender" });
      return;
    }
    setAStatus({ ok: true, msg: "제출되었습니다" });
  }

  // 에러 메시지는 그 에러가 난 필드에만 연결한다.
  // 모든 필드를 같은 메시지에 묶으면 이름 입력의 설명이 "성별을 선택해주세요"가 된다.
  const nameInvalid = aStatus?.ok === false && aStatus.field === "name";
  const genderInvalid = aStatus?.ok === false && aStatus.field === "gender";

  return (
    <>
      <Typography
        sx={{
          fontSize: tokens.fontSize.sm,
          color: t.textSecondary,
          lineHeight: 1.7,
        }}
      >
        아래 두 폼은 눈으로 보면 거의 같지만 스크린리더로 들으면 다릅니다. 켜고
        Tab 으로 이동하며 비교해보세요. 빈 값으로 제출하면 차이가 가장 크게
        드러납니다 — 왼쪽은 에러가 떠도 아무 말이 없고, 오른쪽은 즉시
        낭독됩니다.
      </Typography>

      {/* 스크린리더 실행 방법 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${tokens.spacing[8]}px`,
          bgcolor: t.bgSurface,
          border: `1px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.md}px`,
          p: `${tokens.spacing[16]}px`,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontSize: tokens.fontSize.sm,
            fontWeight: 700,
            color: t.textPrimary,
          }}
        >
          스크린리더 켜는 법
        </Typography>

        {screenReaders.map((sr) => (
          <Box
            key={`${sr.os}-${sr.name}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${tokens.spacing[10]}px`,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 62,
                textAlign: "center",
                bgcolor:
                  sr.os === "macOS" ? t.accentBlueLight : t.accentPurpleLight,
                borderRadius: `${tokens.radius.xs}px`,
                px: "6px",
                py: "2px",
              }}
            >
              <Typography
                sx={{
                  fontSize: tokens.fontSize.xs,
                  fontWeight: 700,
                  color: sr.os === "macOS" ? t.accentBlue : t.accentPurple,
                }}
              >
                {sr.os}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.textPrimary,
                minWidth: 72,
              }}
            >
              {sr.name}
            </Typography>
            <Box
              component="kbd"
              sx={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: tokens.fontSize.xs,
                bgcolor: t.bgPrimary,
                border: `1px solid ${t.borderDefault}`,
                borderRadius: `${tokens.radius.xs}px`,
                px: "6px",
                py: "2px",
                color: t.textPrimary,
                whiteSpace: "nowrap",
              }}
            >
              {sr.keys}
            </Box>
            <Typography
              sx={{ fontSize: tokens.fontSize.xs, color: t.textTertiary }}
            >
              {sr.note}
            </Typography>
          </Box>
        ))}

        <Typography
          sx={{
            fontSize: tokens.fontSize.xs,
            color: t.textSecondary,
            lineHeight: 1.6,
            mt: `${tokens.spacing[4]}px`,
          }}
        >
          처음 켜면 화면 전체를 읽기 시작해 당황할 수 있습니다. 낭독을 멈추려면
          Ctrl 을 한 번 누르고, 끌 때는 켤 때와 같은 단축키를 쓰면 됩니다.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: `${tokens.spacing[20]}px`,
          flexWrap: "wrap",
        }}
      >
        {/*  Before  */}
        <Box
          sx={{
            flex: "1 1 320px",
            bgcolor: t.bgPrimary,
            borderRadius: `${tokens.radius.md}px`,
            border: `1px solid ${t.borderDefault}`,
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: 4, bgcolor: t.accentRed }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${tokens.spacing[8]}px`,
              px: `${tokens.spacing[20]}px`,
              py: `${tokens.spacing[16]}px`,
            }}
          >
            <CloseIcon sx={{ fontSize: 16, color: t.accentRed }} />
            <Typography
              component="h3"
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.accentRed,
              }}
            >
              Before — 접근성 없는 폼
            </Typography>
          </Box>

          <Box
            component="form"
            noValidate
            onSubmit={submitBefore}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[12]}px`,
              px: `${tokens.spacing[20]}px`,
              pb: `${tokens.spacing[20]}px`,
            }}
          >
            {/*
              라벨처럼 보이지만 <label> 도 아니고 htmlFor 연결도 없는 그냥 텍스트다.
              화면상으로는 오른쪽 폼과 똑같이 "이름 *" 이 보이지만
              스크린리더는 이 입력의 이름을 알 수 없다.
              빨간 * 도 색상뿐이라 색을 구분하지 못하면 필수인지 알 수 없다.
            */}
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.textPrimary,
              }}
            >
              이름
              <Box component="span" sx={{ color: t.accentRed }}>
                {" *"}
              </Box>
            </Typography>
            <Box
              component="input"
              type="text"
              placeholder="이름을 입력하세요"
              value={bName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBName(e.target.value)
              }
              sx={inputSx}
            />

            {/* fieldset/legend 없이 나열 — 무슨 질문인지 전달되지 않는다 */}
            <Typography
              sx={{
                fontSize: tokens.fontSize.sm,
                color: t.textPrimary,
                fontWeight: 600,
              }}
            >
              성별{" "}
              <Box component="span" sx={{ color: t.accentRed }}>
                *
              </Box>
            </Typography>
            <Box sx={{ display: "flex", gap: `${tokens.spacing[16]}px` }}>
              {["남성", "여성"].map((g) => (
                <Box
                  key={g}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {/* label 연결이 없어 클릭 영역도 좁고 낭독도 되지 않는다 */}
                  <Box
                    component="input"
                    type="radio"
                    name="before-gender"
                    checked={bGender === g}
                    onChange={() => setBGender(g)}
                  />
                  <Typography
                    sx={{ fontSize: tokens.fontSize.sm, color: t.textPrimary }}
                  >
                    {g}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box component="button" type="submit" sx={submitSx}>
              제출
            </Box>

            {/*
              라이브 영역이 아닌 그냥 빨간 텍스트다.
              화면에는 보이지만 스크린리더는 아무 말도 하지 않는다.
              색상 외에 아이콘 같은 다른 단서도 없다.
            */}
            <Box
              sx={{
                minHeight: 20,
                display: "flex",
                alignItems: "center",
                fontSize: tokens.fontSize.sm,
                color: t.accentRed,
              }}
            >
              {bError}
            </Box>
          </Box>
        </Box>

        {/*  After  */}
        <Box
          sx={{
            flex: "1 1 320px",
            bgcolor: t.bgPrimary,
            borderRadius: `${tokens.radius.md}px`,
            border: `1px solid ${t.borderDefault}`,
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: 4, bgcolor: t.accentGreen }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${tokens.spacing[8]}px`,
              px: `${tokens.spacing[20]}px`,
              py: `${tokens.spacing[16]}px`,
            }}
          >
            <CheckIcon sx={{ fontSize: 16, color: t.accentGreen }} />
            <Typography
              component="h3"
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.accentGreen,
              }}
            >
              After — 개선한 폼
            </Typography>
          </Box>

          <Box
            component="form"
            noValidate
            onSubmit={submitAfter}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[12]}px`,
              px: `${tokens.spacing[20]}px`,
              pb: `${tokens.spacing[20]}px`,
            }}
          >
            <Box
              component="label"
              htmlFor="sr-name"
              sx={{
                fontSize: tokens.fontSize.sm,
                fontWeight: 600,
                color: t.textPrimary,
              }}
            >
              이름
              {/* 시각 기호는 감추고, 낭독용 텍스트를 따로 둔다 */}
              <Box
                component="span"
                aria-hidden="true"
                sx={{ color: t.accentRed }}
              >
                {" *"}
              </Box>
              <Box component="span" sx={srOnly}>
                (필수)
              </Box>
            </Box>
            <Box
              component="input"
              id="sr-name"
              ref={aNameRef}
              type="text"
              value={aName}
              required
              aria-required="true"
              aria-invalid={nameInvalid}
              aria-describedby={nameInvalid ? "sr-form-status" : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAName(e.target.value)
              }
              sx={{
                ...inputSx,
                borderColor: nameInvalid ? t.accentRed : t.borderDefault,
              }}
            />

            {/* fieldset + legend 로 그룹의 의미를 전달한다 */}
            <Box
              component="fieldset"
              aria-describedby={genderInvalid ? "sr-form-status" : undefined}
              sx={{
                m: 0,
                p: 0,
                border: "none",
                display: "flex",
                flexDirection: "column",
                // 두 폼의 세로 리듬을 맞춰 시각 차이가 아니라 시맨틱 차이만 남긴다
                gap: `${tokens.spacing[12]}px`,
              }}
            >
              <Box
                component="legend"
                sx={{
                  p: 0,
                  fontSize: tokens.fontSize.sm,
                  fontWeight: 600,
                  color: t.textPrimary,
                }}
              >
                성별
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{ color: t.accentRed }}
                >
                  {" *"}
                </Box>
                <Box component="span" sx={srOnly}>
                  (필수)
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: `${tokens.spacing[16]}px` }}>
                {["남성", "여성"].map((g) => {
                  const id = `sr-gender-${g}`;
                  return (
                    <Box
                      key={g}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Box
                        component="input"
                        id={id}
                        type="radio"
                        name="after-gender"
                        checked={aGender === g}
                        onChange={() => setAGender(g)}
                      />
                      {/* htmlFor 로 연결 — 라벨 클릭으로도 선택되고 낭독도 된다 */}
                      <Box
                        component="label"
                        htmlFor={id}
                        sx={{
                          fontSize: tokens.fontSize.sm,
                          color: t.textPrimary,
                          cursor: "pointer",
                        }}
                      >
                        {g}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box component="button" type="submit" sx={submitSx}>
              제출
            </Box>

            {/*
              핵심: 라이브 영역은 항상 DOM 에 있어야 한다.
              에러가 생길 때 요소를 새로 mount 하면 대부분의 스크린리더가 낭독하지 않는다.
              여기서는 컨테이너를 늘 렌더링하고 안의 텍스트만 바꾼다.
              role="alert" 이 aria-live="assertive" 를 포함하므로 따로 쓰지 않는다.
            */}
            <Box
              component="p"
              id="sr-form-status"
              role="alert"
              sx={{
                m: 0,
                minHeight: 20,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: tokens.fontSize.sm,
                color: aStatus?.ok ? t.accentGreen : t.accentRed,
              }}
            >
              {aStatus && (
                <>
                  {aStatus.ok ? (
                    <CheckIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <WarningAmberIcon sx={{ fontSize: 16 }} />
                  )}
                  {aStatus.msg}
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
