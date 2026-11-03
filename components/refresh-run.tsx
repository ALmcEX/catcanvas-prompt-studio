"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function RefreshRun() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
