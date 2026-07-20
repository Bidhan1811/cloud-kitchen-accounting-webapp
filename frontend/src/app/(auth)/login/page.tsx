"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthContext } from "@/providers/AuthProvider";
import apiClient from "@/lib/axios";
import { cn } from "@/utils/cn";

const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiClient.post("/auth/login", data);
      const { token, user } = response.data.data;
      login(token, user);
      // Also set cookie for middleware
      document.cookie = `rr_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      toast.success(`Welcome back, ${user.name}! 🍛`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Invalid credentials. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <motion.div
      className="glass-modal w-full max-w-[400px] p-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-[16px] bg-[#C8873A] flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(200,135,58,0.35)]">
          <span className="text-3xl">🍛</span>
        </div>
        <h1 className="font-display text-[26px] font-[600] text-[#1C1410] text-center leading-[1.2]">
          Restro Rasoi
        </h1>
        <p className="text-[12px] text-[#9E8E80] text-center mt-[3px]">Cloud Kitchen Management</p>
        <p className="font-display text-[20px] font-[600] text-[#1C1410] text-center mt-5">Welcome Back</p>
        <p className="text-[13px] text-[#6B5D50] text-center mt-[3px]">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Username"
          placeholder="e.g. adminRestroRasoi"
          leftIcon={<User size={16} />}
          error={errors.username?.message}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          spellCheck={false}
          {...register("username")}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          leftIcon={<Lock size={16} />}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="current-password"
          spellCheck={false}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="text-[#9E8E80] hover:text-[#1C1410] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />



        <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-2">
          Sign In
        </Button>
      </form>

      <p className="text-center text-[11px] text-[#9E8E80] mt-6">
        © 2025 Restro Rasoi. All rights reserved.
      </p>
    </motion.div>
  );
}
