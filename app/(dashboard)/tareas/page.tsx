"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Tareas() {
  const [tareas, setTareas] = useState<any[]>([]);
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroMostrar, setFiltroMostrar] = useState("Todas");
  const [fechaHoy, setFechaHoy] = useState("");

  // Sistema de Modales
  const [vistaModal, setVistaModal] = useState<"Formulario" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    titulo: "",
    descripcion: "",
    oportunidad_id: "",
    fecha_vencimiento: "",
    prioridad: "media",
    estado: "Pendiente"
  });

  useEffect(() => {
    // Calculamos la fecha en el cliente para evitar el bloqueo de Next.js
    setFechaHoy(new Date().toISOString().split("T")[0]);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const [resTareas, resOportunidades] = await Promise.all([
      supabase.from("tareas").select("*").order('creado_en', { ascending: false }),
      supabase.from("oportunidades").select("id, titulo")
    ]);

    if (!resTareas.error) setTareas(resTareas.data || []);
    if (!resOportunidades.error) setOportunidades(resOportunidades.data || []);
    setCargando(false);
  }

  // Métricas superiores
  const metricas = useMemo(() => {
    let pendientes = 0;
    let vencidas = 0;
    let vencenHoy = 0;
    let proximos7Dias = 0;

    tareas.forEach((t: any) => {
      const estado = t.estado || "";
      const esCompletada = estado.toLowerCase() === "completada";

      if (!esCompletada) {
        pendientes++;
        if (t.fecha_vencimiento && fechaHoy) {
          const fechaVencStr = t.fecha_vencimiento.split("T")[0];
          if (fechaVencStr < fechaHoy) {
            vencidas++;
          } else if (fechaVencStr === fechaHoy) {
            vencenHoy++;
          } else {
            const diffTime = new Date(fechaVencStr).getTime() - new Date(fechaHoy).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0 && diffDays <= 7) {
              proximos7Dias++;
            }
          }
        }
      }
    });

    return { pendientes, vencidas, vencenHoy, proximos7Dias };
  }, [tareas, fechaHoy]);

  // Filtrado de la tabla
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t: any) => {
      const titulo = (t.titulo || "").toLowerCase();
      const desc = (t.descripcion || "").toLowerCase();
      const matchBusqueda = !filtroBusqueda || titulo.includes(filtroBusqueda.toLowerCase()) || desc.includes(filtroBusqueda.toLowerCase());
      
      let matchMostrar = true;
      if (filtroMostrar === "Pendientes") {
        matchMostrar = (t.estado || "").toLowerCase() !== "completada";
      } else if (filtroMostrar === "Completadas") {
        matchMostrar = (t.estado || "").toLowerCase() === "completada";
      }

      return matchBusqueda && matchMostrar;
    });
  }, [tareas, filtroBusqueda, filtroMostrar]);

  // ---- ACCIONES ---- //
  const abrirNuevaTarea = () => {
    setFormData({
      id: null,
      titulo: "",
      descripcion: "",
      oportunidad_id: "",
      fecha_vencimiento: "",
      prioridad: "media",
      estado: "Pendiente"
    });
    setVistaModal("Formulario");
  };

  const abrirEditarTarea = (t: any) => {
    setFormData({
      id: t.id,
      titulo: t.titulo || "",
      descripcion: t.descripcion || "",
      oportunidad_id: t.oportunidad_id || "",
      fecha_vencimiento: t.fecha_vencimiento ? t.fecha_vencimiento.split("T")[0] : "",
      prioridad: t.prioridad || "media",
      estado: t.estado || "Pendiente"
    });
    setVistaModal("Formulario");
  };

  const toggleCompletada = async (t: any) => {
    const nuevoEstado = (t.estado || "").toLowerCase() === "completada" ? "Pendiente" : "Completada";
    await supabase.from("tareas").update({ estado: nuevoEstado }).eq("id", t.id);
    cargarDatos();
  };

  const eliminarTarea = async (id: string, titulo: string) => {
    if (window.confirm(`¿Estás seguro que querés eliminar la tarea "${titulo}"?`)) {
      await supabase.from("tareas").delete().eq("id", id);
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
        descripcion: formData.descripcion,
        oportunidad_id: formData.oportunidad_id || null,
        fecha_vencimiento: formData.fecha_vencimiento ? new Date(formData.fecha_vencimiento).toISOString() : null,
        prioridad: formData.prioridad,
        estado: formData.estado,
        workspace_id: "75b5e7bd-2429-416c-9c17-b2b93ce726e9"
      };

      if (formData.id) {
        await supabase.from("tareas").update(datosGuardar).eq("id", formData.id);
      } else {
        await supabase.from("tareas").insert([datosGuardar]);
      }

      await cargarDatos();
      setVistaModal(null);
    } catch (error) {
      alert("Hubo un error al guardar la tarea.");
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
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Tareas</h1>
            <p className="text-gray-400 text-sm">Organizá el trabajo y las próximas acciones.</p>
          </div>
          <button onClick={abrirNuevaTarea} className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm">
            + Nueva tarea
          </button>
        </div>

        {/* Tarjetas de Métricas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pendientes</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.pendientes}</div>
            <div className="text-[11px] text-gray-500">Todas las gestiones abiertas</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vencidas</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.vencidas}</div>
            <div className="text-[11px] text-gray-500">Requieren atención inmediata</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vencen hoy</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.vencenHoy}</div>
            <div className="text-[11px] text-gray-500">Para resolver durante el día</div>
          </div>
          <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl p-5 shadow-md">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Próximos 7 días</div>
            <div className="text-3xl font-black text-white mb-1">{metricas.proximos7Dias}</div>
            <div className="text-[11px] text-gray-500">Vencimientos cercanos</div>
          </div>
        </div>

        {/* Filtros y Buscador */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full max-w-xs">
            <svg className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Buscar tarea, descripción..." 
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-9 pr-4 text-[13px] text-gray-200 focus:outline-none focus:border-gray-500 transition placeholder-gray-500" 
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-400 font-medium">Mostrar</span>
            <select value={filtroMostrar} onChange={(e) => setFiltroMostrar(e.target.value)} className="bg-[#15181f] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white focus:outline-none">
              <option value="Todas">Todas</option>
              <option value="Pendientes">Pendientes</option>
              <option value="Completadas">Completadas</option>
            </select>
          </div>
        </div>

        {/* Tabla de Tareas */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando tareas...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[900px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-8 w-[38%]">Tarea</th>
                    <th className="p-4 w-[18%]">Vencimiento</th>
                    <th className="p-4 w-[14%]">Prioridad</th>
                    <th className="p-4 w-[14%]">Estado</th>
                    <th className="p-4 pr-6 text-right w-[16%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {tareasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron tareas registradas</td>
                    </tr>
                  ) : (
                    tareasFiltradas.map((t: any) => {
                      const esCompletada = (t.estado || "").toLowerCase() === "completada";
                      return (
                        <tr key={t.id} className="hover:bg-[#1c1f26] transition group">
                          <td className="py-3 pl-8 pr-4 overflow-hidden">
                            <div className="flex items-start gap-3">
                              <input 
                                type="checkbox" 
                                checked={esCompletada} 
                                onChange={() => toggleCompletada(t)} 
                                className="mt-1 w-4 h-4 rounded border-[#2a2d35] bg-[#15181f] text-blue-600 focus:ring-0 cursor-pointer" 
                              />
                              <div className="min-w-0 flex-1">
                                <div className={`font-bold text-[13px] truncate ${esCompletada ? 'text-gray-500 line-through' : 'text-white'}`}>
                                  {t.titulo || "Sin título"}
                                </div>
                                {t.descripcion && (
                                  <div className="text-[11px] text-gray-400 mt-0.5 truncate">{t.descripcion}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white text-[13px] truncate">
                            {t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> {t.prioridad || "media"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-block ${esCompletada ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-[#1e2129] border border-[#2a2d35] text-gray-200'}`}>
                              {t.estado || "Pendiente"}
                            </span>
                          </td>
                          <td className="py-3 pr-6 pl-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => abrirEditarTarea(t)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#60a5fa] text-[11px] font-bold px-2.5 py-1.5 rounded transition">Editar</button>
                              <button onClick={() => eliminarTarea(t.id, t.titulo)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-[#f87171] text-[11px] font-bold px-2.5 py-1.5 rounded transition">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="text-center py-5 text-[11px] text-gray-500 border-t border-[#2a2d35]">
                Las tareas se sincronizan en tiempo real con Supabase.
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: NUEVA / EDITAR TAREA */}
      {vistaModal === "Formulario" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[550px] flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">{formData.id ? "Editar tarea" : "Nueva tarea"}</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="form-tarea" onSubmit={guardarFormulario} className="space-y-4">
                
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Título de la tarea *</label>
                  <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Ej: [Reunión] Con el Preparador Físico" />
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Descripción o subtítulo</label>
                  <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Ej: ver rendimiento" />
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Oportunidad asociada (Opcional)</label>
                  <select name="oportunidad_id" value={formData.oportunidad_id} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                    <option value="">Ninguna oportunidad</option>
                    {oportunidades.map((op: any) => <option key={op.id} value={op.id}>{op.titulo}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Fecha de vencimiento</label>
                    <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-gray-300 focus:outline-none focus:border-gray-500 transition [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Prioridad</label>
                    <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>

              </form>
            </div>

            <div className="px-6 py-5 border-t border-[#2a2d35] shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] hover:bg-[#2a2d35] rounded-lg transition">Cancelar</button>
              <button type="submit" form="form-tarea" disabled={guardando} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px]">{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}