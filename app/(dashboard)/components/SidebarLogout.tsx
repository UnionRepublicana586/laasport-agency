"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SidebarLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="p-6 border-t border-[#2a2d35]">
      <button 
        onClick={handleLogout}
        className="w-full bg-[#1a1d24] hover:bg-red-950/30 border border-[#2a2d35] hover:border-red-900/50 text-gray-300 hover:text-red-400 py-2.5 px-4 rounded-lg font-bold text-[12px] transition flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Cerrar Sesión
      </button>
    </div>
  );
}