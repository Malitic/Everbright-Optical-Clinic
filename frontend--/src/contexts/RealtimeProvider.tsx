import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RealtimeClient } from '@/services/realtime';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';

const RealtimeContext = createContext<RealtimeClient | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TEMPORARILY DISABLED: Realtime SSE endpoint not yet implemented in backend
  // const queryClient = useQueryClient();
  // const token = sessionStorage.getItem('auth_token') || '';
  // const apiBase = API_BASE_URL;

  // const client = useMemo(() => new RealtimeClient(apiBase, token, queryClient as unknown as QueryClient), [apiBase, token, queryClient]);

  // useEffect(() => {
  //   if (!token) return;
  //   client.connect();
  //   return () => client.disconnect();
  // }, [client, token]);

  return (
    <RealtimeContext.Provider value={null}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);



