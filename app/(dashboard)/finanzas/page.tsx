"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Finanzas() {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const WORKSPACE_ID = "75b5e7bd-2429-416c-9c17-b2b93ce726e9";

  useEffect(() => {
    cargarTransacciones();
  }, []);

  async function cargarTransacciones() {
    setCargando(true);
    const { data, error } = await supabase
      .from("transacciones")
      .select("*, jugadores(nombre, apellido), clubes(nombre)")
      .eq("workspace_id", WORKSPACE_ID)
      .order("fecha_vencimiento", { ascending: true });

    if (!error && data) {
      setTransacciones(data);
    }
    setCargando(false);
  }

  const cambiarEstadoTransaccion = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("transacciones")
      .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar el estado de la transacción.");
    } else {
      cargarTransacciones();
    }
  };

  const transaccionesFiltradas = useMemo(() => {
    return transacciones.filter((t: any) => {
      const texto = `${t.concepto || ""} ${t.jugadores?.nombre || ""} ${t.jugadores?.apellido || ""} ${t.clubes?.nombre || ""}`.toLowerCase();
      const matchBusqueda = !filtroBusqueda || texto.includes(filtroBusqueda.toLowerCase());
      const matchEstado = filtroEstado === "Todos" || t.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }, [transacciones, filtroBusqueda, filtroEstado]);

  const totalPendiente = useMemo(() => {
    return transacciones
      .filter((t: any) => t.estado === "Pendiente")
      .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0);
  }, [transacciones]);

  const totalCobrado = useMemo(() => {
    return transacciones
      .filter((t: any) => t.estado === "Cobrada" || t.estado === "Pagada")
      .reduce((acc: number, t: any) => acc + (Number(t.monto) || 0), 0);
  }, [transacciones]);

  return (
    <div className="p-6 font-sans w-full">
      <div className="max-w-[1500px] mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start mb-10 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · FINANZAS Y CAJA
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Gestión Financiera</h1>
            <p className="text-gray-400 text-sm">Control de comisiones, cobros generados por contratos y flujos de caja.</p>
          </div>
          <button 
            onClick={cargarTransacciones} 
            className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm cursor-pointer flex items-center gap-2"
          >
            Actualizar
          </button>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-lg">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Total por Cobrar (Pendiente)</div>
            <div className="text-3xl font-extrabold text-white font-mono">€ {totalPendiente.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 mt-2">Comisiones generadas pendientes de acreditación</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-lg">
            <div className="text-[10px] font-bold text-[#4ade80] uppercase tracking-wider mb-2">Total Cobrado (Histórico)</div>
            <div className="text-3xl font-extrabold text-white font-mono">€ {totalCobrado.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 mt-2">Comisiones efectivamente ingresadas a caja</div>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-[#1a1d24] border border-[#2a2d35] rounded-xl p-4 shadow-sm">
          <div className="relative w-full max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por concepto, jugador o club..." 
              value={filtroBusqueda} 
              onChange={(e) => setFiltroBusqueda(e.target.value)} 
              className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-3 pr-4 text-[13px] text-gray-200 focus:outline-none" 
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Estado:</span>
            {["Todos", "Pendiente", "Cobrada"].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`border text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filtroEstado === est 
                    ? "bg-[#2a2d35] border-gray-400 text-white" 
                    : "border-[#2a2d35] bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2d35]"
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE TRANSACCIONES */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando transacciones...</div>
          ) : transaccionesFiltradas.length === 0 ? (
            <div className="p-16 text-center text-gray-500 font-medium">No se encontraron registros financieros.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[1050px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-8 w-[32%]">Concepto / Contrato</th>
                    <th className="p-4 w-[22%]">Jugador / Club</th>
                    <th className="p-4 w-[16%]">Vencimiento</th>
                    <th className="p-4 w-[14%]">Monto Comisión</th>
                    <th className="p-4 w-[10%] text-center">Estado</th>
                    <th className="p-4 pr-6 text-right w-[16%]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {transaccionesFiltradas.map((t: any) => {
                    const nombreJugador = t.jugadores ? `${t.jugadores.nombre} ${t.jugadores.apellido}` : "—";
                    const nombreClub = t.clubes?.nombre ? `Club: ${t.clubes.nombre}` : "";
                    const simboloMoneda = t.moneda === 'EUR' ? '€' : t.moneda === 'USD' ? 'US$' : '$';
                    const esPendiente = t.estado === 'Pendiente';

                    return (
                      <tr key={t.id} className="hover:bg-[#1c1f26] transition group">
                        <td className="py-4 pl-8 pr-4">
                          <div className="font-bold text-white text-[13px]">{t.concepto || "Comisión"}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{t.tipo}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-200 text-[13px]">{nombreJugador}</div>
                          {nombreClub && <div className="text-[11px] text-gray-500 mt-0.5">{nombreClub}</div>}
                        </td>
                        <td className="py-4 px-4 font-mono text-amber-400 text-[12px]">{t.fecha_vencimiento || "—"}</td>
                        <td className="py-4 px-4 font-mono font-bold text-white text-[13px]">
                          {simboloMoneda} {Number(t.monto).toLocaleString()} <span className="text-[10px] text-gray-400">{t.moneda}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${
                            esPendiente ? "bg-amber-950/40 text-amber-400 border border-amber-900/50" : "bg-green-950/40 text-green-400 border border-green-900/50"
                          }`}>
                            {t.estado}
                          </span>
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          {esPendiente ? (
                            <button 
                              onClick={() => cambiarEstadoTransaccion(t.id, 'Cobrada')}
                              className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#4ade80] text-[11px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                            >
                              Marcar Cobrada
                            </button>
                          ) : (
                            <button 
                              onClick={() => cambiarEstadoTransaccion(t.id, 'Pendiente')}
                              className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-amber-400 text-[11px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
                            >
                              Marcar Pendiente
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}