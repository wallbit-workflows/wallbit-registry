import { redirect } from "next/navigation";

/** Sign-up uses the same /sign-in route (Clerk transfer + modal on navbar). */
export default function SignUpPage() {
  redirect("/sign-in");
}
