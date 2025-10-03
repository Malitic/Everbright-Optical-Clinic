import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RealtimeClient } from '@/services/realtime';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

const RealtimeContext = createContext<RealtimeClient | null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const token = sessionStorage.getItem('auth_token') || '';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const client = useMemo(() => new RealtimeClient(apiBase, token, queryClient as unknown as QueryClient), [apiBase, token, queryClient]);

  useEffect(() => {
    if (!token) return;
    client.connect();
    return () => client.disconnect();
  }, [client, token]);

  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);



