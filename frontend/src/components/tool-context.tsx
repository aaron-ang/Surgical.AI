import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ToolData {
  tool: string;
  status: string;
  last_seen: string;
}

interface ToolContextType {
  toolData: ToolData[];
  updateToolData: (newData: ToolData[]) => void;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const ToolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toolData, setToolData] = useState<ToolData[]>([]);

  const updateToolData = (newData: ToolData[]) => {
    setToolData(newData);
  };

  return (
    <ToolContext.Provider value={{ toolData, updateToolData }}>
      {children}
    </ToolContext.Provider>
  );
};

export const useToolContext = () => {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
};