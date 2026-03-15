import { createTheme } from "@mui/material/styles";

//
// Design Tokens  (smile.pen 디자인 시스템에서 추출)
// styled, sx, 일반 JS 어디서든 import해서 사용 가능
//
export const tokens = {
  color: {
    bgPrimary: "#FFFFFF",
    bgSurface: "#F8FAFC",
    bgElevated: "#FFFFFF",
    bgHighlight: "#EFF6FF",
    bgOverlay: "#00000066",

    textPrimary: "#18181B",
    textSecondary: "#71717A",
    textTertiary: "#A1A1AA",
    textDisabled: "#D4D4D8",
    textOnAccent: "#FFFFFF",

    borderDefault: "#E4E4E7",
    borderFocus: "#2563EB",
    borderLight: "#F4F4F5",

    accentBlue: "#2563EB",
    accentBlueLight: "#DBEAFE",
    accentGreen: "#16A34A",
    accentGreenLight: "#DCFCE7",
    accentOrange: "#EA580C",
    accentOrangeLight: "#FFF7ED",
    accentPurple: "#9333EA",
    accentPurpleLight: "#F3E8FF",
    accentRed: "#DC2626",
    accentRedLight: "#FEE2E2",
    accentYellow: "#CA8A04",
    accentYellowLight: "#FEF9C3",

    shadowColor: "#0000001A",
    shadowColorLg: "#00000012",
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 100,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 36,
    "4xl": 48,
  },
  spacing: {
    2: 2,
    4: 4,
    6: 6,
    8: 8,
    10: 10,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    32: 32,
    40: 40,
    48: 48,
    64: 64,
    80: 80,
  },
  shadow: {
    sm: "0 2px 8px #0000000A",
    md: "0 4px 24px #00000012",
  },
  fontFamily: "'Inter', sans-serif",
} as const;

// 컴포넌트에서 사용할 토큰 색상 타입 (dark theme 오버라이드를 위해 string으로 확장)
export type TokensColor = { [K in keyof typeof tokens.color]: string };
export type Tokens = Omit<typeof tokens, "color"> & { color: TokensColor };

// MUI 팔레트 타입 확장
declare module "@mui/material/styles" {
  interface Palette {
    tokens: Tokens;
  }
  interface PaletteOptions {
    tokens?: Tokens;
  }
}

//
// 공통 컴포넌트 오버라이드 + 타이포그래피
//
const baseOptions = {
  typography: {
    fontFamily: tokens.fontFamily,
    h1: {
      fontSize: tokens.fontSize["4xl"],
      fontWeight: 700,
      letterSpacing: -1,
    },
    h2: {
      fontSize: tokens.fontSize["3xl"],
      fontWeight: 700,
      letterSpacing: -0.5,
    },
    h3: { fontSize: tokens.fontSize["2xl"], fontWeight: 700 },
    h4: { fontSize: tokens.fontSize.xl, fontWeight: 600 },
    h5: { fontSize: tokens.fontSize.lg, fontWeight: 600 },
    h6: { fontSize: tokens.fontSize.md, fontWeight: 600 },
    body1: { fontSize: tokens.fontSize.base },
    body2: { fontSize: tokens.fontSize.sm },
    caption: { fontSize: tokens.fontSize.xs },
    subtitle1: { fontSize: tokens.fontSize.md, fontWeight: 500 },
    subtitle2: { fontSize: tokens.fontSize.sm, fontWeight: 500 },
  },
  shape: {
    borderRadius: tokens.radius.sm,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          textTransform: "none" as const,
          fontWeight: 600,
          fontSize: tokens.fontSize.base,
        },
        sizeLarge: {
          padding: "14px 28px",
          fontSize: tokens.fontSize.md,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.lg,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.full,
          fontFamily: tokens.fontFamily,
        },
      },
    },
  },
} as const;

//
// Light Theme
//
export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: "light",
    primary: { main: tokens.color.accentBlue },
    secondary: { main: tokens.color.accentPurple },
    success: { main: tokens.color.accentGreen },
    error: { main: tokens.color.accentRed },
    warning: { main: tokens.color.accentYellow },
    background: {
      default: tokens.color.bgPrimary,
      paper: tokens.color.bgSurface,
    },
    text: {
      primary: tokens.color.textPrimary,
      secondary: tokens.color.textSecondary,
      disabled: tokens.color.textDisabled,
    },
    divider: tokens.color.borderDefault,
    tokens,
  },
});

//
// Dark Theme
//
export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: "dark",
    primary: { main: tokens.color.accentBlue },
    secondary: { main: tokens.color.accentPurple },
    success: { main: tokens.color.accentGreen },
    error: { main: tokens.color.accentRed },
    warning: { main: tokens.color.accentYellow },
    background: {
      default: "#0F0F11",
      paper: "#1A1A1F",
    },
    text: {
      primary: "#F4F4F5",
      secondary: "#A1A1AA",
      disabled: "#52525B",
    },
    divider: "#27272A",
    tokens: {
      ...tokens,
      color: {
        ...tokens.color,
        bgPrimary: "#0F0F11",
        bgSurface: "#1A1A1F",
        bgElevated: "#1A1A1F",
        bgHighlight: "#1E2A3A",
        textPrimary: "#F4F4F5",
        textSecondary: "#A1A1AA",
        textTertiary: "#71717A",
        textDisabled: "#52525B",
        borderDefault: "#27272A",
        borderLight: "#1A1A1F",
      },
    },
  },
});
