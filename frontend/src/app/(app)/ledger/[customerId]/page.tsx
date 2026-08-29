"use client";

import React, { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/features/customers/hooks/useCustomers";
import { CustomerLedgerSection } from "@/features/ledger/components/CustomerLedgerSection";
import { useSale } from "@/features/sales/hooks/useSales";
import { SaleDetail } from "@/features/sales/components/SaleDetail";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { generateInitials, stringToColor } from "@/utils/strings";
import { ROUTES } from "@/constants/routes";
import { useIsMobile } from "@/hooks";
import { cn } from "@/utils/cn";

export default function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const { data: customer, isLoading } = useCustomer(customerId);
  const isMobile = useIsMobile();
  const router = useRouter();

  // Which sale (if any) is currently open in the inline detail view.
  // Clicking a ledger transaction sets this instead of navigating away —
  // useSale() only fires its query once an id is set (enabled: !!id).
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);
  const { data: viewingSale } = useSale(viewingSaleId ?? "");

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-4 p-5 w-full">
        <SkeletonCard className="h-[80px]" />
        <SkeletonCard className="h-[90px]" />
        <SkeletonCard className="h-[60px]" />
        <SkeletonCard className="h-[380px]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] font-[600] text-[#1C1410]">Customer not found</p>
        <Link
          href={ROUTES.LEDGER}
          className="text-[13px] text-[#C8873A] mt-2 inline-block hover:underline"
        >
          ← Back to Ledgers
        </Link>
      </div>
    );
  }

  if (!customer.isCreditCustomer) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] font-[600] text-[#1C1410]">
          {customer.name} is not a credit customer.
        </p>
        <p className="text-[13px] text-[#9E8E80] mt-1 mb-4">
          Enable credit tracking in their customer profile to use the ledger.
        </p>
        <Link
          href={ROUTES.CUSTOMER(customer._id)}
          className="text-[13px] text-[#C8873A] hover:underline"
        >
          Go to customer profile →
        </Link>
      </div>
    );
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Back nav bar (mobile) */}
      {isMobile && (
        <div className="flex items-center gap-3 -mx-1">
          <Link
            href={ROUTES.LEDGER}
            className="flex items-center gap-1.5 text-[13px] font-[500] text-[#6B5D50] hover:text-[#C8873A] transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Ledgers</span>
          </Link>
        </div>
      )}

      {/* Customer header */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-[700] text-white flex-shrink-0"
          style={{ background: stringToColor(customer.name) }}
        >
          {generateInitials(customer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] md:text-[20px] font-[600] text-[#1C1410] truncate">
            {customer.name}
          </h1>
          <p className="text-[12px] text-[#9E8E80]">{customer.phone}</p>
        </div>
        {/* Link to customer profile */}
        <Link
          href={ROUTES.CUSTOMER(customer._id)}
          className={cn(
            "flex items-center gap-1 text-[11px] text-[#9E8E80] hover:text-[#C8873A] transition-colors flex-shrink-0",
            "border border-[rgba(255,255,255,0.45)] rounded-[8px] px-3 py-1.5"
          )}
        >
          <ExternalLink size={11} />
          <span className="hidden md:inline">Customer Profile</span>
          <span className="md:hidden">Profile</span>
        </Link>
      </div>

      {/* Ledger section (all the cards, table, forms) */}
      <CustomerLedgerSection
        customer={customer}
        onViewSale={(saleId) => setViewingSaleId(saleId)}
      />
    </motion.div>
  );

  // Inline sale detail overlay — opened by clicking a SALE row in the
  // ledger table above. Same backdrop + AnimatePresence pattern as
  // sales/page.tsx, so it behaves identically (drawer on mobile, side
  // panel on desktop — SaleDetail handles that split internally via CSS).
  const saleDetailOverlay = (
    <AnimatePresence>
      {viewingSale && (
        <>
          <div
            className="fixed inset-0 z-[50] bg-[rgba(30,20,10,0.15)] backdrop-blur-[3px]"
            onClick={() => setViewingSaleId(null)}
          />
          <SaleDetail
            sale={viewingSale}
            onClose={() => setViewingSaleId(null)}
            onEdit={() => {
              // Editing isn't done inline here — hand off to the Sales
              // page, pre-filtered to this exact order via its existing
              // search, where the real edit flow already lives.
              setViewingSaleId(null);
              router.push(`${ROUTES.SALES}?search=${encodeURIComponent(viewingSale.invoiceId)}`);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );

  // Both mobile and desktop now use a full-width single-pane layout.
  // On mobile the outer app shell already provides scroll; on desktop we
  // wrap in an overflow-y-auto container so the ledger scrolls independently.
  if (isMobile) {
    return (
      <div className="flex flex-col gap-0 pb-[env(safe-area-inset-bottom)]">
        {content}
        {saleDetailOverlay}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-5">{content}</div>
      {saleDetailOverlay}
    </div>
  );
}