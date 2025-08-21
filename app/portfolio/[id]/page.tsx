"use client";

import PortfolioDetailPageClient from "@/components/PortfolioDetailPage";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();

  if (!router.isReady) return null; // wait until router is ready

  const id = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  if (!id) return null;

  return <PortfolioDetailPageClient portfolioId={id} />;
}
