import React, {createContext, useState, useContext, ReactNode} from 'react';

// Define the shape of your context state
interface AppState {
  id?: string;
  setId: (id: string) => void; // Make setId required
}

// Create the context with a default value
const AppContext = createContext<AppState>({
  setId: () => {}, // Provide a default no-op function for setId
});

// Create a provider component
export const AppProvider = ({children}: {children: ReactNode}) => {
  const [id, setId] = useState<string | undefined>(undefined);

  return (
    <AppContext.Provider value={{id, setId}}>{children}</AppContext.Provider>
  );
};

// Create a custom hook to use the context
export const useAppContext = () => useContext(AppContext);
