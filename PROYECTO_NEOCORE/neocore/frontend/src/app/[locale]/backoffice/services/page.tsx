'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  Clock,
  Euro,
  X,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from 'lucide-react';
import { adminAPI, Service } from '@/lib/api';

/**
 * Pagina de gestion de servicios del backoffice.
 *
 * Permite al administrador:
 *   - Listar todos los servicios (activos e inactivos).
 *   - Crear nuevos servicios mediante un modal sencillo.
 *   - Editar nombre, descripcion, duracion y precio.
 *   - Activar/desactivar el servicio (sin borrarlo).
 *   - Eliminar definitivamente un servicio.
 *
 * Toda la persistencia se realiza contra el endpoint /api/services/ del
 * backend Django REST, que ya valida y sanitiza la entrada en el lado
 * servidor (ver ServiceAdminSerializer).
 */
export default function BackofficeServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.listAllServices();
      setServices(data);
    } catch (e: any) {
      console.error('Error cargando servicios', e);
      setError(
        e?.response?.data?.detail || 'No se han podido cargar los servicios.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = async (s: Service) => {
    setBusyId(s.id);
    try {
      const updated = await adminAPI.updateService(s.id, {
        is_active: !s.is_active,
      });
      setServices((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, ...updated } : x))
      );
    } catch (e) {
      console.error('Error cambiando estado activo', e);
      alert('No se ha podido actualizar el servicio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (s: Service) => {
    if (
      !confirm(
        `Eliminar el servicio "${s.name}"? Esta accion no se puede deshacer.`
      )
    )
      return;
    setBusyId(s.id);
    try {
      await adminAPI.deleteService(s.id);
      setServices((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      console.error('Error eliminando servicio', e);
      alert('No se ha podido eliminar el servicio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (s: Service) => {
    setServices((prev) => {
      const exists = prev.some((x) => x.id === s.id);
      return exists ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Catalogo de servicios
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona el catalogo completo del centro de bienestar.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          Cargando servicios...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          Aun no hay servicios. Crea el primero con el boton superior.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.map((s) => (
            <article
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-slate-800 leading-tight">
                    {s.name}
                  </h3>
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      <XCircle className="w-3 h-3" />
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                  {s.description || 'Sin descripcion.'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {s.duration_minutes} min
                  </span>
                  {s.price != null && (
                    <span className="inline-flex items-center gap-1">
                      <Euro className="w-3.5 h-3.5" />
                      {Number(s.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setEditing(s);
                    setShowForm(true);
                  }}
                  className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(s)}
                    disabled={busyId === s.id}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {s.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    disabled={busyId === s.id}
                    className="text-xs p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Eliminar"
                  >
                    {busyId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceFormModal
          service={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ============================================================================
// Modal de creacion / edicion de servicios
// ============================================================================
function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (s: Service) => void;
}) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(service?.duration_minutes || 60);
  const [price, setPrice] = useState<string>(service?.price != null ? String(service.price) : '');
  const [isActive, setIsActive] = useState<boolean>(service?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image || null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = service != null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('La imagen no puede superar 3 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      let saved: Service;
      if (imageFile) {
        const form = new FormData();
        form.append('name', name.trim());
        form.append('description', description.trim());
        form.append('duration_minutes', String(Number(durationMinutes)));
        form.append('is_active', String(isActive));
        if (price.trim()) form.append('price', String(Number(price)));
        form.append('image', imageFile);
        saved = isEdit
          ? await adminAPI.updateService(service!.id, form)
          : await adminAPI.createService(form);
      } else {
        const payload: any = { name: name.trim(), description: description.trim(), duration_minutes: Number(durationMinutes), is_active: isActive };
        if (price.trim()) payload.price = Number(price);
        saved = isEdit
          ? await adminAPI.updateService(service!.id, payload)
          : await adminAPI.createService(payload);
      }
      onSaved(saved);
    } catch (e: any) {
      console.error('Error guardando servicio', e);
      const data = e?.response?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = (data as any)[firstKey];
        setFormError(Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : data.detail || 'No se ha podido guardar el servicio.');
      } else {
        setFormError('No se ha podido guardar el servicio.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">
            {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={3000}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Duracion (minutos)
              </label>
              <input
                type="number"
                min={5}
                max={600}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Precio (EUR)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>
          {/* Imagen del servicio */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Imagen del servicio</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </button>
                {imagePreview && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="ml-2 text-xs text-red-500 hover:text-red-700">Eliminar</button>
                )}
                <p className="text-xs text-slate-400 mt-1">JPG, PNG o WebP · Máx. 3 MB. Si no se añade, se usará imagen por defecto.</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <label htmlFor="is_active" className="text-sm text-slate-600">
              Servicio activo (visible para los clientes)
            </label>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
