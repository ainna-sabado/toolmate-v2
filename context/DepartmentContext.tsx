"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type DepartmentContextType = {
  mainDepartment: string;
  updateDepartment: (dep: string) => void;
};

const DepartmentContext = createContext<DepartmentContextType | undefined>(
  undefined
);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [mainDepartment, setMainDepartment] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("mainDepartment");
    if (stored) setMainDepartment(stored);
  }, []);

  const updateDepartment = (dep: string) => {
    setMainDepartment(dep);
    localStorage.setItem("mainDepartment", dep);
  };

  return (
    <DepartmentContext.Provider value={{ mainDepartment, updateDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment(): DepartmentContextType {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    throw new Error("useDepartment must be used inside DepartmentProvider");
  }
  return ctx;
}
