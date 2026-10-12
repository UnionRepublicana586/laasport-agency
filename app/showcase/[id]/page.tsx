"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function ShowcaseContenido() {
  const params = useParams();
  const id = params?.id;

  const [jugador, setJugador] = useState<any>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [whatsappAgencia, setWhatsappAgencia] = useState("549341000000"); // Número por defecto
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      cargarDatosPublicos(id as string);
    }
  }, [id]);

  async function cargarDatosPublicos(jugadorId: string) {
    setCargando(true);
    
    // 1. Cargar datos del jugador
    const resJugador = await supabase
      .from("jugadores")
      .select("*")
      .eq("id", jugadorId)
      .single();

    // 1.1 Cargar contratos del jugador para extraer club y vencimiento real
    const resContratos = await supabase
      .from("contratos")
      .select("*, clubes(nombre)")
      .eq("jugador_id", jugadorId)
      .order("fecha_vencimiento", { ascending: false });

    // 2. Cargar número de WhatsApp configurado en la agencia
    const resConfig = await supabase
      .from("agencia_config")
      .select("valor")
      .eq("clave", "whatsapp_contacto")
      .single();

    if (resConfig.data?.valor) {
      setWhatsappAgencia(resConfig.data.valor);
    }

    if (resJugador.error || !resJugador.data) {
      setError(true);
    } else {
      setJugador(resJugador.data);
      if (resContratos.data) {
        setContratos(resContratos.data);
      }
    }
    setCargando(false);
  }

  const armarLinkFoto = (ruta: string) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta; 
    return `https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/${ruta}`;
  };

  const calcularEdad = (fecha: string) => {
    if (!fecha) return "—";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return isNaN(edad) ? "—" : `${edad} años`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-gray-400 flex items-center justify-center font-sans">
        <div className="text-sm tracking-widest uppercase animate-pulse">Cargando perfil profesional...</div>
      </div>
    );
  }

  if (error || !jugador) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-gray-200 flex flex-col items-center justify-center p-6 font-sans text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Perfil no disponible</h1>
        <p className="text-gray-400 text-sm max-w-md">El enlace del showcase es incorrecto o el jugador ya no se encuentra activo en la cartera pública.</p>
      </div>
    );
  }

  // Extraer información contractual desde la tabla contratos (prioriza Laboral_Club, si no toma el primer contrato disponible)
  const contratoClub = contratos.find((c: any) => c.tipo_contrato === "Laboral_Club") || contratos[0];
  const nombreClubActual = contratoClub?.clubes?.nombre || jugador.club_actual || "Agente Libre";
  const finContratoClub = contratoClub?.fecha_vencimiento || "Sin contrato registrado";

  // Calcular elegibilidad de transferencia dinámicamente
  const hoyStr = new Date().toISOString().split("T")[0];
  const esVigente = contratoClub?.fecha_vencimiento ? contratoClub.fecha_vencimiento >= hoyStr : false;
  const elegibilidad = contratoClub ? (esVigente ? "Bajo contrato activo" : "Disponible (Contrato vencido)") : "Disponible / Agente Libre";

  const nacionalidadesExtras = [jugador.nacionalidad_2, jugador.nacionalidad_3].filter(Boolean).join(" / ");
  
  const mensajeWhatsApp = `Hola, me interesa obtener más información sobre el jugador ${jugador.nombre} ${jugador.apellido} (Showcase LAASPORT).`;
  const linkWhatsApp = `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 p-6 md:p-12 font-sans selection:bg-[#60a5fa] selection:text-[#0f1115]">
      <div className="max-w-3xl mx-auto">
        
        {/* Membrete Agencia */}
        <div className="flex justify-between items-center border-b border-[#2a2d35] pb-6 mb-8">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-bold mb-1">
              LAASPORT AGENCY
            </div>
            <div className="text-xs text-gray-400 font-medium">Showcase Oficial · Futsal Management</div>
          </div>
          <div className="bg-[#1a1d24] border border-[#2a2d35] px-3 py-1.5 rounded-lg text-[11px] font-mono text-gray-300">
            CONFIDENCIAL / CLUBES
          </div>
        </div>

        {/* Perfil Principal */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-2xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            
            <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-2xl border-2 border-[#304058] bg-[#253246] overflow-hidden shadow-xl flex items-center justify-center">
              {jugador.foto_url ? (
                <img src={armarLinkFoto(jugador.foto_url)} alt={`${jugador.nombre} ${jugador.apellido}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="inline-block bg-[#253246] text-[#60a5fa] border border-[#304058] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">
                {jugador.posicion || "Jugador de Futsal"}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                {jugador.nombre} {jugador.apellido}
              </h1>
              <div className="text-base font-bold text-[#4ade80] flex items-center justify-center md:justify-start gap-2">
                <span>📍 Club Actual:</span>
                <span>{nombreClubActual}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Datos Técnicos y Deportivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-md">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-[#2a2d35] pb-2">
              Perfil Físico y Técnico
            </h3>
            <div className="space-y-3.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Edad / Nacimiento:</span>
                <span className="text-white font-bold">{calcularEdad(jugador.fecha_nacimiento)} {jugador.fecha_nacimiento ? `(${new Date(jugador.fecha_nacimiento).toLocaleDateString()})` : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Pierna Hábil:</span>
                <span className="text-white font-bold">{jugador.pierna_habil || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Nacionalidad Principal:</span>
                <span className="text-white font-bold">{jugador.nacionalidad || "—"}</span>
              </div>
              {nacionalidadesExtras && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Pasaportes / Extras:</span>
                  <span className="text-white font-bold">{nacionalidadesExtras}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-md">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-[#2a2d35] pb-2">
              Situación Contractual
            </h3>
            <div className="space-y-3.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Estado en Cartera:</span>
                <span className="text-white font-bold">{jugador.estado || "Activo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Fin de Contrato (Club):</span>
                <span className="text-amber-400 font-mono font-bold">{finContratoClub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Elegibilidad Transferencia:</span>
                <span className="text-[#4ade80] font-bold">{elegibilidad}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Observaciones / Perfil táctico */}
        {jugador.notas && (
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-md mb-8">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-[#2a2d35] pb-2">
              Perfil Táctico y Observaciones de Scouting
            </h3>
            <p className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">{jugador.notas}</p>
          </div>
        )}

        {/* Call to Action para Directores Deportivos */}
        <div className="bg-gradient-to-r from-[#15181f] to-[#1e232d] border border-[#2a2d35] rounded-2xl p-8 text-center shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">¿Interesado en este jugador?</h3>
          <p className="text-gray-400 text-[13px] max-w-md mx-auto mb-6">
            Comuníquese directamente con la gerencia deportiva de LAASPORT para coordinar condiciones contractuales o solicitar material audiovisual completo.
          </p>
          <a 
            href={linkWhatsApp} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] font-bold px-6 py-3 rounded-xl text-[13px] transition shadow-lg cursor-pointer"
          >
            Contactar Agente por WhatsApp ↗
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-[11px] text-gray-400 tracking-wider uppercase">
          LAASPORT Futsal Management · Documento oficial para directores deportivos
        </div>

      </div>
    </div>
  );
}

export default function ShowcaseJugador() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f1115] text-gray-400 flex items-center justify-center font-sans">
        <div className="text-sm tracking-widest uppercase animate-pulse">Cargando showcase...</div>
      </div>
    }>
      <ShowcaseContenido />
    </Suspense>
  );
}