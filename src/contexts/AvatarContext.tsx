import { createContext, useContext, useState, ReactNode } from "react";

interface AvatarContextType {
  lastUpdate: number;
  triggerAvatarUpdate: () => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
};

interface AvatarProviderProps {
  children: ReactNode;
}

export const AvatarProvider = ({ children }: AvatarProviderProps) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const triggerAvatarUpdate = () => {
    setLastUpdate(Date.now());
  };

  const value = {
    lastUpdate,
    triggerAvatarUpdate,
  };

  return (
    <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
  );
};
