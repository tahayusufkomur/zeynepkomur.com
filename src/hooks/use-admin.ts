"use client";

import { useSession } from "next-auth/react";
import { useEditMode } from "@/providers/edit-mode-provider";

export function useAdmin() {
  const { data: session, status } = useSession();
  const { isEditing } = useEditMode();
  return {
    isAdmin: !!session?.user,
    isEditing: !!session?.user && isEditing,
    isLoading: status === "loading",
    session,
  };
}
