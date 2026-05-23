import { Suspense } from "react";
import { AuthModalLauncher } from "@/components/auth-modal-launcher";
import { SiteHeader } from "@/components/site-header";

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="min-h-[calc(100dvh-4rem)] bg-cloud-canvas" />}>
        <AuthModalLauncher mode="sign-up" />
      </Suspense>
    </>
  );
}
