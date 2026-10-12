"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ConfiguracionPage() {
  const [whatsapp, setWhatsapp] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function verificarSesion() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      cargarConfiguracion();
    }
    verificarSesion();
  }, [router]);

  async function cargarConfiguracion() {
    setCargando(true);
    const { data, error } = await supabase
      .from("agencia_config")
      .select("valor")
      .eq("clave", "whatsapp_contacto")
      .single();

    if (data?.valor) {
      setWhatsapp(data.valor);
    }
    setCargando(false);
  }

  async function guardarConfiguracion(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito("");

    // Verificamos si ya existe el registro
    const { data: existente } = await supabase
      .from("agencia_config")
      .select("id")
      .eq("clave", "whatsapp_contacto")
      .single();

    let error;
    if (existente) {
      // Si existe, actualizamos
      const res = await supabase
        .from("agencia_config")
        .update({ valor: whatsapp })
        .eq("clave", "whatsapp_contacto");
      error = res.error;
    } else {
      // Si no existe, insertamos
      const res = await supabase
        .from("agencia_config")
        .insert([{ clave: "whatsapp_contacto", valor: whatsapp }]);
      error = res.error;
    }

    if (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar la configuración.");
    } else {
      setMensajeExito("¡Configuración actualizada con éxito!");
      setTimeout(() => setMensajeExito(""), 4000);
    }
    setGuardando(false);
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · SISTEMA
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Configuración General</h1>
            <p className="text-gray-400 text-sm">Parámetros globales y canales de contacto de la agencia.</p>
          </div>
          <Link href="/" className="bg-[#1a1d24] border border-[#2a2d35] text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px]">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Formulario de Configuración */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 md:p-8 shadow-md">
          <h2 className="text-base font-bold text-white mb-1">Canal de WhatsApp para Showcases</h2>
          <p className="text-[12px] text-gray-400 mb-6">
            Este número recibirá las consultas directas cuando los directores deportivos hagan clic en el botón de contacto de los perfiles públicos.
          </p>

          {cargando ? (
            <div className="py-8 text-center text-gray-500 text-sm">Cargando configuración...</div>
          ) : (
            <form onSubmit={guardarConfiguracion} className="space-y-6 max-w-xl">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Número de WhatsApp (con código de país y área, sin símbolos)
                </label>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1a1d24] border border-[#2a2d35] px-3.5 py-2.5 rounded-lg text-gray-400 text-sm font-mono">+</span>
                  <input 
                    type="text" 
                    required 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Ej. 5493415555555"
                    className="w-full bg-[#1a1d24] border border-[#2a2d35] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#60a5fa] font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">Ejemplo para Argentina: <code>549341...</code></p>
              </div>

              {mensajeExito && (
                <div className="bg-green-950/50 border border-green-800 text-green-400 px-4 py-3 rounded-lg text-[13px] font-bold">
                  {mensajeExito}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2d35]">
                <button 
                  type="submit" 
                  disabled={guardando}
                  className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#0f1115] px-6 py-2.5 rounded-lg font-bold text-[13px] transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}