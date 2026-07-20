import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-[2] min-h-screen flex items-center justify-center p-4">
      {children}
    </div>
  );
}
