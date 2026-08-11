import { SignIn } from "@clerk/nextjs";

import { AppHeader } from "@/components/layout/AppHeader";

export default function SignInPage() {
  return (
    <>
      <AppHeader />
      <main className="relative flex min-h-[calc(100vh-57px)] items-center justify-center overflow-hidden p-6">
        <div className="stars-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="hero-glow absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 bg-sky-400/15"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <SignIn path="/auth/login" routing="path" signUpUrl="/auth/sign-up" />
        </div>
      </main>
    </>
  );
}
