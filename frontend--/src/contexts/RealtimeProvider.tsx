import React, { createContext, useContext } from 'react';

// Using null for now until realtime is implemented
const RealtimeContext = createContext<null>(null);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RealtimeContext.Provider value={null}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);



