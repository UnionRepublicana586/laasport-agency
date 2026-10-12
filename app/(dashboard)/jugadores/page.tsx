"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Jugadores() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [clubes, setClubes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("Todas");
  const [filtroNacionalidad, setFiltroNacionalidad] = useState("Todas");

  // Sistema de Modales Unificado
  const [vistaModal, setVistaModal] = useState<"Formulario" | "Ficha" | "Historial" | "Contratos" | "Foto" | null>(null);
  const [jugadorActual, setJugadorActual] = useState<any>(null);
  
  // Estado para Contratos del Jugador seleccionado
  const [listaContratos, setListaContratos] = useState<any[]>([]);
  const [cargandoContratos, setCargandoContratos] = useState(false);
  const [contratoEditandoId, setContratoEditandoId] = useState<string | null>(null);
  
  const [nuevoContrato, setNuevoContrato] = useState({
    tipo_contrato: "Representacion",
    titulo: "",
    club_id: "",
    fecha_inicio: "",
    fecha_vencimiento: "",
    porcentaje_comision: "",
    monto_contrato: "",
    moneda: "EUR",
    cantidad_cuotas: "1",
    archivo: null as File | null,
    notas: ""
  });
  const [guardandoContrato, setGuardandoContrato] = useState(false);

  // Formulario de Jugador
  const [guardando, setGuardando] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [archivoPasaporte1, setArchivoPasaporte1] = useState<File | null>(null);
  const [archivoPasaporte2, setArchivoPasaporte2] = useState<File | null>(null);
  const [archivoPasaporte3, setArchivoPasaporte3] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    id: null as string | null,
    nombreCompleto: "", 
    fecha_nacimiento: "", 
    posicion: "",
    pierna_habil: "Izquierda", 
    nacionalidad: "", 
    nacionalidad_2: "", 
    nacionalidad_3: "",
    telefono: "", 
    email: "", 
    domicilio: "",
    vencimiento_pasaporte_1: "",
    pasaporte_1_url: "",
    vencimiento_pasaporte_2: "",
    pasaporte_2_url: "",
    vencimiento_pasaporte_3: "",
    pasaporte_3_url: "",
    estado: "Activo", 
    notas: "",
    foto_url: ""
  });

  const WORKSPACE_ID = "75b5e7bd-2429-416c-9c17-b2b93ce726e9";

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const [resJugadores, resClubes] = await Promise.all([
      supabase.from("jugadores").select("*").order('creado_en', { ascending: false }),
      supabase.from("clubes").select("*").order('nombre', { ascending: true })
    ]);
    
    if (resJugadores.data) setJugadores(resJugadores.data);
    if (resClubes.data) setClubes(resClubes.data);
    setCargando(false);
  }

  async function cargarContratosJugador(jugadorId: string) {
    setCargandoContratos(true);
    const { data } = await supabase
      .from("contratos")
      .select("*, clubes(nombre)")
      .eq("jugador_id", jugadorId)
      .order("fecha_vencimiento", { ascending: true });
    
    if (data) setListaContratos(data);
    setCargandoContratos(false);
  }

  const armarLinkFoto = (ruta: string) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta; 
    const rutaLimpiada = ruta.startsWith("/") ? ruta.substring(1) : ruta;
    return `https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/${rutaLimpiada}`;
  };

  const calcularEdad = (fecha: string) => {
    if (!fecha) return "--";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return isNaN(edad) ? "--" : edad;
  };

  const opcionesPosicion = ["Todas", ...Array.from(new Set(jugadores.map((j: any) => j.posicion).filter(Boolean)))];
  const opcionesNacionalidad = ["Todas", ...Array.from(new Set(jugadores.map((j: any) => j.nacionalidad).filter(Boolean)))];

  const jugadoresFiltrados = useMemo(() => {
    return jugadores.filter((j: any) => {
      const matchBusqueda = !filtroBusqueda || `${j.nombre} ${j.apellido}`.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const matchPosicion = filtroPosicion === "Todas" || j.posicion === filtroPosicion;
      const matchNac = filtroNacionalidad === "Todas" || j.nacionalidad === filtroNacionalidad;
      return matchBusqueda && matchPosicion && matchNac;
    });
  }, [jugadores, filtroBusqueda, filtroPosicion, filtroNacionalidad]);

  const jugadoresAgrupadosPorEstado = useMemo(() => {
    const grupos = jugadoresFiltrados.reduce((acc: any, jugador: any) => {
      const estado = jugador.estado || "Sin Estado";
      if (!acc[estado]) acc[estado] = [];
      acc[estado].push(jugador);
      return acc;
    }, {} as Record<string, any[]>);

    const ordenEstados: Record<string, number> = {
      "Activo": 1, "Lesionado": 2, "Inactivo": 3, "Retirado": 4, "Sin Estado": 5
    };

    return Object.keys(grupos)
      .sort((a, b) => (ordenEstados[a] || 99) - (ordenEstados[b] || 99))
      .map(estado => ({ estado, jugadores: grupos[estado] }));
  }, [jugadoresFiltrados]);

  const getColorEstado = (estado: string) => {
    switch(estado) {
      case "Activo": return "bg-[#4ade80]";
      case "Lesionado": return "bg-[#fbbf24]";
      case "Retirado": return "bg-[#9ca3af]";
      case "Inactivo": return "bg-[#ef4444]";
      default: return "bg-gray-600";
    }
  };

  const abrirNuevoJugador = () => {
    setFormData({ 
      id: null, nombreCompleto: "", fecha_nacimiento: "", posicion: "",
      pierna_habil: "Izquierda", nacionalidad: "", nacionalidad_2: "", nacionalidad_3: "",
      telefono: "", email: "", domicilio: "", 
      vencimiento_pasaporte_1: "", pasaporte_1_url: "",
      vencimiento_pasaporte_2: "", pasaporte_2_url: "",
      vencimiento_pasaporte_3: "", pasaporte_3_url: "",
      estado: "Activo", notas: "", foto_url: "" 
    });
    setArchivoFoto(null);
    setArchivoPasaporte1(null);
    setArchivoPasaporte2(null);
    setArchivoPasaporte3(null);
    setVistaModal("Formulario");
  };

  const abrirEditarJugador = (jugador: any) => {
    setFormData({ 
      id: jugador.id,
      nombreCompleto: `${jugador.nombre || ""} ${jugador.apellido || ""}`.trim(),
      fecha_nacimiento: jugador.fecha_nacimiento || "",
      posicion: jugador.posicion || "",
      pierna_habil: jugador.pierna_habil || "Izquierda",
      nacionalidad: jugador.nacionalidad || "",
      nacionalidad_2: jugador.nacionalidad_2 || "",
      nacionalidad_3: jugador.nacionalidad_3 || "",
      telefono: jugador.telefono || "",
      email: jugador.email || "",
      domicilio: jugador.domicilio || "",
      vencimiento_pasaporte_1: jugador.vencimiento_pasaporte_1 || "",
      pasaporte_1_url: jugador.pasaporte_1_url || "",
      vencimiento_pasaporte_2: jugador.vencimiento_pasaporte_2 || "",
      pasaporte_2_url: jugador.pasaporte_2_url || "",
      vencimiento_pasaporte_3: jugador.vencimiento_pasaporte_3 || "",
      pasaporte_3_url: jugador.pasaporte_3_url || "",
      estado: jugador.estado || "Activo",
      notas: jugador.notas || "",
      foto_url: jugador.foto_url || ""
    });
    setArchivoFoto(null);
    setArchivoPasaporte1(null);
    setArchivoPasaporte2(null);
    setArchivoPasaporte3(null);
    setVistaModal("Formulario");
  };

  const abrirVista = async (jugador: any, vista: "Ficha" | "Historial" | "Contratos") => {
    setJugadorActual(jugador);
    setVistaModal(vista);
    if (vista === "Contratos" || vista === "Ficha") {
      await cargarContratosJugador(jugador.id);
    }
    if (vista === "Contratos") {
      setContratoEditandoId(null);
      setNuevoContrato({
        tipo_contrato: "Representacion",
        titulo: "",
        club_id: "",
        fecha_inicio: "",
        fecha_vencimiento: "",
        porcentaje_comision: "",
        monto_contrato: "",
        moneda: "EUR",
        cantidad_cuotas: "1",
        archivo: null,
        notas: ""
      });
    }
  };

  const abrirCambiarFoto = (jugador: any) => {
    setJugadorActual(jugador);
    setArchivoFoto(null);
    setVistaModal("Foto");
  };

  const eliminarJugador = async (id: string, nombre: string, apellido: string) => {
    if (window.confirm(`¿Estás seguro que querés eliminar a ${nombre} ${apellido}?`)) {
      await supabase.from("jugadores").delete().eq("id", id);
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
      let fotoUrl = formData.foto_url;
      if (archivoFoto) {
        const fileExt = archivoFoto.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/jugadores/${crypto.randomUUID()}.${fileExt}`;
        const { error: errorFoto } = await supabase.storage
          .from("laasport-media")
          .upload(fileName, archivoFoto, { upsert: true });

        if (errorFoto) {
          console.error("Error al subir foto:", errorFoto);
          alert(`Error al subir la foto: ${errorFoto.message}`);
          setGuardando(false);
          return;
        }
        fotoUrl = fileName;
      }

      let pasaporte1Url = formData.pasaporte_1_url;
      if (archivoPasaporte1) {
        const fileExt = archivoPasaporte1.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/jugadores/pasaportes/${crypto.randomUUID()}_1.${fileExt}`;
        const { error: err1 } = await supabase.storage.from("laasport-media").upload(fileName, archivoPasaporte1, { upsert: true });
        if (!err1) pasaporte1Url = fileName;
      }

      let pasaporte2Url = formData.pasaporte_2_url;
      if (archivoPasaporte2) {
        const fileExt = archivoPasaporte2.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/jugadores/pasaportes/${crypto.randomUUID()}_2.${fileExt}`;
        const { error: err2 } = await supabase.storage.from("laasport-media").upload(fileName, archivoPasaporte2, { upsert: true });
        if (!err2) pasaporte2Url = fileName;
      }

      let pasaporte3Url = formData.pasaporte_3_url;
      if (archivoPasaporte3) {
        const fileExt = archivoPasaporte3.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/jugadores/pasaportes/${crypto.randomUUID()}_3.${fileExt}`;
        const { error: err3 } = await supabase.storage.from("laasport-media").upload(fileName, archivoPasaporte3, { upsert: true });
        if (!err3) pasaporte3Url = fileName;
      }

      const partesNombre = formData.nombreCompleto.trim().split(" ");
      const nombreFinal = partesNombre[0] || "";
      const apellidoFinal = partesNombre.slice(1).join(" ") || "";

      const datosGuardar: any = {
        nombre: nombreFinal, 
        apellido: apellidoFinal, 
        posicion: formData.posicion,
        nacionalidad: formData.nacionalidad, 
        nacionalidad_2: formData.nacionalidad_2, 
        nacionalidad_3: formData.nacionalidad_3,
        pierna_habil: formData.pierna_habil, 
        telefono: formData.telefono, 
        email: formData.email,
        domicilio: formData.domicilio, 
        vencimiento_pasaporte_1: formData.vencimiento_pasaporte_1 || null,
        pasaporte_1_url: pasaporte1Url || null,
        vencimiento_pasaporte_2: formData.vencimiento_pasaporte_2 || null,
        pasaporte_2_url: pasaporte2Url || null,
        vencimiento_pasaporte_3: formData.vencimiento_pasaporte_3 || null,
        pasaporte_3_url: pasaporte3Url || null,
        estado: formData.estado,
        notas: formData.notas, 
        foto_url: fotoUrl, 
        workspace_id: WORKSPACE_ID
      };

      if (formData.fecha_nacimiento) datosGuardar.fecha_nacimiento = formData.fecha_nacimiento;
      else datosGuardar.fecha_nacimiento = null;

      if (formData.id) {
        datosGuardar.actualizado_en = new Date().toISOString();
        await supabase.from("jugadores").update(datosGuardar).eq("id", formData.id);
      } else {
        await supabase.from("jugadores").insert([datosGuardar]);
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

  const guardarSoloFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoFoto || !jugadorActual) return;
    setGuardando(true);
    try {
      const fileExt = archivoFoto.name.split(".").pop();
      const fileName = `${WORKSPACE_ID}/jugadores/${crypto.randomUUID()}.${fileExt}`;
      const { error: errorFoto } = await supabase.storage
        .from("laasport-media")
        .upload(fileName, archivoFoto, { upsert: true });
      
      if (errorFoto) {
        console.error("Error al subir foto:", errorFoto);
        alert(`Error al subir la foto: ${errorFoto.message}`);
        setGuardando(false);
        return;
      }

      await supabase.from("jugadores").update({ foto_url: fileName, actualizado_en: new Date().toISOString() }).eq("id", jugadorActual.id);
      await cargarDatos();
      setVistaModal(null);
    } catch (error) {
      console.error(error);
      alert("Error al subir la foto.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugadorActual) return;
    setGuardandoContrato(true);
    try {
      let archivoUrl = nuevoContrato.archivo ? "" : undefined;
      if (nuevoContrato.archivo) {
        const fileExt = nuevoContrato.archivo.name.split(".").pop();
        const fileName = `${WORKSPACE_ID}/contratos/${jugadorActual.id}_${crypto.randomUUID()}.${fileExt}`;
        const { error: errContrato } = await supabase.storage.from("laasport-media").upload(fileName, nuevoContrato.archivo, { upsert: true });
        if (!errContrato) archivoUrl = fileName;
      }

      let tituloFinal = nuevoContrato.titulo;
      let clubIdFinal = nuevoContrato.club_id || null;
      if (nuevoContrato.tipo_contrato === "Laboral_Club" && clubIdFinal) {
        const clubEncontrado = clubes.find((c: any) => c.id === clubIdFinal);
        if (clubEncontrado && !tituloFinal) {
          tituloFinal = `Contrato Profesional - ${clubEncontrado.nombre}`;
        }
      }
      if (!tituloFinal) tituloFinal = `Contrato de ${nuevoContrato.tipo_contrato}`;

      const datosPayload: any = {
        workspace_id: WORKSPACE_ID,
        jugador_id: jugadorActual.id,
        club_id: clubIdFinal,
        tipo_contrato: nuevoContrato.tipo_contrato,
        titulo: tituloFinal,
        fecha_inicio: nuevoContrato.fecha_inicio || null,
        fecha_vencimiento: nuevoContrato.fecha_vencimiento,
        porcentaje_comision: nuevoContrato.porcentaje_comision ? Number(nuevoContrato.porcentaje_comision) : null,
        monto_contrato: nuevoContrato.monto_contrato ? Number(nuevoContrato.monto_contrato) : null,
        moneda: nuevoContrato.moneda,
        notas: nuevoContrato.notas
      };

      if (archivoUrl !== undefined) {
        datosPayload.archivo_url = archivoUrl;
      }

      let contratoIdGuardado = contratoEditandoId;

      if (contratoEditandoId) {
        await supabase.from("contratos").update(datosPayload).eq("id", contratoEditandoId);
        await supabase.from("transacciones").delete().eq("contrato_id", contratoEditandoId);
      } else {
        const { data: resContrato } = await supabase
          .from("contratos")
          .insert([datosPayload])
          .select("id")
          .single();
        
        if (resContrato) contratoIdGuardado = resContrato.id;
      }

      if (datosPayload.monto_contrato && datosPayload.porcentaje_comision) {
        const comisionTotal = (Number(datosPayload.monto_contrato) * Number(datosPayload.porcentaje_comision)) / 100;
        const numCuotas = Math.max(1, parseInt(nuevoContrato.cantidad_cuotas) || 1);
        const montoPorCuota = comisionTotal / numCuotas;

        const fechaBase = nuevoContrato.fecha_inicio ? new Date(nuevoContrato.fecha_inicio) : new Date();

        for (let i = 1; i <= numCuotas; i++) {
          const fechaCuota = new Date(fechaBase);
          fechaCuota.setMonth(fechaCuota.getMonth() + (i - 1));
          const fechaVencimientoStr = fechaCuota.toISOString().split("T")[0];

          const datosTransaccion = {
            workspace_id: WORKSPACE_ID,
            jugador_id: datosPayload.jugador_id,
            club_id: datosPayload.club_id,
            contrato_id: contratoIdGuardado,
            tipo: 'Comision_Contrato',
            concepto: `Comisión (${datosPayload.porcentaje_comision}%) - ${tituloFinal} [Cuota ${i}/${numCuotas}]`,
            monto: Number(montoPorCuota.toFixed(2)),
            moneda: datosPayload.moneda,
            estado: 'Pendiente',
            fecha_vencimiento: fechaVencimientoStr
          };

          await supabase.from("transacciones").insert([datosTransaccion]);
        }
      }

      alert(`¡Contrato guardado y ${nuevoContrato.cantidad_cuotas} cuota(s) generada(s) en finanzas con éxito!`);

      setContratoEditandoId(null);
      setNuevoContrato({
        tipo_contrato: "Representacion",
        titulo: "",
        club_id: "",
        fecha_inicio: "",
        fecha_vencimiento: "",
        porcentaje_comision: "",
        monto_contrato: "",
        moneda: "EUR",
        cantidad_cuotas: "1",
        archivo: null,
        notas: ""
      });
      await cargarContratosJugador(jugadorActual.id);
    } catch (error) {
      console.error(error);
      alert("Error al guardar el contrato.");
    } finally {
      setGuardandoContrato(false);
    }
  };

  const prepararEdicionContrato = (c: any) => {
    setContratoEditandoId(c.id);
    setNuevoContrato({
      tipo_contrato: c.tipo_contrato || "Representacion",
      titulo: c.titulo || "",
      club_id: c.club_id || "",
      fecha_inicio: c.fecha_inicio || "",
      fecha_vencimiento: c.fecha_vencimiento || "",
      porcentaje_comision: c.porcentaje_comision ? c.porcentaje_comision.toString() : "",
      monto_contrato: c.monto_contrato ? c.monto_contrato.toString() : "",
      moneda: c.moneda || "EUR",
      cantidad_cuotas: "1",
      archivo: null,
      notas: c.notas || ""
    });
  };

  const eliminarContrato = async (id: string) => {
    if (window.confirm("¿Estás seguro que querés eliminar este documento/contrato?")) {
      await supabase.from("contratos").delete().eq("id", id);
      if (jugadorActual) cargarContratosJugador(jugadorActual.id);
    }
  };

  const generarPDF = () => {
    if (!jugadorActual) return;
    const logoEmpresaUrl = "https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/75b5e7bd-2429-416c-9c17-b2b93ce726e9/logo/logoblanco.png";

    const ventana = window.open('', '_blank');
    if (!ventana) return alert("Habilitá las ventanas emergentes para generar el PDF.");

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dossier - ${jugadorActual.nombre} ${jugadorActual.apellido}</title>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #111; padding: 40px; background: #fff; }
          .header { border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
          .profile { display: flex; align-items: center; gap: 25px; background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
          .avatar { width: 120px; height: 120px; border-radius: 8px; object-fit: cover; }
          .name { font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; background: #1a1d24; color: #fff; padding: 6px 10px; margin-bottom: 15px; border-radius: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 25px; padding: 0 10px; }
          .label { font-size: 10px; color: #777; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
          .value { font-size: 14px; font-weight: bold; color: #111; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoEmpresaUrl}" style="height: 35px;" />
        </div>
        <div class="profile">
          ${jugadorActual.foto_url ? `<img src="${armarLinkFoto(jugadorActual.foto_url)}" class="avatar" />` : `<div style="width:120px;height:120px;background:#ddd;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:30px;">${jugadorActual.nombre.charAt(0)}</div>`}
          <div>
            <h1 class="name">${jugadorActual.nombre} ${jugadorActual.apellido}</h1>
          </div>
        </div>
        <div class="section-title">Ficha Deportiva</div>
        <div class="grid">
          <div><div class="label">Posición</div><div class="value">${jugadorActual.posicion || '—'}</div></div>
          <div><div class="label">Nacionalidad</div><div class="value">${jugadorActual.nacionalidad || '—'}</div></div>
          <div><div class="label">Pierna Hábil</div><div class="value">${jugadorActual.pierna_habil || '—'}</div></div>
          <div><div class="label">Situación</div><div class="value">${jugadorActual.estado || '—'}</div></div>
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
            <div className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">LAASPORT AGENCY · MANAGEMENT</div>
            <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Jugadores</h1>
            <p className="text-gray-400 text-sm">Gestioná el talento y la información de cada representado.</p>
          </div>
          <button onClick={abrirNuevoJugador} className="bg-[#1a1d24] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] transition text-[13px] shadow-sm cursor-pointer">+ Nuevo jugador</button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-xs">
            <input type="text" placeholder="Buscar jugador..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg py-2 pl-3 pr-4 text-[13px] text-gray-200 focus:outline-none" />
          </div>
          <div className="text-[11px] font-medium text-gray-400">{jugadoresFiltrados.length} registros</div>
        </div>

        <div className="flex flex-wrap items-end gap-3 bg-[#1a1d24] border border-[#2a2d35] rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Posición</label>
            <select value={filtroPosicion} onChange={(e) => setFiltroPosicion(e.target.value)} className="bg-[#0f1115] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white">
              {opcionesPosicion.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="flex flex-col flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nacionalidad</label>
            <select value={filtroNacionalidad} onChange={(e) => setFiltroNacionalidad(e.target.value)} className="bg-[#0f1115] border border-[#2a2d35] rounded-lg py-1.5 px-3 text-[13px] text-white">
              {opcionesNacionalidad.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-[#15181f] border border-[#2a2d35] rounded-xl overflow-hidden shadow-lg">
          {cargando ? (
            <div className="p-16 text-center text-gray-500 font-medium">Cargando jugadores...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[1050px]">
                <thead className="bg-[#1a1d24] border-b border-[#2a2d35] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4 pl-8 w-[28%]">Jugador</th>
                    <th className="p-4 w-[22%]">Posición</th>
                    <th className="p-4 w-[18%]">Nacionalidad</th>
                    <th className="p-4 pr-6 text-right w-[32%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d35]">
                  {jugadoresAgrupadosPorEstado.map((grupo: any) => (
                    <React.Fragment key={grupo.estado}>
                      <tr className="bg-[#1e2129]">
                        <td colSpan={4} className="px-6 py-3 border-y border-[#2a2d35]">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${getColorEstado(grupo.estado)}`}></div>
                            <h3 className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">{grupo.estado}</h3>
                          </div>
                        </td>
                      </tr>
                      {grupo.jugadores.map((jugador: any) => (
                        <tr key={jugador.id} className="hover:bg-[#1c1f26] transition group relative">
                          <td className="py-3 pl-8 pr-4">
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getColorEstado(jugador.estado)}`}></div>
                            <div className="flex items-center gap-3.5">
                              <div onClick={() => abrirCambiarFoto(jugador)} className="relative w-14 h-14 shrink-0 rounded-full border border-[#304058] bg-[#253246] flex items-center justify-center cursor-pointer overflow-hidden shadow-sm">
                                {jugador.foto_url ? <img src={armarLinkFoto(jugador.foto_url)} alt="" className="w-full h-full object-cover" /> : <div className="text-white font-bold text-sm">{jugador.nombre?.charAt(0)}</div>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-white text-[13px] truncate">{jugador.nombre} {jugador.apellido}</div>
                                <div className="text-[11px] text-gray-500 truncate">{calcularEdad(jugador.fecha_nacimiento)} años - {jugador.nacionalidad || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white text-[13px] truncate">{jugador.posicion || "—"}</td>
                          <td className="py-3 px-4 text-white text-[13px] truncate">{jugador.nacionalidad || "—"}</td>
                          <td className="py-3 pr-6 pl-4 text-right">
                            <div className="flex items-center justify-end gap-1 flex-nowrap">
                              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/showcase/${jugador.id}`); alert("¡Link copiado!"); }} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#4ade80] text-[11px] font-bold px-2 py-1 rounded cursor-pointer" title="Copiar Link">🔗</button>
                              <button onClick={() => abrirVista(jugador, "Ficha")} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Ficha</button>
                              <button onClick={() => abrirEditarJugador(jugador)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#60a5fa] text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Editar</button>
                              <button onClick={() => abrirVista(jugador, "Historial")} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-gray-400 hover:text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Hist.</button>
                              <button onClick={() => abrirVista(jugador, "Contratos")} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-amber-400 hover:text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Contratos</button>
                              <button onClick={() => eliminarJugador(jugador.id, jugador.nombre, jugador.apellido)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-[#f87171] text-[11px] font-bold px-2 py-1 rounded cursor-pointer">Elim.</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: FORMULARIO JUGADOR */}
      {vistaModal === "Formulario" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[950px] flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white tracking-wide">{formData.id ? "Editar jugador" : "Nuevo jugador"}</h2>
              <button onClick={() => setVistaModal(null)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#2a2d35] transition cursor-pointer">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="form-jugador" onSubmit={guardarFormulario} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nombre completo *</label>
                  <input required type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Fecha de nacimiento</label>
                  <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-gray-300 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Posición</label>
                  <input type="text" name="posicion" value={formData.posicion} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Pierna hábil</label>
                  <select name="pierna_habil" value={formData.pierna_habil} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white"><option value="Derecha">Derecha</option><option value="Izquierda">Izquierda</option><option value="Ambas">Ambas</option></select>
                </div>
                
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nacionalidad Principal</label>
                  <input type="text" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nacionalidad 2</label>
                  <input type="text" name="nacionalidad_2" value={formData.nacionalidad_2} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Nacionalidad 3</label>
                  <input type="text" name="nacionalidad_3" value={formData.nacionalidad_3} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>

                <div className="md:col-span-4 border-t border-[#2a2d35] pt-4 mt-2">
                  <h3 className="text-[12px] font-bold text-purple-400 uppercase tracking-wider mb-3">🛂 Control de Pasaportes y Vencimientos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#15181f] p-4 rounded-xl border border-[#2a2d35]">
                    
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-gray-300">Pasaporte ({formData.nacionalidad || 'Nacionalidad Principal'})</div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Fecha de Vencimiento</label>
                        <input type="date" name="vencimiento_pasaporte_1" value={formData.vencimiento_pasaporte_1} onChange={handleChange} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Copia / Imagen Pasaporte</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setArchivoPasaporte1(e.target.files?.[0] || null)} className="w-full text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1115] file:text-white" />
                        {formData.pasaporte_1_url && (
                          <a href={armarLinkFoto(formData.pasaporte_1_url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline mt-1 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-gray-300">Pasaporte ({formData.nacionalidad_2 || 'Nacionalidad 2'})</div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Fecha de Vencimiento</label>
                        <input type="date" name="vencimiento_pasaporte_2" value={formData.vencimiento_pasaporte_2} onChange={handleChange} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Copia / Imagen Pasaporte</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setArchivoPasaporte2(e.target.files?.[0] || null)} className="w-full text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1115] file:text-white" />
                        {formData.pasaporte_2_url && (
                          <a href={armarLinkFoto(formData.pasaporte_2_url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline mt-1 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-gray-300">Pasaporte ({formData.nacionalidad_3 || 'Nacionalidad 3'})</div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Fecha de Vencimiento</label>
                        <input type="date" name="vencimiento_pasaporte_3" value={formData.vencimiento_pasaporte_3} onChange={handleChange} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Copia / Imagen Pasaporte</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setArchivoPasaporte3(e.target.files?.[0] || null)} className="w-full text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1115] file:text-white" />
                        {formData.pasaporte_3_url && (
                          <a href={armarLinkFoto(formData.pasaporte_3_url)} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline mt-1 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Domicilio</label>
                  <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white" />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Situación del jugador</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white"><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option><option value="Lesionado">Lesionado</option><option value="Retirado">Retirado</option></select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[12px] text-gray-300 font-medium mb-1.5">Notas / observaciones</label>
                  <textarea name="notas" value={formData.notas} onChange={handleChange} rows={2} className="w-full bg-[#15181f] border border-[#2a2d35] rounded-lg p-2.5 text-[13px] text-white resize-none"></textarea>
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-[#2a2d35] shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] hover:bg-[#2a2d35] rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" form="form-jugador" disabled={guardando} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#2a2d35] cursor-pointer">{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR SOLO FOTO */}
      {vistaModal === "Foto" && jugadorActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[400px] flex flex-col overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white">Actualizar Fotografía</h2>
              <button onClick={() => setVistaModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 text-[13px] mb-4">Seleccioná una nueva imagen para <strong>{jugadorActual.nombre} {jugadorActual.apellido}</strong>.</p>
              <form id="form-foto" onSubmit={guardarSoloFoto}>
                <input required type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)} className="w-full text-[13px] text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[12px] file:font-bold file:bg-[#15181f] file:border file:border-[#2a2d35] file:text-white" />
              </form>
            </div>
            <div className="px-6 py-5 border-t border-[#2a2d35] flex justify-end gap-3 bg-[#15181f]">
              <button type="button" onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-white border border-[#2a2d35] rounded-lg">Cancelar</button>
              <button type="submit" form="form-foto" disabled={guardando || !archivoFoto} className="bg-[#20232a] border border-[#2a2d35] text-white px-5 py-2 rounded-lg font-bold">{guardando ? "Subiendo..." : "Actualizar foto"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FICHA */}
      {vistaModal === "Ficha" && jugadorActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[850px] flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white">Ficha Completa: {jugadorActual.nombre} {jugadorActual.apellido}</h2>
              <button onClick={() => setVistaModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              
              <div className="flex flex-col md:flex-row items-center gap-6 bg-[#15181f] p-6 rounded-xl border border-[#2a2d35]">
                <div className="w-28 h-28 shrink-0 rounded-full border-4 border-[#1a1d24] overflow-hidden bg-[#253246] flex items-center justify-center shadow-lg">
                  {jugadorActual.foto_url ? <img src={armarLinkFoto(jugadorActual.foto_url)} alt="" className="w-full h-full object-cover" /> : <div className="text-4xl font-bold text-white">{jugadorActual.nombre.charAt(0)}</div>}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">{jugadorActual.nombre} {jugadorActual.apellido}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <span className="text-[11px] font-bold bg-[#2a2d35] text-white px-2.5 py-1 rounded">Posición: {jugadorActual.posicion || "—"}</span>
                    <span className="text-[11px] font-bold bg-[#2a2d35] text-[#4ade80] px-2.5 py-1 rounded">Estado: {jugadorActual.estado || "Activo"}</span>
                    <span className="text-[11px] font-bold bg-[#2a2d35] text-amber-400 px-2.5 py-1 rounded">Edad: {calcularEdad(jugadorActual.fecha_nacimiento)} años</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#15181f] p-5 rounded-xl border border-[#2a2d35]">
                <h4 className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-4 border-b border-[#2a2d35] pb-2">Información Personal y Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-4">
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">Fecha de Nacimiento</span><span className="text-gray-200 text-[13px]">{jugadorActual.fecha_nacimiento || "—"}</span></div>
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">Teléfono</span><span className="text-gray-200 text-[13px]">{jugadorActual.telefono || "—"}</span></div>
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">E-mail</span><span className="text-gray-200 text-[13px]">{jugadorActual.email || "—"}</span></div>
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">Domicilio</span><span className="text-gray-200 text-[13px]">{jugadorActual.domicilio || "—"}</span></div>
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">Pierna Hábil</span><span className="text-gray-200 text-[13px]">{jugadorActual.pierna_habil || "—"}</span></div>
                  <div><span className="block text-[10px] text-gray-500 uppercase font-bold">Nacionalidades</span><span className="text-gray-200 text-[13px]">{[jugadorActual.nacionalidad, jugadorActual.nacionalidad_2, jugadorActual.nacionalidad_3].filter(Boolean).join(" / ") || "—"}</span></div>
                </div>
                {jugadorActual.notas && (
                  <div className="mt-4 pt-3 border-t border-[#2a2d35]">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Notas / Observaciones</span>
                    <p className="text-gray-300 text-[12px] bg-[#101217] p-3 rounded">{jugadorActual.notas}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#15181f] p-5 rounded-xl border border-[#2a2d35]">
                <h4 className="text-[11px] text-amber-400 uppercase tracking-widest font-bold mb-4 border-b border-[#2a2d35] pb-2">Contratos y Acuerdos Registrados</h4>
                {cargandoContratos ? (
                  <div className="text-center py-4 text-gray-500 text-[12px]">Cargando contratos...</div>
                ) : listaContratos.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-[12px]">No hay contratos ni acuerdos registrados para este jugador.</div>
                ) : (
                  <div className="space-y-3">
                    {listaContratos.map((c: any) => {
                      const simboloMoneda = c.moneda === 'EUR' ? '€' : c.moneda === 'USD' ? 'US$' : '$';
                      const comisionCalculada = c.monto_contrato && c.porcentaje_comision 
                        ? (Number(c.monto_contrato) * Number(c.porcentaje_comision)) / 100 
                        : null;
                      const nombreClubAsociado = c.clubes?.nombre || clubes.find((cb: any) => cb.id === c.club_id)?.nombre;

                      return (
                        <div key={c.id} className="bg-[#101217] p-3.5 rounded-lg border border-[#2a2d35] flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold bg-[#2a2d35] text-amber-400 px-2 py-0.5 rounded">{c.tipo_contrato}</span>
                              <span className="font-bold text-white text-[12px]">
                                {c.tipo_contrato === "Laboral_Club" && nombreClubAsociado ? `Club: ${nombreClubAsociado}` : c.titulo}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              {c.fecha_inicio && <span>Inicio: <strong className="text-gray-300 font-mono">{c.fecha_inicio}</strong></span>}
                              <span>Vencimiento: <strong className="text-amber-400 font-mono">{c.fecha_vencimiento}</strong></span>
                              {c.monto_contrato && (
                                <span>Monto: <strong className="text-white font-mono">{simboloMoneda} {Number(c.monto_contrato).toLocaleString()} {c.moneda}</strong></span>
                              )}
                              {c.porcentaje_comision && (
                                <span>Comisión ({c.porcentaje_comision}%): <strong className="text-[#4ade80] font-mono">{comisionCalculada ? `${simboloMoneda} ${comisionCalculada.toLocaleString()} ${c.moneda}` : '—'}</strong></span>
                              )}
                            </div>
                          </div>
                          {c.archivo_url && (
                            <a href={armarLinkFoto(c.archivo_url)} target="_blank" rel="noopener noreferrer" className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-3 py-1.5 rounded transition shrink-0 ml-2">
                              Ver 📄
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {(jugadorActual.vencimiento_pasaporte_1 || jugadorActual.vencimiento_pasaporte_2 || jugadorActual.vencimiento_pasaporte_3) && (
                <div className="bg-[#15181f] p-5 rounded-xl border border-[#2a2d35]">
                  <h4 className="text-[11px] text-purple-400 uppercase tracking-widest font-bold mb-4 border-b border-[#2a2d35] pb-2">Control de Pasaportes y Nacionalidades</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {jugadorActual.vencimiento_pasaporte_1 && (
                      <div className="bg-[#101217] p-3.5 rounded-lg border border-[#2a2d35]">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Pasaporte ({jugadorActual.nacionalidad})</div>
                        <div className="text-[12px] text-amber-400 font-mono font-bold mt-1">Vence: {jugadorActual.vencimiento_pasaporte_1}</div>
                        {jugadorActual.pasaporte_1_url && (
                          <a href={armarLinkFoto(jugadorActual.pasaporte_1_url)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 underline mt-2 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    )}
                    {jugadorActual.vencimiento_pasaporte_2 && (
                      <div className="bg-[#101217] p-3.5 rounded-lg border border-[#2a2d35]">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Pasaporte ({jugadorActual.nacionalidad_2})</div>
                        <div className="text-[12px] text-amber-400 font-mono font-bold mt-1">Vence: {jugadorActual.vencimiento_pasaporte_2}</div>
                        {jugadorActual.pasaporte_2_url && (
                          <a href={armarLinkFoto(jugadorActual.pasaporte_2_url)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 underline mt-2 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    )}
                    {jugadorActual.vencimiento_pasaporte_3 && (
                      <div className="bg-[#101217] p-3.5 rounded-lg border border-[#2a2d35]">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Pasaporte ({jugadorActual.nacionalidad_3})</div>
                        <div className="text-[12px] text-amber-400 font-mono font-bold mt-1">Vence: {jugadorActual.vencimiento_pasaporte_3}</div>
                        {jugadorActual.pasaporte_3_url && (
                          <a href={armarLinkFoto(jugadorActual.pasaporte_3_url)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 underline mt-2 inline-block">Ver documento 📄</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            <div className="px-6 py-4 border-t border-[#2a2d35] bg-[#1a1d24] flex justify-between items-center shrink-0">
              <button onClick={generarPDF} className="bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition text-[13px] flex items-center gap-2 cursor-pointer">Descargar Dossier PDF</button>
              <button onClick={() => setVistaModal(null)} className="px-5 py-2.5 text-[13px] font-bold text-gray-400 hover:text-white cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTRATOS Y DOCUMENTOS */}
      {vistaModal === "Contratos" && jugadorActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[950px] flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white">Contratos y Acuerdos: {jugadorActual.nombre} {jugadorActual.apellido}</h2>
              <button onClick={() => setVistaModal(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="bg-[#15181f] p-5 rounded-xl border border-[#2a2d35]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[12px] font-bold text-amber-400 uppercase tracking-wider">
                    {contratoEditandoId ? "✏️ Editar Contrato" : "+ Registrar Nuevo Contrato / Acuerdo"}
                  </h3>
                  {contratoEditandoId && (
                    <button onClick={() => {
                      setContratoEditandoId(null);
                      setNuevoContrato({
                        tipo_contrato: "Representacion",
                        titulo: "",
                        club_id: "",
                        fecha_inicio: "",
                        fecha_vencimiento: "",
                        porcentaje_comision: "",
                        monto_contrato: "",
                        moneda: "EUR",
                        cantidad_cuotas: "1",
                        archivo: null,
                        notas: ""
                      });
                    }} className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer">Cancelar edición</button>
                  )}
                </div>

                <form onSubmit={guardarContrato} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Tipo de Contrato</label>
                    <select value={nuevoContrato.tipo_contrato} onChange={(e) => setNuevoContrato({...nuevoContrato, tipo_contrato: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white">
                      <option value="Representacion">Contrato Representación</option>
                      <option value="Laboral_Club">Contrato Club</option>
                      <option value="Patrocinio">Patrocinio / Comercial</option>
                      <option value="Otro">Otro Acuerdo</option>
                    </select>
                  </div>

                  {nuevoContrato.tipo_contrato === "Laboral_Club" ? (
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1">Seleccionar Club *</label>
                      <select required value={nuevoContrato.club_id} onChange={(e) => setNuevoContrato({...nuevoContrato, club_id: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white">
                        <option value="">-- Seleccionar Club --</option>
                        {clubes.map((club: any) => (
                          <option key={club.id} value={club.id}>{club.nombre}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1">Título / Descripción *</label>
                      <input required type="text" placeholder="Ej: Contrato Exclusividad 2026-2028" value={nuevoContrato.titulo} onChange={(e) => setNuevoContrato({...nuevoContrato, titulo: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Fecha de Inicio</label>
                    <input type="date" value={nuevoContrato.fecha_inicio} onChange={(e) => setNuevoContrato({...nuevoContrato, fecha_inicio: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Vencimiento *</label>
                    <input required type="date" value={nuevoContrato.fecha_vencimiento} onChange={(e) => setNuevoContrato({...nuevoContrato, fecha_vencimiento: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Monto Total</label>
                    <input type="number" step="0.01" placeholder="Ej: 50000" value={nuevoContrato.monto_contrato} onChange={(e) => setNuevoContrato({...nuevoContrato, monto_contrato: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Moneda</label>
                    <select value={nuevoContrato.moneda} onChange={(e) => setNuevoContrato({...nuevoContrato, moneda: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white">
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD (US$)</option>
                      <option value="ARS">ARS ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">% Comisión Agencia</label>
                    <input type="number" step="0.01" placeholder="Ej: 10" value={nuevoContrato.porcentaje_comision} onChange={(e) => setNuevoContrato({...nuevoContrato, porcentaje_comision: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Dividir en Cuotas (Cobro)</label>
                    <select value={nuevoContrato.cantidad_cuotas} onChange={(e) => setNuevoContrato({...nuevoContrato, cantidad_cuotas: e.target.value})} className="w-full bg-[#0f1115] border border-[#2a2d35] rounded-lg p-2 text-[12px] text-white">
                      <option value="1">1 Pago único</option>
                      <option value="2">2 Cuotas mensuales</option>
                      <option value="3">3 Cuotas mensuales</option>
                      <option value="6">6 Cuotas mensuales</option>
                      <option value="12">12 Cuotas mensuales</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-gray-400 mb-1">Archivo (PDF/Imagen)</label>
                    <input type="file" onChange={(e) => setNuevoContrato({...nuevoContrato, archivo: e.target.files?.[0] || null})} className="w-full text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1115] file:text-white" />
                  </div>
                  <div className="md:col-span-4 flex justify-end mt-2">
                    <button type="submit" disabled={guardandoContrato} className="bg-[#20232a] border border-[#2a2d35] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2a2d35] text-[12px] cursor-pointer">
                      {guardandoContrato ? "Guardando..." : contratoEditandoId ? "Actualizar Contrato" : "Guardar Contrato"}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-[12px] font-bold text-gray-300 uppercase tracking-wider mb-3">Contratos Registrados</h3>
                {cargandoContratos ? (
                  <div className="text-center py-6 text-gray-500 text-[13px]">Cargando contratos...</div>
                ) : listaContratos.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-[13px] bg-[#15181f] rounded-lg border border-[#2a2d35]">No hay contratos cargados para este jugador.</div>
                ) : (
                  <div className="space-y-3">
                    {listaContratos.map((c: any) => {
                      const simboloMoneda = c.moneda === 'EUR' ? '€' : c.moneda === 'USD' ? 'US$' : '$';
                      const comisionCalculada = c.monto_contrato && c.porcentaje_comision 
                        ? (Number(c.monto_contrato) * Number(c.porcentaje_comision)) / 100 
                        : null;
                      const nombreClubAsociado = c.clubes?.nombre || clubes.find((cb: any) => cb.id === c.club_id)?.nombre;

                      return (
                        <div key={c.id} className="bg-[#15181f] border border-[#2a2d35] p-4 rounded-lg flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-[#2a2d35] text-amber-400 px-2 py-0.5 rounded">{c.tipo_contrato}</span>
                              <h4 className="font-bold text-white text-[13px]">
                                {c.tipo_contrato === "Laboral_Club" && nombreClubAsociado ? `Contrato Club: ${nombreClubAsociado}` : c.titulo}
                              </h4>
                            </div>
                            <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                              {c.fecha_inicio && <span>Inicio: <strong className="text-gray-300 font-mono">{c.fecha_inicio}</strong></span>}
                              <span>Vencimiento: <strong className="text-amber-400 font-mono">{c.fecha_vencimiento}</strong></span>
                              {c.monto_contrato && (
                                <span>Monto: <strong className="text-white font-mono">{simboloMoneda} {Number(c.monto_contrato).toLocaleString()} {c.moneda}</strong></span>
                              )}
                              {c.porcentaje_comision && (
                                <span>Comisión ({c.porcentaje_comision}%): <strong className="text-[#4ade80] font-mono">{comisionCalculada ? `${simboloMoneda} ${comisionCalculada.toLocaleString()} ${c.moneda}` : '—'}</strong></span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            {c.archivo_url && (
                              <a href={armarLinkFoto(c.archivo_url)} target="_blank" rel="noopener noreferrer" className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-white text-[11px] font-bold px-3 py-1.5 rounded transition">
                                Ver 📄
                              </a>
                            )}
                            <button onClick={() => prepararEdicionContrato(c)} className="border border-[#2a2d35] bg-transparent hover:bg-[#2a2d35] text-[#60a5fa] text-[11px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer" title="Editar">
                              ✏️
                            </button>
                            <button onClick={() => eliminarContrato(c.id)} className="border border-[#2a2d35] bg-transparent hover:bg-red-900/30 text-[#f87171] text-[11px] font-bold px-2.5 py-1.5 rounded transition cursor-pointer" title="Eliminar">
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-[#2a2d35] bg-[#1a1d24] flex justify-end shrink-0">
              <button onClick={() => setVistaModal(null)} className="px-5 py-2 text-[13px] font-bold text-gray-400 hover:text-white cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL */}
      {vistaModal === "Historial" && jugadorActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-[#1a1d24] border border-[#2a2d35] rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#2a2d35] shrink-0">
              <h2 className="text-[15px] font-bold text-white">Historial: {jugadorActual.nombre} {jugadorActual.apellido}</h2>
              <button onClick={() => setVistaModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-8 flex flex-col items-center text-center">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Módulo en desarrollo</h3>
              <p className="text-gray-500 text-[13px]">La sección de historial estará disponible próximamente.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}