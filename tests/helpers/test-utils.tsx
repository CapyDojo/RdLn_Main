import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { FontSizeProvider } from '../src/contexts/FontSizeContext';
import { ExperimentalLayoutProvider } from '../src/contexts/ExperimentalLayoutContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <ExperimentalLayoutProvider>{children}</ExperimentalLayoutProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
