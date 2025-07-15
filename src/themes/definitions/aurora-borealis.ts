import { ThemeConfig } from '../../types/theme';

export const auroraBorealisTheme: ThemeConfig = {
  name: 'aurora-borealis',
  displayName: 'Aurora Borealis',
  description: 'Northern lights inspired theme with vibrant purples, blues and greens',
  background: 'linear-gradient(135deg, #0f0524 0%, #1a0933 20%, #1e3799 40%, #38ada9 60%, #78e08f 80%, #b8e994 100%)',
  colors: {
    primary: {
      50: '#e0f7fa',
      100: '#b2ebf2',
      200: '#80deea',
      300: '#4dd0e1',
      400: '#26c6da',
      500: '#38ada9',
      600: '#00838f',
      700: '#006064',
      800: '#004d40',
      900: '#00251a',
    },
    secondary: {
      50: '#f3e5f5',
      100: '#e1bee7',
      200: '#ce93d8',
      300: '#ba68c8',
      400: '#ab47bc',
      500: '#1e3799',
      600: '#8e24aa',
      700: '#7b1fa2',
      800: '#6a1b9a',
      900: '#4a148c',
    },
    accent: {
      50: '#f1f8e9',
      100: '#dcedc8',
      200: '#c5e1a5',
      300: '#aed581',
      400: '#9ccc65',
      500: '#b8e994',
      600: '#7cb342',
      700: '#689f38',
      800: '#558b2f',
      900: '#33691e',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    }
  }
};
