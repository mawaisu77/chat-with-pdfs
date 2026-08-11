import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function UserProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 py-10">
      <UserProfile routing="path" path="/user-profile" />
    </main>
  );
}
