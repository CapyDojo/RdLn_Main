// Theme-specific visual configurations
export const getThemeConfigs = (isSelected: boolean) => ({
  'professional': {
    background: 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(226, 232, 240, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(248, 250, 252, 1) 50%, rgba(241, 245, 249, 1) 75%, rgba(226, 232, 240, 1) 100%)',
    textColor: '#3b82f6',
    borderColor: isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'
  },
  'classic-light': {
    background: 'rgba(248, 250, 252, 1)',
    hoverBackground: 'rgba(248, 250, 252, 1)',
    textColor: '#0f172a',
    borderColor: isSelected ? '#f97316' : 'rgba(249, 115, 22, 0.4)'
  },
  'classic-dark': {
    background: 'rgba(38, 38, 38, 1)',
    hoverBackground: 'rgba(38, 38, 38, 1)',
    textColor: '#ffffff',
    borderColor: isSelected ? '#fb923c' : 'rgba(251, 146, 60, 0.4)'
  },
  'bamboo': {
    background: 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)',
    hoverBackground: 'linear-gradient(45deg, rgba(45, 80, 22, 1) 0%, rgba(146, 183, 113, 1) 25%, rgba(113, 155, 81, 1) 63%, rgba(183, 203, 165, 1) 85%, rgba(123, 160, 95, 1) 100%)',
    textColor: '#2C1704',
    borderColor: isSelected ? '#2C1704' : 'rgba(44, 23, 4, 0.5)'
  },
  'kyoto': {
    background: 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)',
    hoverBackground: 'linear-gradient(160deg, rgba(122, 61, 26, 1) 0%, rgba(155, 74, 31, 1) 5%, rgba(197, 90, 17, 1) 10%, rgba(217, 119, 6, 1) 15%, rgba(220, 8, 8, 1) 18%, rgba(173, 76, 16, 1) 27%, rgba(107, 68, 35, 1) 35%, rgba(74, 93, 35, 1) 45%, rgba(58, 77, 31, 1) 55%, rgba(42, 61, 26, 1) 60%, rgba(30, 58, 30, 1) 65%, rgba(87, 69, 12, 1) 70%, rgba(7, 59, 27, 1) 80%, rgba(197, 90, 17, 1) 95%, rgba(186, 101, 3, 1) 100%)',
    textColor: '#E4B5AE',
    borderColor: isSelected ? '#E4B5AE' : 'rgba(228, 181, 174, 0.5)'
  },
  'new-york': {
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)',
    hoverBackground: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 30%, rgba(69, 26, 3, 1) 100%)',
    textColor: '#E9B64B',
    borderColor: isSelected ? '#E9B64B' : 'rgba(233, 182, 75, 0.5)'
  },
  'madripoor': {
    background: 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)',
    hoverBackground: 'linear-gradient(135deg, rgba(5, 5, 8, 1) 0%, rgba(8, 8, 16, 1) 20%, rgba(15, 15, 24, 1) 40%, rgba(139, 92, 246, 1) 60%, rgba(0, 255, 255, 1) 80%, rgba(15, 15, 24, 1) 100%)',
    textColor: '#00ffff',
    borderColor: isSelected ? '#ff00ff' : 'rgba(255, 0, 255, 0.6)'
  },
  'caladan': {
    background: 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)',
    hoverBackground: 'linear-gradient(330deg, rgba(6, 28, 49, 1) 0%, rgba(17, 44, 75, 1) 25%, rgba(26, 53, 96, 1) 63%, rgba(39, 69, 133, 1) 85%, rgba(54, 84, 166, 1) 100%)',
    textColor: '#0ea5e9',
    borderColor: isSelected ? '#0284c7' : 'rgba(2, 132, 199, 0.6)'
  },
  'lothlorien': {
    background: 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
    hoverBackground: 'linear-gradient(330deg, rgba(15, 32, 39, 1) 0%, rgba(21, 46, 54, 1) 25%, rgba(28, 64, 72, 1) 63%, rgba(34, 85, 96, 1) 85%, rgba(44, 106, 120, 1) 100%), radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
    textColor: '#d1fae5',
    borderColor: isSelected ? '#4ade80' : 'rgba(74, 222, 128, 0.5)'
  },
  'svinafellsjokull': {
    background: 'linear-gradient(330deg, rgba(8, 47, 73, 1) 0%, rgba(20, 64, 89, 1) 25%, rgba(34, 87, 122, 1) 63%, rgba(52, 125, 146, 1) 85%, rgba(67, 159, 181, 1) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
    hoverBackground: 'linear-gradient(330deg, rgba(8, 47, 73, 1) 0%, rgba(20, 64, 89, 1) 25%, rgba(34, 87, 122, 1) 63%, rgba(52, 125, 146, 1) 85%, rgba(67, 159, 181, 1) 100%), radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
    textColor: '#a5f3fc',
    borderColor: isSelected ? '#06b6d4' : 'rgba(6, 182, 212, 0.5)'
  },
});