import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/Button";

export function AuthControls() {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <Button variant="accent" size="sm">
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 ring-2 ring-brand-border ring-offset-2 ring-offset-background",
            },
          }}
        />
      </Show>
    </div>
  );
}
