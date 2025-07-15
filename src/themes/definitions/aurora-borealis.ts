import { ThemeConfig } from '../../types/theme';

export const auroraBorealisTheme: ThemeConfig = {
  name: 'aurora-borealis',
  displayName: 'Aurora Borealis',
  description: 'A mesmerizing theme inspired by the northern lights',
  background: 'linear-gradient(#0a0e17, #0a0e17)',
  animation: 'aurora 84s infinite linear',
  animationStyles: `
    [data-theme="aurora-borealis"] body {
      animation: var(--theme-animation);
      min-height: 100vh;
    }
    
    @keyframes aurora {
      ${Array.from({length: 3001}, (_, i) => {
        const progress = i/3000;
        const angle = progress * Math.PI * 2;
        
        const noise = (x: number) => Math.sin(x * 1.5) * Math.cos(x * 2.3);
        
        const x1 = 30 + 40 * Math.sin(angle * 0.7 + noise(angle * 0.3));
        const y1 = 5 + 5 * noise(angle * 0.5);
        const x2 = 70 + 30 * Math.sin(angle * 0.9 + 1 + noise(angle * 0.4));
        const y2 = 10 + 5 * noise(angle * 0.6);
        
        const opacity = 0.4 + 0.2 * Math.sin(angle * 2) + 0.1 * noise(angle * 3);
        const colorBlend = Math.sin(angle * 0.3) * 0.5 + 0.5;
        
        return `${(i/30).toFixed(2)}% {
          background: 
            linear-gradient(#0a0e17, #0a0e17),
            radial-gradient(
              ellipse at ${x1}% ${y1}%, 
              rgba(100, 255, 218, ${opacity.toFixed(3)}), 
              rgba(${Math.floor(100 + 155 * colorBlend)}, ${Math.floor(255 - 50 * colorBlend)}, ${Math.floor(218 - 100 * colorBlend)}, ${(opacity * 0.7).toFixed(3)}) 50%, 
              transparent 80%
            ),
            radial-gradient(
              ellipse at ${x2}% ${y2}%, 
              rgba(255, 105, 180, ${(opacity * 0.9).toFixed(3)}), 
              rgba(${Math.floor(255 - 50 * colorBlend)}, ${Math.floor(165 + 50 * colorBlend)}, ${Math.floor(50 + 100 * colorBlend)}, ${(opacity * 0.6).toFixed(3)}) 50%, 
              transparent 80%
            );
          background-size: auto, 200% 200%, 200% 200%;
          background-blend-mode: overlay, screen;
        }`;
      }).join('\n')}
    }
  `,
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
