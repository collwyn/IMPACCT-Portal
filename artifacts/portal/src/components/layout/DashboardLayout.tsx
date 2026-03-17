import React from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto p-8"
        >
          {children}
        </motion.div>
      </main>
      <OnboardingWizard />
    </div>
  );
}
