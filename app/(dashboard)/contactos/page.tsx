"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Contactos() {
  const [contactos, setContactos] = useState<any[]>([]);
  const [clubes, setClubes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtro de búsqueda
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  // Sistema de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null as string | null,
    nombre: "", 
    cargo: "", 
    club_id: "", 
    telefono: "", 
    email: "",
    notas: ""
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const { data: dataContactos } = await supabase
      .from("contactos")
      .select("*")
      .order('creado_en', { ascending: false });
      
    const { data: dataClubes } = await supabase
      .from("clubes")
      .select("id, nombre");

    if (dataContactos) setContactos(dataContactos);
    if (dataClubes) setClubes(dataClubes);
    
    setCargando(false);
  }

  const obtenerNombreClub = (id: string) => {
    if (!id) return "—";
    const club = clubes.find(c => c.id === id);
    return club ? club.nombre : "—";
  };

  const obtenerIniciales = (nombreCompleto: string) => {
    if (!nombreCompleto) return "";
    const partes = nombreCompleto.trim().split(" ");
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombreCompleto.substring(0, 2).toUpperCase();
  };

  const contactosFiltrados = useMemo(() => {
    return contactos.filter(c => {
      if (!filtroBusqueda) return true;
      const busqueda = filtroBusqueda.toLowerCase();
      const nombreClub = obtenerNombreClub(c.club_id).toLowerCase();
      
      return (
        (c.nombre && c.nombre.toLowerCase().includes(busqueda)) ||
        (c.cargo && c.cargo.toLowerCase().includes(busqueda)) ||
        nombreClub.includes(busqueda)
      );
    });
  }, [contactos, filtroBusqueda, clubes]);

  const abrirNuevoContacto = () => {
    setFormData({ id: null, nombre: "", cargo: "", club_id: "", telefono: "", email: "", notas: "" });
    setIsModalOpen(true);
  };

  const abrirEditarContacto = (contacto: any) => {
    setFormData({ 
      id: contacto.id,
      nombre: contacto.nombre || "", 
      cargo: contacto.cargo || "", 
      club_id: contacto.club_id || "", 
      telefono: contacto.telefono || "", 
      email: contacto.email || "",
      notas: contacto.notas || ""
    });
    setIsModalOpen(true);
  };

  const eliminarContacto = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro que querés eliminar a ${nombre}?`)) {
      const { error } = await supabase.from("contactos").delete().eq("id", id);
      if (error) alert(`Error al eliminar: ${error.message}`);
      else cargarDatos();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    
    try {
      const datosGuardar: any = {
        nombre: formData.nombre, 
        cargo: formData.cargo,
        telefono: formData.telefono, 
        email: formData.email,
        notas: formData.notas,
        workspace_id: "75b5e7bd-2429-416c-9c17-b2b93ce726e9"
      };

      if (formData.club_id && formData.club_id !== "") {
        datosGuardar.club_id = formData.club_id;
      } else {
        datosGuardar.club_id = null;
      }

      let errorSupabase = null;

      if (formData.id) {
        const { error } = await supabase.from("contactos").update(datosGuardar).eq("id", formData.id);
        errorSupabase = error;
      } else {
        const { error } = await supabase.from("contactos").insert([datosGuardar]);
        errorSupabase = error;
      }
      
      if (errorSupabase) {
        alert(`Error al guardar: ${errorSupabase.message}`);
        setGuardando(false);
        return;
      }
      
      await cargarDatos(); 
      setIsModalOpen(false);             
    } catch (error: any) {
      alert("Hubo un error de conexión en la aplicación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-10 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Contactos</h1>
            <p className="text-gray-400 text-sm">Personas clave y vínculos con clubes.</p>
          </div>
          <button onClick={abrirNuevoContacto} className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm">
            + Nuevo contacto
          </button>
        </div>

        {/* Buscador */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-xs">
            <svg className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Buscar contacto, cargo, club..." 
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-9 pr-4 text-[13px] text-gray-200 focus:outline-none focus:border-gray-500 transition placeholder-gray-500" 
            />
          </div>
          <div className="text-[11px] font-medium text-gray-400">
            {contactosFiltrados.length} registros
          </div>
        </div>

        {/* Tabla Optimizada (table-fixed y truncate) */}
        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando contactos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[700px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-6 w-[28%]">Contacto</th>
                    <th className="p-4 w-[15%]">Cargo</th>
                    <th className="p-4 w-[17%]">Club</th>
                    <th className="p-4 w-[14%]">Teléfono</th>
                    <th className="p-4 w-[16%]">Email</th>
                    <th className="p-4 pr-6 text-right w-[10%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {contactosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron resultados</td>
                    </tr>
                  ) : (
                    contactosFiltrados.map((contacto) => (
                      <tr key={contacto.id} className="hover:bg-[#1c1f26] transition group">
                        <td className="p-4 pl-6 overflow-hidden">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#253246] border border-[#304058] flex items-center justify-center text-white font-bold text-sm">
                              {obtenerIniciales(contacto.nombre)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-[13px] truncate" title={contacto.nombre}>{contacto.nombre}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5 truncate" title={contacto.email}>{contacto.email || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-white text-[13px] truncate" title={contacto.cargo}>{contacto.cargo || "—"}</td>
                        <td className="p-4 text-white text-[13px] truncate" title={obtenerNombreClub(contacto.club_id)}>{obtenerNombreClub(contacto.club_id)}</td>
                        <td className="p-4 text-white text-[13px] truncate" title={contacto.telefono}>{contacto.telefono || "—"}</td>
                        <td className="p-4 text-white text-[13px] truncate" title={contacto.email}>{contacto.email || "—"}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => abrirEditarContacto(contacto)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-3 py-1.5 rounded-md transition">
                              Editar
                            </button>
                            <button onClick={() => eliminarContacto(contacto.id, contacto.nombre)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-white hover:text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-md transition">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-center py-5 text-[11px] text-gray-500 border-t border-[#2a2d35]">
                Datos de ejemplo para la maqueta · Las modificaciones son temporales en esta vista.
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL CLONADO DEL HTML */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35]">
              <h2 className="text-[15px] font-bold text-white tracking-wide">
                {formData.id ? "Editar contacto" : "Nuevo contacto"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="form-contacto" onSubmit={guardarFormulario} className="space-y-5">
                
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nombre completo</label>
                  <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Luciano Avellino" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Cargo</label>
                    <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="Presidente" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Club vinculado</label>
                    <select name="club_id" value={formData.club_id} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition">
                      <option value="">Ninguno</option>
                      {clubes.map(club => (
                        <option key={club.id} value={club.id}>{club.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Teléfono</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="93475588999" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition" placeholder="luchoavellino@gmail.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Notas</label>
                  <textarea name="notas" value={formData.notas} onChange={handleChange} rows={4} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none focus:border-gray-500 transition resize-none"></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-5 border-t border-[#2a2d35] flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] hover:bg-[#2a2d35] rounded-lg transition">
                Cancelar
              </button>
              <button type="submit" form="form-contacto" disabled={guardando} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px]">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}