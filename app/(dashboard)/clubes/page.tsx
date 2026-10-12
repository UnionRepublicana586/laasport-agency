"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Clubes() {
  const [clubes, setClubes] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroPais, setFiltroPais] = useState("Todos");
  const [filtroDivision, setFiltroDivision] = useState("Todas");

  // Sistema de Modales
  const [vistaModal, setVistaModal] = useState<"Formulario" | "Ficha" | null>(null);
  const [clubActual, setClubActual] = useState<any>(null);
  
  // Formulario
  const [guardando, setGuardando] = useState(false);
  const [archivoEscudo, setArchivoEscudo] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    id: null as string | null,
    nombre: "", pais: "", ciudad: "", division: "", 
    web: "", notas: "", escudo_url: ""
  });

  const WORKSPACE_ID = "75b5e7bd-2429-416c-9c17-b2b93ce726e9";

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const [resClubes, resContratos] = await Promise.all([
      supabase.from("clubes").select("*").order('nombre', { ascending: true }),
      supabase.from("contratos").select("club_id, jugador_id, tipo_contrato")
    ]);
    
    if (!resClubes.error) setClubes(resClubes.data || []);
    if (!resContratos.error) setContratos(resContratos.data || []);
    
    setCargando(false);
  }

  const armarLinkEscudo = (ruta: string) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta; 
    const rutaLimpiada = ruta.startsWith("/") ? ruta.substring(1) : ruta;
    return `https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/${rutaLimpiada}`;
  };

  const formatearLinkWeb = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const getCantidadJugadores = (clubId: string) => {
    const contratosClub = contratos.filter((c: any) => c.club_id === clubId);
    const jugadoresUnicos = new Set(contratosClub.map((c: any) => c.jugador_id));
    return jugadoresUnicos.size;
  };

  const opcionesPais = ["Todos", ...Array.from(new Set(clubes.map((c: any) => c.pais).filter(Boolean)))];
  const opcionesDivision = ["Todas", ...Array.from(new Set(clubes.map((c: any) => c.division).filter(Boolean)))];

  const clubesFiltrados = useMemo(() => {
    return clubes.filter((c: any) => {
      const matchBusqueda = !filtroBusqueda || `${c.nombre} ${c.ciudad}`.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const matchPais = filtroPais === "Todos" || c.pais === filtroPais;
      const matchDiv = filtroDivision === "Todas" || c.division === filtroDivision;
      return matchBusqueda && matchPais && matchDiv;
    });
  }, [clubes, filtroBusqueda, filtroPais, filtroDivision]);

  const clubesAgrupadosPorPais = useMemo(() => {
    const grupos = clubesFiltrados.reduce((acc: any, club: any) => {
      const pais = club.pais || "Otros / Sin país";
      if (!acc[pais]) acc[pais] = [];
      acc[pais].push(club);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(grupos)
      .sort((a, b) => {
        if (a === "Otros / Sin país") return 1;
        if (b === "Otros / Sin país") return -1;
        return a.localeCompare(b);
      })
      .map(pais => ({
        pais,
        clubes: grupos[pais]
      }));
  }, [clubesFiltrados]);

  const abrirNuevoClub = () => {
    setFormData({ id: null, nombre: "", pais: "", ciudad: "", division: "", web: "", notas: "", escudo_url: "" });
    setArchivoEscudo(null);
    setVistaModal("Formulario");
  };

  const abrirEditarClub = (club: any) => {
    setFormData({ 
      id: club.id,
      nombre: club.nombre || "",
      pais: club.pais || "",
      ciudad: club.ciudad || "",
      division: club.division || "",
      web: club.web || "",
      notas: club.notas || "",
      escudo_url: club.escudo_url || ""
    });
    setArchivoEscudo(null);
    setVistaModal("Formulario");
  };

  const abrirFicha = (club: any) => {
    setClubActual(club);
    setVistaModal("Ficha");
  };

  const eliminarClub = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro que querés eliminar definitivamente a ${nombre}?`)) {
      await supabase.from("clubes").delete().eq("id", id);
      cargarDatos();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      let escudoUrl = formData.escudo_url;
      if (archivoEscudo) {
        const fileExt = archivoEscudo.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/clubes/${crypto.randomUUID()}.${fileExt}`;
        const { error: errorEscudo } = await supabase.storage
          .from("laasport-media")
          .upload(fileName, archivoEscudo, { upsert: true });

        if (errorEscudo) {
          console.error("Error al subir escudo:", errorEscudo);
          alert(`Error al subir el escudo: ${errorEscudo.message}`);
          setGuardando(false);
          return;
        }
        escudoUrl = fileName;
      }

      const datosGuardar = {
        nombre: formData.nombre, 
        pais: formData.pais, 
        ciudad: formData.ciudad,
        division: formData.division, 
        web: formData.web, 
        notas: formData.notas, 
        escudo_url: escudoUrl, 
        workspace_id: WORKSPACE_ID
      };

      if (formData.id) {
        await supabase.from("clubes").update(datosGuardar).eq("id", formData.id);
      } else {
        await supabase.from("clubes").insert([datosGuardar]);
      }
      
      await cargarDatos(); 
      setVistaModal(null);            
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  // ---- GENERADOR DE PDF INSTITUCIONAL CON LOGO COMPLETO ---- //
  const generarPDF = () => {
    if (!clubActual) return;
    const logoClubUrl = clubActual.escudo_url ? armarLinkEscudo(clubActual.escudo_url) : null;
    const logoEmpresaUrl = "https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/75b5e7bd-2429-416c-9c17-b2b93ce726e9/logo/logoblanco.png";

    const ventana = window.open('', '_blank');
    if (!ventana) return alert("Habilitá las ventanas emergentes para generar el PDF.");

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dossier Institucional - ${clubActual.nombre}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 40px 50px; background: #fff; }
          
          .header-membrete { width: 100%; border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 35px; overflow: hidden; }
          .logo-box { float: left; background: #15181f; padding: 10px 18px; border-radius: 8px; display: inline-block; }
          .logo-empresa { height: 35px; width: auto; object-fit: contain; display: block; }
          .dossier-tag { float: right; font-size: 11px; letter-spacing: 2px; color: #555; text-transform: uppercase; font-weight: bold; margin-top: 15px; }
          .clearfix { clear: both; }

          .profile-container { display: flex; align-items: center; gap: 30px; margin-bottom: 35px; background: #f8f9fa; padding: 25px; border-radius: 12px; border: 1px solid #e9ecef; }
          .avatar { width: 130px; height: 130px; border-radius: 10px; object-fit: contain; background: #fff; border: 1px solid #ccc; padding: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .avatar-placeholder { width: 130px; height: 130px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 45px; color: #555; background: #e9ecef; border: 1px solid #ccc; font-weight: bold; }
          
          .info-main { flex: 1; }
          .name { font-size: 34px; font-weight: 900; margin: 0 0 8px 0; text-transform: uppercase; color: #111; letter-spacing: -0.5px; }
          .location-row { font-size: 18px; color: #555; font-weight: bold; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; background: #1a1d24; color: #fff; padding: 8px 12px; margin-bottom: 15px; border-radius: 4px; letter-spacing: 1px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 30px; padding: 0 10px; }
          .data-group { margin-bottom: 6px; }
          .label { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; font-weight: 700; }
          .value { font-size: 15px; font-weight: bold; color: #111; }
          .notes { font-size: 13px; line-height: 1.6; color: #333; padding: 0 10px; white-space: pre-wrap; }
          
          .footer-print { margin-top: 50px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; letter-spacing: 1px; text-transform: uppercase; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        
        <div class="header-membrete">
          <div class="logo-box">
            <img src="${logoEmpresaUrl}" class="logo-empresa" alt="LAASPORT Logo" />
          </div>
          <div class="dossier-tag">Dossier Institucional · Red de Clubes</div>
          <div class="clearfix"></div>
        </div>

        <div class="profile-container">
          ${logoClubUrl ? `<img src="${logoClubUrl}" class="avatar" />` : `<div class="avatar-placeholder">${clubActual.nombre.charAt(0)}</div>`}
          <div class="info-main">
            <h1 class="name">${clubActual.nombre}</h1>
            <div class="location-row">${clubActual.ciudad || 'Ciudad no especificada'}, ${clubActual.pais || 'País no especificado'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Información Institucional</div>
          <div class="grid">
            <div class="data-group"><div class="label">País</div><div class="value">${clubActual.pais || '—'}</div></div>
            <div class="data-group"><div class="label">Ciudad</div><div class="value">${clubActual.ciudad || '—'}</div></div>
            <div class="data-group"><div class="label">División / Liga</div><div class="value">${clubActual.division || '—'}</div></div>
            <div class="data-group"><div class="label">Sitio Web Oficial</div><div class="value">${clubActual.web || '—'}</div></div>
          </div>
        </div>

        ${clubActual.notas ? `
        <div class="section">
          <div class="section-title">Anotaciones / Referencias</div>
          <div class="notes">${clubActual.notas.replace(/\n/g, '<br/>')}</div>
        </div>
        ` : ''}

        <div class="footer-print">
          LAASPORT Agency Management · Documento confidencial para gestión institucional
        </div>
        
      </body>
      </html>
    `);
    
    ventana.document.close();
    setTimeout(() => { ventana.print(); }, 500);
  };

  return (
    <div className="p-6 font-sans w-full">
      <div className="max-w-[1500px] mx-auto">
        
        <div className="flex justify-between items-start mb-10 mt-2">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">
              LAASPORT AGENCY · MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Clubes</h1>
            <p className="text-gray-400 text-sm">Construí y mantené tu red de instituciones deportivas.</p>
          </div>
          <button onClick={abrirNuevoClub} className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm cursor-pointer">
            + Nuevo club
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-6">
          <div className="relative w-full md:max-w-xs">
            <input type="text" placeholder="Buscar club, ciudad..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-3 pr-4 text-[13px] text-gray-200 focus:outline-none" />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select value={filtroPais} onChange={(e) => setFiltroPais(e.target.value)} className="bg-[#15181f] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white">
              {opcionesPais.map((op: any) => <option key={op} value={op}>{op}</option>)}
            </select>
            <select value={filtroDivision} onChange={(e) => setFiltroDivision(e.target.value)} className="bg-[#15181f] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white">
              {opcionesDivision.map((op: any) => <option key={op} value={op}>{op}</option>)}
            </select>
            {(filtroBusqueda || filtroPais !== "Todos" || filtroDivision !== "Todas") && (
              <button onClick={() => { setFiltroBusqueda(""); setFiltroPais("Todos"); setFiltroDivision("Todas"); }} className="text-[12px] font-bold text-gray-400 hover:text-white transition px-2 cursor-pointer">Limpiar</button>
            )}
          </div>
        </div>

        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando clubes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[800px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-8 w-[30%]">Club Institución</th>
                    <th className="p-4 w-[15%]">División</th>
                    <th className="p-4 w-[15%]">Ciudad</th>
                    <th className="p-4 w-[15%] text-center">Jugadores</th>
                    <th className="p-4 pr-6 text-right w-[25%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {clubesAgrupadosPorPais.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron resultados</td></tr>
                  ) : (
                    clubesAgrupadosPorPais.map((grupo: any) => (
                      <React.Fragment key={grupo.pais}>
                        
                        <tr className="bg-[#1e2129]">
                          <td colSpan={5} className="px-6 py-3 border-y border-[#2a2d35]">
                            <div className="flex items-center gap-3">
                              <h3 className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">{grupo.pais}</h3>
                              <span className="text-[10px] text-gray-400 bg-[#2a2d35] px-2.5 py-0.5 rounded-full font-bold">{grupo.clubes.length}</span>
                            </div>
                          </td>
                        </tr>

                        {grupo.clubes.map((club: any) => {
                          const cantJugadores = getCantidadJugadores(club.id);
                          return (
                            <tr key={club.id} className="hover:bg-[#1c1f26] transition group">
                              <td className="py-3 pl-8 pr-4 overflow-hidden">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 shrink-0 rounded-full border border-[#304058] bg-white flex items-center justify-center overflow-hidden shadow-sm p-1">
                                    {club.escudo_url ? (
                                      <img src={armarLinkEscudo(club.escudo_url)} alt={club.nombre} className="w-full h-full object-contain" />
                                    ) : (
                                      <div className="text-black font-bold text-lg">{club.nombre?.charAt(0)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-white text-[13px] truncate">{club.nombre}</div>
                                    {club.web && (
                                      <a 
                                        href={formatearLinkWeb(club.web)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[11px] text-[#60a5fa] mt-0.5 truncate hover:underline block w-max max-w-full"
                                        title="Abrir sitio web"
                                      >
                                        {club.web}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white text-[13px] truncate">{club.division || "—"}</td>
                              <td className="py-3 px-4 text-white text-[13px] truncate">{club.ciudad || "—"}</td>
                              
                              <td className="py-3 px-4 text-center">
                                {cantJugadores > 0 ? (
                                  <span className="bg-[#253246] text-[#60a5fa] border border-[#304058] px-2.5 py-1 rounded-md text-[11px] font-bold">
                                    {cantJugadores}
                                  </span>
                                ) : (
                                  <span className="text-gray-600 text-[11px] font-bold">—</span>
                                )}
                              </td>

                              <td className="py-3 pr-6 pl-4 text-right">
                                <div className="flex items-center justify-end gap-1 flex-nowrap">
                                  <button onClick={() => abrirFicha(club)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Ficha</button>
                                  <button onClick={() => abrirEditarClub(club)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#60a5fa] text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Editar</button>
                                  <button onClick={() => eliminarClub(club.id, club.nombre)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-[#f87171] text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Elim.</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: FORMULARIO */}
      {vistaModal === "Formulario" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">{formData.id ? "Editar club" : "Nuevo club"}</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition cursor-pointer">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="form-club" onSubmit={guardarFormulario} className="space-y-4">
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nombre del club *</label>
                  <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" placeholder="Ej: Provincial" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">País</label>
                    <input type="text" name="pais" value={formData.pais} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" placeholder="Argentina" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Ciudad</label>
                    <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" placeholder="Rosario" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">División</label>
                    <input type="text" name="division" value={formData.division} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Sitio web</label>
                    <input type="text" name="web" value={formData.web} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Notas</label>
                  <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Escudo del Club (Opcional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setArchivoEscudo(e.target.files?.[0] || null)} className="w-full text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1115] file:text-white" />
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-[#2a2d35] shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] hover:bg-[#2a2d35] rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" form="form-club" disabled={guardando} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] cursor-pointer">{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FICHA */}
      {vistaModal === "Ficha" && clubActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">Ficha Institucional</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition cursor-pointer">✕</button>
            </div>
            <div className="p-6 md:p-8 flex flex-col items-center text-center overflow-y-auto">
              <div className="w-28 h-28 shrink-0 rounded-full border-4 border-[#15181f] overflow-hidden mb-4 bg-white flex items-center justify-center shadow-lg p-2">
                {clubActual.escudo_url ? <img src={armarLinkEscudo(clubActual.escudo_url)} alt="Escudo" className="w-full h-full object-contain shrink-0" /> : <div className="text-4xl font-bold text-black">{clubActual.nombre.charAt(0)}</div>}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 shrink-0">{clubActual.nombre}</h3>
              <p className="text-[#60a5fa] font-bold text-[14px] mb-8 shrink-0">{clubActual.division || "Sin División"}</p>
              <div className="w-full space-y-4 text-left">
                <div className="bg-[#15181f] p-5 rounded-lg border border-[#2a2d35]">
                  <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-4 border-b border-[#2a2d35] pb-2">Datos de Ubicación e Info</h4>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div><span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">País</span><span className="text-gray-200 text-[13px] font-bold">{clubActual.pais || "—"}</span></div>
                    <div><span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ciudad</span><span className="text-gray-200 text-[13px] font-bold">{clubActual.ciudad || "—"}</span></div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Sitio Web</span>
                      {clubActual.web ? (
                        <a href={formatearLinkWeb(clubActual.web)} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline text-[13px] font-bold">{clubActual.web}</a>
                      ) : (
                        <span className="text-gray-200 text-[13px] font-bold">—</span>
                      )}
                    </div>
                  </div>
                </div>
                {clubActual.notas && (
                  <div className="bg-[#15181f] p-5 rounded-lg border border-[#2a2d35]">
                    <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-3 border-b border-[#2a2d35] pb-2">Anotaciones / Referencias</h4>
                    <p className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">{clubActual.notas}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#2a2d35] bg-[#1a1d24] flex justify-between items-center shrink-0">
              <button onClick={generarPDF} className="bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition text-[13px] flex items-center gap-2 cursor-pointer">Descargar Dossier Institucional</button>
              <button onClick={() => setVistaModal(null)} className="px-5 py-2.5 text-[13px] font-bold text-gray-400 hover:text-white transition cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}