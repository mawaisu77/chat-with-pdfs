import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { SettingsQueryListener } from "@/components/dashboard/SettingsQueryListener";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell>
      <Suspense fallback={null}>
        <SettingsQueryListener />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
