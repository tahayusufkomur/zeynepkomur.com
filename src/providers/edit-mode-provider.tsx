"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type EditModeContextType = {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
};

const EditModeContext = createContext<EditModeContextType>({
  isEditing: false,
  setIsEditing: () => {},
});

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <EditModeContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
