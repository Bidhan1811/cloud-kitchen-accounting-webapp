"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface AddSaleContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AddSaleContext = createContext<AddSaleContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function AddSaleProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AddSaleContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AddSaleContext.Provider>
  );
}

export function useAddSale() {
  return useContext(AddSaleContext);
}
