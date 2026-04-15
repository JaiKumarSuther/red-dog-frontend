import { redirect } from "next/navigation";

export default function OutboxRedirectPage() {
  redirect("/dashboard");
}
