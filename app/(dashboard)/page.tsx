"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [clubes, setClubes] = useState<any[]>([]);
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fechaHoy, setFechaHoy] = useState("");
  
  // Estados para el Modal y formulario de nueva alerta de hito
  const [modalAlertasAbierto, setModalAlertasAbierto] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("mercado");
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState("");
  const [nuevaFechaFin, setNuevaFechaFin] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [guardandoAlerta, setGuardandoAlerta] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function verificarSesion() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setFechaHoy(new Date().toISOString().split("T")[0]);
      cargarDatosDashboard();
    }
    verificarSesion();
  }, [router]);

  async function cargarDatosDashboard() {
    setCargando(true);
    const [resJugadores, resClubes, resOportunidades, resTareas, resContactos, resAlertas, resTransacciones] = await Promise.all([
      supabase.from("jugadores").select("*").order('creado_en', { ascending: false }),
      supabase.from("clubes").select("*"),
      supabase.from("oportunidades").select("*"),
      supabase.from("tareas").select("*"),
      supabase.from("contactos").select("*"),
      supabase.from("alertas_vencimientos").select("*"),
      supabase.from("transacciones").select("*, jugadores(nombre, apellido), clubes(nombre)")
    ]);

    if (!resJugadores.error) setJugadores(resJugadores.data || []);
    if (!resClubes.error) setClubes(resClubes.data || []);
    if (!resOportunidades.error) setOportunidades(resOportunidades.data || []);
    if (!resTareas.error) setTareas(resTareas.data || []);
    if (!resContactos.error) setContactos(resContactos.data || []);
    if (!resAlertas.error) setAlertas(resAlertas.data || []);
    if (!resTransacciones.error) setTransacciones(resTransacciones.data || []);
    
    setCargando(false);
  }

  async function handleCrearAlerta(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoTitulo) return;
    setGuardandoAlerta(true);

    const { error } = await supabase.from("alertas_vencimientos").insert([
      {
        titulo: nuevoTitulo,
        tipo: nuevoTipo,
        fecha_inicio: nuevaFechaInicio || null,
        fecha_fin: nuevaFechaFin || null,
        descripcion: nuevaDescripcion || null
      }
    ]);

    if (error) {
      console.error("Error al crear alerta:", error);
      alert("Error al guardar la alerta.");
    } else {
      setNuevoTitulo("");
      setNuevaFechaInicio("");
      setNuevaFechaFin("");
      setNuevaDescripcion("");
      setMostrarFormularioNuevo(false);
      cargarDatosDashboard();
    }
    setGuardandoAlerta(false);
  }

  const armarLinkFoto = (ruta: string) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta; 
    return `https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/${ruta}`;
  };

  const totalPaisesClubes = useMemo(() => {
    return new Set(clubes.map((c: any) => c.pais).filter(Boolean)).size;
  }, [clubes]);

  const metricasOportunidades = useMemo(() => {
    let abiertas = 0;
    let vencidas = 0;
    let importeAbierto = 0;

    oportunidades.forEach((op: any) => {
      const estado = (op.estado || "").toLowerCase();
      const esCerrada = estado.includes("cerrada") || estado.includes("finalizada");

      if (!esCerrada) {
        abiertas++;
        if (op.monto_estimado) importeAbierto += Number(op.monto_estimado);
        if (fechaHoy && op.fecha_limite && op.fecha_limite < fechaHoy) {
          vencidas++;
        }
      }
    });

    return { abiertas, vencidas, importeAbierto };
  }, [oportunidades, fechaHoy]);

  const metricasTareas = useMemo(() => {
    let pendientes = 0;
    let vencidasOparahoy = 0;

    tareas.forEach((t: any) => {
      const estado = (t.estado || "").toLowerCase();
      if (estado !== "completada") {
        pendientes++;
        if (fechaHoy && t.fecha_vencimiento) {
          const vencStr = t.fecha_vencimiento.split("T")[0];
          if (vencStr <= fechaHoy) {
            vencidasOparahoy++;
          }
        }
      }
    });

    return { pendientes, vencidasOparahoy };
  }, [tareas, fechaHoy]);

  const pipelineConteo = useMemo(() => {
    const conteo: Record<string, number> = { "Inicial": 0, "Pendiente": 0, "En análisis": 0, "En negociación": 0 };
    oportunidades.forEach((op: any) => {
      const est = op.estado || "Inicial";
      if (conteo[est] !== undefined) conteo[est]++;
      else conteo[est] = (conteo[est] || 0) + 1;
    });
    return conteo;
  }, [oportunidades]);

  const tareasProximas = useMemo(() => {
    return tareas
      .filter((t: any) => (t.estado || "").toLowerCase() !== "completada")
      .slice(0, 3);
  }, [tareas]);

  const alertasProcesadas = useMemo(() => {
    if (!fechaHoy) return alertas;

    const hoy = new Date(fechaHoy);
    const listaVirtuales: any[] = [];

    // 1. Alertas de Pasaportes desde la tabla jugadores
    jugadores.forEach((j: any) => {
      ['1', '2', '3'].forEach(num => {
        const venc = j[`vencimiento_pasaporte_${num}`];
        if (venc) {
          const fechaRef = new Date(venc);
          const diasRestantes = Math.ceil((fechaRef.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          listaVirtuales.push({
            id: `pasaporte-${num}-${j.id}`,
            titulo: `Vencimiento Pasaporte (${j[`nacionalidad${num === '1' ? '' : '_' + num}`] || `Nac. ${num}`}): ${j.nombre} ${j.apellido}`,
            tipo: 'pasaporte',
            fecha_vencimiento: venc,
            descripcion: `El pasaporte expira el ${venc}.`,
            diasRestantes,
            esVencido: diasRestantes < 0
          });
        }
      });
    });

    // 2. Alertas de cuotas financieras pendientes / vencidas desde transacciones
    transacciones.forEach((t: any) => {
      if (t.estado === 'Pendiente' && t.fecha_vencimiento) {
        const fechaRef = new Date(t.fecha_vencimiento);
        const diasRestantes = Math.ceil((fechaRef.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
        const nombreJugador = t.jugadores ? `${t.jugadores.nombre} ${t.jugadores.apellido}` : "";
        const simboloMoneda = t.moneda === 'EUR' ? '€' : t.moneda === 'USD' ? 'US$' : '$';

        listaVirtuales.push({
          id: `transaccion-${t.id}`,
          titulo: `Cobro Pendiente: ${t.concepto} ${nombreJugador ? `(${nombreJugador})` : ''}`,
          tipo: 'finanzas',
          fecha_vencimiento: t.fecha_vencimiento,
          descripcion: `Monto: ${simboloMoneda} ${Number(t.monto).toLocaleString()} ${t.moneda}. Vence el ${t.fecha_vencimiento}.`,
          diasRestantes,
          esVencido: diasRestantes < 0
        });
      }
    });

    const alertasFijasProcesadas = alertas.map((alerta: any) => {
      const fechaRefStr = alerta.fecha_fin || alerta.fecha_vencimiento || alerta.fecha_inicio;
      if (!fechaRefStr) return { ...alerta, esVencido: false, diasRestantes: 999 };

      const fechaRef = new Date(fechaRefStr);
      const diasRestantes = Math.ceil((fechaRef.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
      return {
        ...alerta,
        diasRestantes,
        esVencido: diasRestantes < 0
      };
    });

    const todas = [...listaVirtuales, ...alertasFijasProcesadas];

    return todas.sort((a, b) => {
      if (a.esVencido && !b.esVencido) return 1;
      if (!a.esVencido && b.esVencido) return -1;
      return a.diasRestantes - b.diasRestantes;
    });
  }, [alertas, jugadores, transacciones, fechaHoy]);

  // Actualizado a 4 tarjetas en lugar de 3
  const alertasVigentesDashboard = useMemo(() => {
    return alertasProcesadas.filter(a => !a.esVencido).slice(0, 4);
  }, [alertasProcesadas]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="flex justify-between items-start mb-8 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Dashboard</h1>
            <p className="text-gray-400 text-sm">Visión general de la actividad de tu agencia.</p>
          </div>
          <Link href="/oportunidades" className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm">
            + Nueva oportunidad
          </Link>
        </div>

        {/* Accesos rápidos */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/jugadores" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">+ Jugador</Link>
          <Link href="/clubes" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">+ Club</Link>
          <Link href="/contactos" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">+ Contacto</Link>
          <Link href="/tareas" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">+ Tarea</Link>
          <Link href="/finanzas" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">💰 Finanzas</Link>
          <Link href="/configuracion" className="bg-[#15181f] border border-[#2a2d35] hover:border-gray-500 text-gray-200 px-4 py-2 rounded-lg font-bold text-[12px] transition flex items-center gap-2 cursor-pointer">⚙ Configuración</Link>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Jugadores en cartera</div>
            <div className="text-3xl font-black text-white mb-1">{cargando ? "..." : jugadores.length}</div>
            <div className="text-[11px] text-gray-500">{jugadores.length} incorporados en total</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Clubes registrados</div>
            <div className="text-3xl font-black text-white mb-1">{cargando ? "..." : clubes.length}</div>
            <div className="text-[11px] text-gray-500">{totalPaisesClubes} países en la red</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Oportunidades abiertas</div>
            <div className="text-3xl font-black text-white mb-1">{cargando ? "..." : metricasOportunidades.abiertas}</div>
            <div className="text-[11px] text-gray-500">{metricasOportunidades.vencidas} vencidas</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tareas pendientes</div>
            <div className="text-3xl font-black text-white mb-1">{cargando ? "..." : metricasTareas.pendientes}</div>
            <div className="text-[11px] text-gray-500">{metricasTareas.vencidasOparahoy} vencidas o para hoy</div>
          </div>
        </div>

        {/* MÓDULO: Alertas de Vencimientos y Hitos (Grid cambiado a 4 columnas) */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 mb-8 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Alertas de Vencimiento y Cobros</h2>
              <p className="text-[12px] text-gray-400">Control integral de pasaportes, contratos y cuotas financieras pendientes</p>
            </div>
            <button 
              onClick={() => { setModalAlertasAbierto(true); setMostrarFormularioNuevo(false); }}
              className="text-[12px] font-bold text-[#60a5fa] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              Ver todas ({alertasProcesadas.length}) ↗
            </button>
          </div>
          {cargando ? (
            <div className="py-4 text-center text-gray-500 text-sm">Cargando alertas...</div>
          ) : alertasVigentesDashboard.length === 0 ? (
            <div className="py-4 text-center text-gray-500 text-sm">No hay alertas ni vencimientos próximos pendientes.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {alertasVigentesDashboard.map((alerta: any) => {
                let badgeClass = "bg-[#253246] text-[#60a5fa] border-[#304058]";
                let badgeText = alerta.tipo;

                if (alerta.tipo === 'pasaporte') {
                  badgeClass = "bg-purple-950 text-purple-400 border-purple-800";
                  badgeText = `Pasaporte (${alerta.diasRestantes}d)`;
                } else if (alerta.tipo === 'finanzas') {
                  badgeClass = "bg-green-950 text-[#4ade80] border-green-800";
                  badgeText = `Cobro Cuota (${alerta.diasRestantes}d)`;
                }

                return (
                  <div key={alerta.id} className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`border px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                          {badgeText}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {alerta.fecha_vencimiento || "—"}
                        </span>
                      </div>
                      <div className="font-bold text-white text-[13px] mb-1">{alerta.titulo}</div>
                      <p className="text-[11px] text-gray-400">{alerta.descripcion || "Sin descripción adicional."}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: Ver todas las alertas */}
        {modalAlertasAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#15181f] border border-[#2a2d35] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2d35]">
                <div>
                  <h3 className="text-lg font-bold text-white">Todas las Alertas y Vencimientos</h3>
                  <p className="text-[12px] text-gray-400">Control de pasaportes, contratos y cuotas de comisiones</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setMostrarFormularioNuevo(!mostrarFormularioNuevo)}
                    className="bg-[#253246] hover:bg-[#304058] text-[#60a5fa] border border-[#304058] px-3 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer"
                  >
                    {mostrarFormularioNuevo ? "Cancelar" : "+ Nuevo Hito"}
                  </button>
                  <button 
                    onClick={() => setModalAlertasAbierto(false)}
                    className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1 bg-[#1a1d24] border border-[#2a2d35] rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                
                {mostrarFormularioNuevo && (
                  <form onSubmit={handleCrearAlerta} className="bg-[#1a1d24] border border-[#304058] rounded-xl p-4 space-y-3 mb-4">
                    <h4 className="text-sm font-bold text-white mb-2">Registrar nuevo hito o ventana</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Título</label>
                      <input 
                        type="text" 
                        required 
                        value={nuevoTitulo} 
                        onChange={e => setNuevoTitulo(e.target.value)}
                        placeholder="Ej. Cierre de inscripción"
                        className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#60a5fa]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tipo</label>
                        <select 
                          value={nuevoTipo} 
                          onChange={e => setNuevoTipo(e.target.value)}
                          className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#60a5fa]"
                        >
                          <option value="mercado">Mercado</option>
                          <option value="fifa">FIFA</option>
                          <option value="documentacion">Documentación</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Desde</label>
                          <input 
                            type="date" 
                            value={nuevaFechaInicio} 
                            onChange={e => setNuevaFechaInicio(e.target.value)}
                            className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#60a5fa]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Hasta</label>
                          <input 
                            type="date" 
                            value={nuevaFechaFin} 
                            onChange={e => setNuevaFechaFin(e.target.value)}
                            className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#60a5fa]"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                      <textarea 
                        value={nuevaDescripcion} 
                        onChange={e => setNuevaDescripcion(e.target.value)}
                        placeholder="Detalle o alcance..."
                        rows={2}
                        className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#60a5fa]"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit" 
                        disabled={guardandoAlerta}
                        className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#0f1115] px-4 py-2 rounded-lg font-bold text-[12px] transition cursor-pointer"
                      >
                        {guardandoAlerta ? "Guardando..." : "Guardar Hito"}
                      </button>
                    </div>
                  </form>
                )}

                {alertasProcesadas.map((alerta: any) => {
                  let badgeClass = "bg-[#253246] text-[#60a5fa] border-[#304058]";
                  let badgeText = alerta.tipo;

                  if (alerta.tipo === 'pasaporte') {
                    badgeClass = "bg-purple-950 text-purple-400 border-purple-800";
                    badgeText = "Pasaporte / Visa";
                  } else if (alerta.tipo === 'finanzas') {
                    badgeClass = "bg-green-950 text-[#4ade80] border-green-800";
                    badgeText = "Cobro Pendiente";
                  }

                  return (
                    <div 
                      key={alerta.id} 
                      className={`bg-[#1a1d24] border rounded-xl p-4 flex flex-col justify-between ${alerta.esVencido ? 'border-red-900/40 opacity-60' : 'border-[#2a2d35]'}`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`border px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                            {badgeText}
                          </span>
                          {alerta.esVencido && (
                            <span className="bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              Vencido
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {alerta.fecha_vencimiento || (alerta.fecha_inicio ? `${alerta.fecha_inicio} al ${alerta.fecha_fin}` : "—")}
                        </span>
                      </div>
                      <div className="font-bold text-white text-[13px] mb-1">{alerta.titulo}</div>
                      <p className="text-[11px] text-gray-400">{alerta.descripcion || "Sin descripción adicional."}</p>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-[#2a2d35] flex justify-end">
                <button 
                  onClick={() => setModalAlertasAbierto(false)}
                  className="bg-[#1a1d24] border border-[#2a2d35] text-white px-4 py-2 rounded-lg font-bold text-[12px] hover:bg-[#2a2d35] transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Grid Inferior: Jugadores y Tareas / Pipeline */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 mb-8 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Jugadores de la cartera</h2>
              <p className="text-[12px] text-gray-400">Acceso rápido a los perfiles de los jugadores</p>
            </div>
            <Link href="/jugadores" className="text-[12px] font-bold text-[#60a5fa] hover:underline flex items-center gap-1">Ver todos ↗</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cargando ? (
              <div className="col-span-full py-6 text-center text-gray-500 text-sm">Cargando jugadores...</div>
            ) : jugadores.length === 0 ? (
              <div className="col-span-full py-6 text-center text-gray-500 text-sm">No hay jugadores cargados todavía.</div>
            ) : (
              jugadores.slice(0, 5).map((j: any) => (
                <Link key={j.id} href="/jugadores" className="bg-[#1a1d24] border border-[#2a2d35] hover:border-gray-500 rounded-xl p-4 transition flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full border border-[#304058] bg-[#253246] overflow-hidden mb-3 flex items-center justify-center shadow-sm">
                    {j.foto_url ? (
                      <img src={armarLinkFoto(j.foto_url)} alt={j.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">{j.nombre?.charAt(0)}{j.apellido?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="font-bold text-white text-[13px] truncate w-full">{j.nombre} {j.apellido}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate w-full">{j.posicion || "—"} · {j.club_actual || "Libre"}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8 flex flex-col">
            <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Próximas acciones</h2>
                  <p className="text-[12px] text-gray-400">Prioridades de trabajo para mantener el ritmo comercial</p>
                </div>
                <Link href="/tareas" className="text-[12px] font-bold text-[#60a5fa] hover:underline flex items-center gap-1">Ver tareas ↗</Link>
              </div>
              <div className="space-y-3">
                {cargando ? (
                  <div className="py-6 text-center text-gray-500 text-sm">Cargando tareas...</div>
                ) : tareasProximas.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-sm">No hay tareas pendientes. ¡Todo al día!</div>
                ) : (
                  tareasProximas.map((t: any) => (
                    <div key={t.id} className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl p-4 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <div className="font-bold text-white text-[13px] truncate">{t.titulo}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {t.descripcion || "Sin descripción"} {t.fecha_vencimiento ? `· ${new Date(t.fecha_vencimiento).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                      <span className="bg-[#15181f] border border-[#2a2d35] text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 uppercase">
                        {t.prioridad || "media"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
            <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Pipeline comercial</h2>
                  <p className="text-[12px] text-gray-400">Distribución de oportunidades abiertas</p>
                </div>
                <Link href="/oportunidades" className="text-[12px] font-bold text-[#60a5fa] hover:underline flex items-center gap-1">Ver oportunidades ↗</Link>
              </div>
              <div className="space-y-4 mb-6">
                {Object.entries(pipelineConteo).map(([estado, cantidad]: [string, any]) => (
                  <div key={estado}>
                    <div className="flex justify-between items-center text-[12px] font-bold mb-1.5">
                      <span className="text-gray-300">{estado}</span>
                      <span className="text-white">{cantidad}</span>
                    </div>
                    <div className="w-full bg-[#1a1d24] h-2 rounded-full overflow-hidden border border-[#2a2d35]">
                      <div className="bg-[#60a5fa] h-full rounded-full transition-all duration-500" style={{ width: `${oportunidades.length > 0 ? (cantidad / oportunidades.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a2d35] pt-4">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Importe estimado abierto</div>
                <div className="text-2xl font-black text-white">US$ {metricasOportunidades.importeAbierto.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Los importes se muestran por moneda, sin convertir divisas.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}