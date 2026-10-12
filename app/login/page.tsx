"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales inválidas. Verificá tu email y contraseña.");
      setCargando(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#15181f] border border-[#2a2d35] rounded-2xl shadow-2xl w-full max-w-[420px] p-8">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#1a1d24] border border-[#2a2d35] p-3 rounded-xl shadow-inner">
              <img 
                src="https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/75b5e7bd-2429-416c-9c17-b2b93ce726e9/logo/logoblanco.png" 
                alt="LAASPORT Logo" 
                className="h-10 w-auto object-contain" 
              />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Agency Management</h1>
          <p className="text-[12px] text-gray-400 mt-1">Iniciá sesión para acceder al sistema</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-lg text-[12px] mb-5 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Correo electrónico</label>
            <input 
              required 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-[#1a1d24] border border-[#2a2d35] rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          <div>
            <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Contraseña</label>
            <input 
              required 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1a1d24] border border-[#2a2d35] rounded-lg p-3 text-[13px] text-white focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition text-[13px] shadow-md mt-2 disabled:opacity-50"
          >
            {cargando ? "Iniciando sesión..." : "Ingresar al Sistema"}
          </button>
        </form>

        <div className="text-center mt-6 text-[11px] text-gray-500 uppercase tracking-widest">
          LAASPORT · Workspace Seguro
        </div>

      </div>
    </div>
  );
}