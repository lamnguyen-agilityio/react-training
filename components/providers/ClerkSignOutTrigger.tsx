"use client";

/**
 * Chỉ import file này khi đã chắc chắn nằm trong <ClerkProvider>.
 * Tự động gọi signOut() khi mount, rồi gọi onDone().
 */

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

interface Props {
  onDone: () => void;
}

export function ClerkSignOutTrigger({ onDone }: Props) {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut().then(onDone);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
