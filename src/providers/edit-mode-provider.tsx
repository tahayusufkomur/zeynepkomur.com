"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type EditModeContextType = {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
};

const EditModeContext = createContext<EditModeContextType>({
  isEditing: false,
  setIsEditing: () => {},
});

const STORAGE_KEY = "admin-edit-mode";

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditingState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsEditingState(true);
  }, []);

  function setIsEditing(v: boolean) {
    setIsEditingState(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  }

  return (
    <EditModeContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
