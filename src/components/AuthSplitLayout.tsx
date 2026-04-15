import type { ReactNode } from "react";
import { AuthFooter } from "./AuthFooter";

interface AuthSplitLayoutProps {
  children: ReactNode;
}

export const AuthSplitLayout = ({ children }: AuthSplitLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)" }}
      >
        {/* Abstract sculptural art placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Layered geometric shapes for abstract 3D effect */}
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full bg-[#ef3e34] opacity-10 blur-3xl" />
            <div className="absolute top-8 left-8 right-8 bottom-8 rounded-full bg-[#ef3e34] opacity-5 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#ef3e34] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#ef3e34] opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rotate-45 border border-[#ef3e34] opacity-30" />
          </div>
        </div>

        {/* Bottom left brand text */}
        <div className="absolute bottom-10 left-10">
          <p className="[font-family:'Oswald',Helvetica] font-bold text-white text-2xl tracking-widest opacity-20">
            RED DOG RADIOS
          </p>
          <p className="[font-family:'Montserrat',Helvetica] text-[#a6a6a6] text-xs tracking-[2px] mt-1 opacity-40">
            GRANT INTELLIGENCE PLATFORM
          </p>
        </div>
      </div>

      {/* Right white card panel */}
      <div className="flex min-h-screen w-full flex-col items-center justify-between bg-white px-6 pt-5 pb-8 sm:px-8 sm:pt-6 sm:pb-10 lg:w-1/2">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start">
          {children}
        </div>
        <AuthFooter />
      </div>
    </div>
  );
};
