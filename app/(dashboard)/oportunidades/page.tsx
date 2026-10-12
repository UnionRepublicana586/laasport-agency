"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Oportunidades() {
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [clubes, setClubes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fechaHoy, setFechaHoy] = useState("");
  
  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  // Sistema de Modales
  const [vistaModal, setVistaModal] = useState<"Formulario" | "Ficha" | null>(null);
  const [oportunidadActual, setOportunidadActual] = useState<any>(null);
  
  // Formulario
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    titulo: "",
    jugador_id: "",
    club_id: "",
    tipo: "Prueba deportiva",
    estado: "En negociación",
    monto_estimado: "",
    moneda: "US$",
    fecha_limite: "",
    notas: ""
  });

  useEffect(() => {
    // Calculamos la fecha actual en el cliente para evitar el error de pre-renderizado de Next.js
    setFechaHoy(new Date().toISOString().split("T")[0]);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const [resOportunidades, resJugadores, resClubes] = await Promise.all([
      supabase.from("oportunidades").select("*").order('creado_en', { ascending: false }),
      supabase.from("jugadores").select("id, nombre, apellido"),
      supabase.from("clubes").select("id, nombre")
    ]);
    
    if (!resOportunidades.error) setOportunidades(resOportunidades.data || []);
    if (!resJugadores.error) setJugadores(resJugadores.data || []);
    if (!resClubes.error) setClubes(resClubes.data || []);
    
    setCargando(false);
  }

  const getNombreJugador = (id: string) => {
    const j = jugadores.find((item: any) => item.id === id);
    return j ? `${j.nombre} ${j.apellido}` : "—";
  };

  const getNombreClub = (id: string) => {
    const c = clubes.find((item: any) => item.id === id);
    return c ? c.nombre : "—";
  };

  // Métricas superiores
  const metricas = useMemo(() => {
    let abiertas = 0;
    let vencidas = 0;
    let cerradas = 0;
    let importeAbierto = 0;

    oportunidades.forEach((op: any) => {
      const estado = op.estado || "";
      const esCerrada = estado.toLowerCase().includes("cerrada") || estado.toLowerCase().includes("finalizada");
      
      if (esCerrada) {
        cerradas++;
      } else {
        abiertas++;
        if (op.monto_estimado) {
          importeAbierto += Number(op.monto_estimado);
        }
        if (fechaHoy && op.fecha_limite && op.fecha_limite < fechaHoy) {
          vencidas++;
        }
      }
    });

    return { abiertas, vencidas, cerradas, importeAbierto };
  }, [oportunidades, fechaHoy]);

  const opcionesEstado = ["Todos", ...Array.from(new Set(oportunidades.map((o: any) => o.estado).filter(Boolean)))];
  const opcionesTipo = ["Todos", ...Array.from(new Set(oportunidades.map((o: any) => o.tipo).filter(Boolean)))];

  const oportunidadesFiltradas = useMemo(() => {
    return oportunidades.filter((op: any) => {
      const nombreJ = getNombreJugador(op.jugador_id).toLowerCase();
      const nombreC = getNombreClub(op.club_id).toLowerCase();
      const titulo = (op.titulo || "").toLowerCase();
      
      const matchBusqueda = !filtroBusqueda || titulo.includes(filtroBusqueda.toLowerCase()) || nombreJ.includes(filtroBusqueda.toLowerCase()) || nombreC.includes(filtroBusqueda.toLowerCase());
      const matchEstado = filtroEstado === "Todos" || op.estado === filtroEstado;
      const matchTipo = filtroTipo === "Todos" || op.tipo === filtroTipo;
      
      return matchBusqueda && matchEstado && matchTipo;
    });
  }, [oportunidades, filtroBusqueda, filtroEstado, filtroTipo, jugadores, clubes]);

  const conteoPipeline = useMemo(() => {
    const conteo: Record<string, number> = { "Inicial": 0, "En análisis": 0, "En negociación": 0, "Pendiente": 0 };
    oportunidades.forEach((op: any) => {
      if (conteo[op.estado] !== undefined) {
        conteo[op.estado]++;
      }
    });
    return conteo;
  }, [oportunidades]);

  // ---- ACCIONES ---- //
  const abrirNuevaOportunidad = () => {
    setFormData({
      id: null,
      titulo: "",
      jugador_id: "",
      club_id: "",
      tipo: "Prueba deportiva",
      estado: "En negociación",
      monto_estimado: "",
      moneda: "US$",
      fecha_limite: "",
      notas: ""
    });
    setVistaModal("Formulario");
  };

  const abrirEditarOportunidad = (op: any) => {
    setFormData({
      id: op.id,
      titulo: op.titulo || "",
      jugador_id: op.jugador_id || "",
      club_id: op.club_id || "",
      tipo: op.tipo || "Prueba deportiva",
      estado: op.estado || "En negociación",
      monto_estimado: op.monto_estimado ? String(op.monto_estimado) : "",
      moneda: op.moneda || "US$",
      fecha_limite: op.fecha_limite || "",
      notas: op.notas || ""
    });
    setVistaModal("Formulario");
  };

  const abrirFicha = (op: any) => {
    setOportunidadActual(op);
    setVistaModal("Ficha");
  };

  const eliminarOportunidad = async (id: string, titulo: string) => {
    if (window.confirm(`¿Estás seguro que querés eliminar la oportunidad "${titulo}"?`)) {
      await supabase.from("oportunidades").delete().eq("id", id);
      cargarDatos();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const datosGuardar = {
        titulo: formData.titulo,
        jugador_id: formData.jugador_id || null,
        club_id: formData.club_id || null,
        tipo: formData.tipo,
        estado: formData.estado,
        monto_estimado: formData.monto_estimado ? Number(formData.monto_estimado) : null,
        moneda: formData.moneda,
        fecha_limite: formData.fecha_limite || null,
        notas: formData.notas,
        workspace_id: "75b5e7bd-2429-416c-9c17-b2b93ce726e9"
      };

      if (formData.id) {
        await supabase.from("oportunidades").update({ ...datosGuardar, actualizado_en: new Date().toISOString() }).eq("id", formData.id);
      } else {
        await supabase.from("oportunidades").insert([datosGuardar]);
      }

      await cargarDatos();
      setVistaModal(null);
    } catch (error) {
      alert("Hubo un error al guardar la oportunidad.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-8 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Oportunidades</h1>
            <p className="text-gray-400 text-sm">Seguimiento comercial de cada operación.</p>
          </div>
          <button onClick={abrirNuevaOportunidad} className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm">
            + Nueva oportunidad
          </button>
        </div>

        {/* Tarjetas de Métricas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Abiertas</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.abiertas}</div>
            <div className="text-[11px] text-gray-500">En curso</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vencidas</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.vencidas}</div>
            <div className="text-[11px] text-gray-500">Requieren atención</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cerradas</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.cerradas}</div>
            <div className="text-[11px] text-gray-500">Operaciones finalizadas</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Importe abierto</div>
            <div className="text-3xl font-black text-white mb-1">US$ {metricas.importeAbierto.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500">Por moneda registrada</div>
          </div>
        </div>

        {/* Pipeline Comercial y Filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 mb-6 gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mr-2">Pipeline comercial</span>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#1a1d24] border border-[#2a2d35] text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span> Inicial: {conteoPipeline["Inicial"]}
              </span>
              <span className="bg-[#1a1d24] border border-[#2a2d35] text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> En análisis: {conteoPipeline["En análisis"]}
              </span>
              <span className="bg-[#1a1d24] border border-[#2a2d35] text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> En negociación: {conteoPipeline["En negociación"]}
              </span>
              <span className="bg-[#1a1d24] border border-[#2a2d35] text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Pendiente: {conteoPipeline["Pendiente"]}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-[#1a1d24] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white focus:outline-none">
              <option value="Todos">Estado: Todos</option>
              {opcionesEstado.filter(e => e !== "Todos").map(est => <option key={est} value={est}>{est}</option>)}
            </select>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="bg-[#1a1d24] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white focus:outline-none">
              <option value="Todos">Tipo: Todos</option>
              {opcionesTipo.filter(t => t !== "Todos").map(tip => <option key={tip} value={tip}>{tip}</option>)}
            </select>
            {(filtroEstado !== "Todos" || filtroTipo !== "Todos" || filtroBusqueda) && (
              <button onClick={() => { setFiltroEstado("Todos"); setFiltroTipo("Todos"); setFiltroBusqueda(""); }} className="text-[12px] font-bold text-gray-400 hover:text-white transition px-2">Limpiar filtros</button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-xs">
            <svg className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Buscar oportunidad, jugador, club..." 
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-9 pr-4 text-[13px] text-gray-200 focus:outline-none focus:border-gray-500 transition placeholder-gray-500" 
            />
          </div>
          <div className="text-[11px] font-medium text-gray-400">{oportunidadesFiltradas.length} registros</div>
        </div>

        {/* Tabla */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando oportunidades...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[1000px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-8 w-[26%]">Oportunidad</th>
                    <th className="p-4 w-[16%]">Jugador</th>
                    <th className="p-4 w-[16%]">Club</th>
                    <th className="p-4 w-[12%]">Estado</th>
                    <th className="p-4 w-[11%]">Fecha Límite</th>
                    <th className="p-4 w-[11%]">Importe</th>
                    <th className="p-4 pr-6 text-right w-[18%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {oportunidadesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron oportunidades registradas</td>
                    </tr>
                  ) : (
                    oportunidadesFiltradas.map((op: any) => (
                      <tr key={op.id} className="hover:bg-[#1c1f26] transition group">
                        <td className="py-3 pl-8 pr-4 overflow-hidden">
                          <div className="font-bold text-white text-[13px] truncate">{op.titulo || "Sin título"}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate">{op.tipo || "—"}</div>
                        </td>
                        <td className="py-3 px-4 text-white text-[13px] truncate">{getNombreJugador(op.jugador_id)}</td>
                        <td className="py-3 px-4 text-white text-[13px] truncate">{getNombreClub(op.club_id)}</td>
                        <td className="py-3 px-4">
                          <span className="bg-[#1e2129] border border-[#2a2d35] text-gray-200 text-[11px] font-bold px-2.5 py-1 rounded-md inline-block truncate max-w-full">
                            {op.estado || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white text-[13px] truncate">{op.fecha_limite || "—"}</td>
                        <td className="py-3 px-4 text-white text-[13px] font-bold truncate">
                          {op.monto_estimado ? `${op.moneda || 'US$'} ${Number(op.monto_estimado).toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 pr-6 pl-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => abrirFicha(op)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-2.5 py-1.5 rounded transition">Ver ficha</button>
                            <button onClick={() => abrirEditarOportunidad(op)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#60a5fa] text-[11px] font-bold px-2.5 py-1.5 rounded transition">Editar</button>
                            <button onClick={() => eliminarOportunidad(op.id, op.titulo)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-[#f87171] text-[11px] font-bold px-2.5 py-1.5 rounded transition">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-center py-5 text-[11px] text-gray-500 border-t border-[#2a2d35]">
                Gestión comercial activa · Las operaciones se actualizan en tiempo real.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: FORMULARIO */}
      {vistaModal === "Formulario" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[650px] flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">{formData.id ? "Editar oportunidad" : "Nueva oportunidad"}</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="form-oportunidad" onSubmit={guardarFormulario} className="space-y-4">
                
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Título de la oportunidad *</label>
                  <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Ej: Búsqueda de Arquero Seria A" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Jugador representado</label>
                    <select name="jugador_id" value={formData.jugador_id} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="">Seleccionar jugador...</option>
                      {jugadores.map((j: any) => <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Club de destino</label>
                    <select name="club_id" value={formData.club_id} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="">Seleccionar club...</option>
                      {clubes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Tipo de operación</label>
                    <input type="text" name="tipo" value={formData.tipo} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Ej: Prueba deportiva, Fichaje" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Estado del pipeline</label>
                    <select name="estado" value={formData.estado} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="Inicial">Inicial</option>
                      <option value="En análisis">En análisis</option>
                      <option value="En negociación">En negociación</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Moneda</label>
                    <select name="moneda" value={formData.moneda} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="US$">US$ (Dólares)</option>
                      <option value="€">€ (Euros)</option>
                      <option value="$">$ (Pesos)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Monto estimado</label>
                    <input type="number" name="monto_estimado" value={formData.monto_estimado} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Fecha límite / Plazo</label>
                  <input type="date" name="fecha_limite" value={formData.fecha_limite} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-gray-300 focus:outline-none focus:border-gray-500 transition [color-scheme:dark]" />
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Notas / Observaciones</label>
                  <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition resize-none"></textarea>
                </div>

              </form>
            </div>

            <div className="px-6 py-5 border-t border-[#2a2d35] shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] hover:bg-[#2a2d35] rounded-lg transition">Cancelar</button>
              <button type="submit" form="form-oportunidad" disabled={guardando} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px]">{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: FICHA */}
      {vistaModal === "Ficha" && oportunidadActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">Ficha de Oportunidad</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-5">
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{oportunidadActual.titulo}</h3>
                <p className="text-[#4ade80] font-bold text-[13px]">{oportunidadActual.tipo || "Gestión comercial"}</p>
              </div>

              <div className="bg-[#15181f] p-5 rounded-lg border border-[#2a2d35] space-y-4">
                <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-bold border-b border-[#2a2d35] pb-2">Detalles de la Operación</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Jugador Asociado</span>
                    <span className="text-gray-200 text-[13px] font-bold">{getNombreJugador(oportunidadActual.jugador_id)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Club Destino</span>
                    <span className="text-gray-200 text-[13px] font-bold">{getNombreClub(oportunidadActual.club_id)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Estado</span>
                    <span className="text-gray-200 text-[13px] font-bold">{oportunidadActual.estado || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Fecha Límite</span>
                    <span className="text-gray-200 text-[13px] font-bold">{oportunidadActual.fecha_limite || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Importe Estimado</span>
                    <span className="text-white text-base font-black">
                      {oportunidadActual.monto_estimado ? `${oportunidadActual.moneda || 'US$'} ${Number(oportunidadActual.monto_estimado).toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {oportunidadActual.notas && (
                <div className="bg-[#15181f] p-5 rounded-lg border border-[#2a2d35]">
                  <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-3 border-b border-[#2a2d35] pb-2">Observaciones</h4>
                  <p className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">{oportunidadActual.notas}</p>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-[#2a2d35] bg-[#1a1d24] flex justify-end shrink-0">
              <button onClick={() => setVistaModal(null)} className="px-5 py-2.5 text-[13px] font-bold text-white hover:text-gray-300 transition">
                Cerrar ficha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}