"use client";

import { useSession } from "next-auth/react";

export function useAdmin() {
  const { data: session, status } = useSession();
  return {
    isAdmin: !!session?.user,
    isLoading: status === "loading",
    session,
  };
}
