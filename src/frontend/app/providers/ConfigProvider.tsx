'use client';

import React, { createContext, useContext } from 'react';

export type Config = {
  apiHost: string;
  apiProtocol: string;
  apiPort: string;
  get apiUrl(): string;
};

const ConfigContext = createContext<Config | null>(null);

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('ConfigProvider is missing');
  return ctx;
}

export function ConfigProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: Config;
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
