import { createContext, ReactNode, useContext, useState } from 'react';

const LastChatContext = createContext<{ lastChatId: string; setLastChatId: (id: string) => void }>({
  lastChatId: '',
  setLastChatId: () => {},
});

export function LastChatProvider({ children }: { children: ReactNode }) {
  const [lastChatId, setLastChatId] = useState('');
  return <LastChatContext.Provider value={{ lastChatId, setLastChatId }}>{children}</LastChatContext.Provider>;
}

export function useLastChat() {
  return useContext(LastChatContext);
}
