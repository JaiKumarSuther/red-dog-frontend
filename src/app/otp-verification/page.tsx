import { Suspense } from "react";
import { OtpVerification } from "@/views/OtpVerification";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OtpVerification />
    </Suspense>
  );
}
