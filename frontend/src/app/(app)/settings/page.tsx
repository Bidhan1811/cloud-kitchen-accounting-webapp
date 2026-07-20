"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, User, ChefHat, Palette, Download, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useAuthContext } from "@/providers/AuthProvider";
import { generateInitials, stringToColor } from "@/utils/strings";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import apiClient from "@/lib/axios";

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  iconBg?: string;
}

function SettingsSection({ icon, title, description, children, iconBg = "rgba(200,135,58,0.12)" }: SettingsSectionProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-[600] text-[#1C1410]">{title}</p>
          <p className="text-[12px] text-[#9E8E80]">{description}</p>
        </div>
      </div>
      {children && <div className="border-t border-[rgba(255,255,255,0.30)] pt-4">{children}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    document.cookie = "rr_token=; path=/; max-age=0";
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get("/reports/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "restro-rasoi-data.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Data exported!");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile */}
        <SettingsSection
          icon={<User size={20} className="text-[#C8873A]" />}
          title="Profile"
          description="Your account information"
        >
          {user && (
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-[700] text-[#C8873A] flex-shrink-0"
                style={{ background: stringToColor(user.name) }}
              >
                {generateInitials(user.name)}
              </div>
              <div>
                <p className="text-[15px] font-[600] text-[#1C1410]">{user.name}</p>
                <Badge variant={user.role as "owner" | "admin"} className="mt-1">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Kitchen Details */}
        <SettingsSection
          icon={<ChefHat size={20} className="text-[#4C9A6E]" />}
          title="Kitchen Details"
          description="Customise name, address and details"
          iconBg="rgba(76,154,110,0.12)"
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[13px] font-[500] text-[#1C1410]">Kitchen Name</p>
                <p className="text-[12px] text-[#9E8E80]">Restro Rasoi</p>
              </div>
              <ChevronRight size={16} className="text-[#9E8E80]" />
            </div>
          </div>
        </SettingsSection>

        {/* Theme */}
        <SettingsSection
          icon={<Palette size={20} className="text-[#6450C8]" />}
          title="Theme"
          description="Customise appearance and preferences"
          iconBg="rgba(100,80,200,0.12)"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-[500] text-[#1C1410]">Interface Theme</p>
              <p className="text-[12px] text-[#9E8E80]">Warm Liquid Glass (Default)</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#C8873A,#fff9f0)] border border-[rgba(200,135,58,0.30)] shadow-sm" />
          </div>
        </SettingsSection>

        {/* Export */}
        <SettingsSection
          icon={<Download size={20} className="text-[#B8862E]" />}
          title="Export Data"
          description="Download your reports and records"
          iconBg="rgba(184,134,46,0.12)"
        >
          <Button variant="secondary" onClick={handleExport} leftIcon={<Download size={16} />} size="sm">
            Export All Data (CSV)
          </Button>
        </SettingsSection>
      </div>

      {/* Logout */}
      <div className="mt-4 glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[rgba(192,82,74,0.12)] flex-shrink-0">
            <LogOut size={20} className="text-[#C0524A]" />
          </div>
          <div>
            <p className="text-[15px] font-[600] text-[#1C1410]">Logout</p>
            <p className="text-[12px] text-[#9E8E80]">Sign out from your account</p>
          </div>
        </div>
        <Button variant="danger" onClick={handleLogout} size="sm">
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
}
