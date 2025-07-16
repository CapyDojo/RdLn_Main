import { ThemeConfig } from '../../types/theme';

export const auroraBorealisTheme: ThemeConfig = {
  name: 'aurora-borealis',
  displayName: 'Aurora Borealis',
  description: 'A mesmerizing theme inspired by the northern lights',
  background: 'linear-gradient(#0a0e17, #0a0e17)',
  animation: 'aurora 98.3s infinite linear',
  animationStyles: `
    @keyframes aurora {
      ${Array.from({length: 3000}, (_, i) => {
        const progress = i/3000;
        const angle = progress * Math.PI * 2;
        
        // Use continuous angle for seamless loop
        const continuousAngle = angle;
        
        // Smoother organic variation
        const x1 = 20 + 60 * Math.sin(continuousAngle * 0.5 + Math.sin(continuousAngle * 0.2));
        const y1 = 5 + 5 * Math.cos(continuousAngle * 1.5);
        const x2 = 80 + 60 * Math.sin(continuousAngle * 0.7 + Math.PI + Math.sin(continuousAngle * 0.3));
        const y2 = 5 + 5 * Math.cos(continuousAngle * 1.3 + Math.PI);
        const x3 = 40 + 50 * Math.sin(continuousAngle * 0.9 + Math.sin(continuousAngle * 0.4));
        const y3 = 10 + 8 * Math.cos(continuousAngle * 1.7);
        
        // Dynamic opacity with organic variation
        const baseOpacity = 0.5 + 0.2 * Math.sin(continuousAngle * 2);
        
        // Smoother color progression with blending
        const colorPhase = Math.sin(continuousAngle * 0.3) * 0.5 + 0.5; // Slower phase change
        
        // Color blending between phases
        const teal = `rgba(100, 255, 218, ${(baseOpacity * 0.8).toFixed(3)})`;
        const pink = `rgba(255, 105, 180, ${(baseOpacity * 0.8).toFixed(3)})`;
        const turquoise = `rgba(64, 224, 208, ${(baseOpacity * 0.7).toFixed(3)})`;
        const gold = `rgba(255, 215, 0, ${(baseOpacity * 0.7).toFixed(3)})`;
        
        // Blend colors based on phase
        const color1 = colorPhase > 0.6 ? teal : 
                      colorPhase > 0.4 ? `color-mix(in srgb, ${teal} ${(colorPhase-0.4)*5}, ${pink})` : 
                      pink;
        const color2 = colorPhase > 0.4 ? turquoise : 
                      colorPhase > 0.2 ? `color-mix(in srgb, ${gold} ${(colorPhase-0.2)*5}, ${turquoise})` : 
                      gold;
        
        // Primary color layers with organic distribution
        return `${(i/30).toFixed(2)}% {
          background: 
            linear-gradient(#0a0e17, #0a0e17),
            radial-gradient(ellipse at ${x1}% ${y1}%, 
              ${color1}, 
              ${color1} 30%, 
              transparent 70%),
            radial-gradient(ellipse at ${x2}% ${y2}%, 
              ${color2}, 
              ${color2} 30%, 
              transparent 70%),
            radial-gradient(
              ellipse at ${x3}% ${y3}%, 
              rgba(${colorPhase > 0.5 ? '138, 43, 226' : '255, 105, 180'}, ${(baseOpacity * 0.9).toFixed(3)}), 
              rgba(${colorPhase > 0.5 ? '255, 215, 0' : '64, 224, 208'}, ${(baseOpacity * 0.7).toFixed(3)}) 40%, 
              transparent 80%
            ),
            radial-gradient(
              ellipse 300% 80% at 70% 85%,
              #0a0e17,
              #0a0e17 80%,
              transparent 100%
            );
          background-size: auto, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
          background-blend-mode: overlay, screen, screen, screen, multiply;
        }`;
      }).join('\n')}
    }
    body[data-theme='aurora-borealis'] {
      animation: var(--theme-animation);
      min-height: 100vh;
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
