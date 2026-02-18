import React from 'react';
import { NavigationContext, NavigationParams, ScreenName } from './NavigationContext';

export const MemoryNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = React.useState<ScreenName>('login');
  const [params, setParams] = React.useState<NavigationParams>({});

  const navigate = React.useCallback((next: ScreenName, nextParams: NavigationParams = {}) => {
    setScreen(next);
    setParams(nextParams);
  }, []);

  return (
    <NavigationContext.Provider value={{ screen, params, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};
