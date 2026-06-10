'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, X, CheckCircle2, XCircle,
  User as UserIcon, Camera, Search, Briefcase, Clock, Calendar,
} from 'lucide-react';
import { adminAPI, availabilityAPI, AvailabilityRule, User } from '@/lib/api';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function BackofficeProfessionalsPage() {
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (q = search) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.listUsers({ role: 'PROFESSIONAL', search: q || undefined });
      setProfessionals(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se han podido cargar los profesionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleToggleActive = async (p: User) => {
    setBusyId(p.id);
    try {
      const updated = await adminAPI.updateUser(p.id, { is_active: !p.is_active });
      setProfessionals(prev => prev.map(x => x.id === p.id ? { ...x, ...updated } : x));
    } catch { alert('No se ha podido actualizar el profesional.'); }
    finally { setBusyId(null); }
  };

  const handleDelete = async (p: User) => {
    if (!confirm(`¿Eliminar al profesional "${p.full_name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(p.id);
    try {
      await adminAPI.deleteUser(p.id);
      setProfessionals(prev => prev.filter(x => x.id !== p.id));
    } catch { alert('No se ha podido eliminar el profesional.'); }
    finally { setBusyId(null); }
  };

  const handleSaved = (saved: User, isNew: boolean) => {
    if (isNew) setProfessionals(prev => [saved, ...prev]);
    else setProfessionals(prev => prev.map(x => x.id === saved.id ? saved : x));
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profesionales</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestiona el equipo, sus horarios y disponibilidad</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo profesional
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, email o especialidad..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" />
      </div>

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>}

      {!loading && !error && (
        professionals.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay profesionales{search ? ' con esa búsqueda' : ''}</p>
            <p className="text-sm mt-1">Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {professionals.map(p => (
              <ProfessionalCard key={p.id} professional={p} busy={busyId === p.id}
                onEdit={() => { setEditing(p); setShowForm(true); }}
                onToggle={() => handleToggleActive(p)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>
        )
      )}

      {showForm && (
        <ProfessionalFormModal professional={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={handleSaved} />
      )}
    </div>
  );
}

// ============================================================================
// Tarjeta de profesional
// ============================================================================
function ProfessionalCard({ professional: p, busy, onEdit, onToggle, onDelete }: {
  professional: User; busy: boolean;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${!p.is_active ? 'opacity-60' : ''}`}>
      <div className="relative h-36 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        {p.profile_image
          ? <img src={p.profile_image} alt={p.full_name} className="w-full h-full object-cover" />
          : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><UserIcon className="w-10 h-10 text-white" /></div>}
        <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {p.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {p.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="p-4 flex-1">
        <p className="font-semibold text-slate-800 truncate">{p.full_name}</p>
        <p className="text-xs text-slate-500 truncate">{p.email}</p>
        {p.specialty && <span className="inline-block mt-1.5 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{p.specialty}</span>}
        {p.bio && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{p.bio}</p>}
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onEdit} className="flex-1 text-xs py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1">
          <Pencil className="w-3 h-3" /> Editar / Horario
        </button>
        <button onClick={onToggle} disabled={busy} className={`flex-1 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 border ${p.is_active ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : p.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {p.is_active ? 'Dar de baja' : 'Activar'}
        </button>
        <button onClick={onDelete} disabled={busy} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

// ============================================================================
// Modal con tabs: Información | Horario
// ============================================================================
function ProfessionalFormModal({ professional, onClose, onSaved }: {
  professional: User | null;
  onClose: () => void;
  onSaved: (saved: User, isNew: boolean) => void;
}) {
  const isNew = professional == null;
  const [tab, setTab] = useState<'info' | 'schedule'>('info');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{isNew ? 'Nuevo profesional' : `${professional?.full_name}`}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* Tabs (solo en edición) */}
        {!isNew && (
          <div className="flex border-b border-slate-100 px-6">
            <button onClick={() => setTab('info')} className={`py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <UserIcon className="w-4 h-4" /> Información
            </button>
            <button onClick={() => setTab('schedule')} className={`py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Clock className="w-4 h-4" /> Horario semanal
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {(isNew || tab === 'info') && (
            <InfoTab professional={professional} isNew={isNew} onClose={onClose} onSaved={onSaved} />
          )}
          {!isNew && tab === 'schedule' && (
            <ScheduleTab professionalId={professional!.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab Información
// ============================================================================
function InfoTab({ professional, isNew, onClose, onSaved }: {
  professional: User | null; isNew: boolean;
  onClose: () => void;
  onSaved: (saved: User, isNew: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(professional?.profile_image || null);
  const [form, setForm] = useState({
    first_name: professional?.first_name || '',
    last_name: professional?.last_name || '',
    email: professional?.email || '',
    phone: professional?.phone || '',
    specialty: professional?.specialty || '',
    bio: professional?.bio || '',
    password: '',
    is_active: professional?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Máx. 2 MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      let saved: User;
      if (isNew) {
        if (!form.password) { setFormError('La contraseña es obligatoria.'); setSubmitting(false); return; }
        saved = await adminAPI.createUser({ email: form.email, first_name: form.first_name, last_name: form.last_name, role: 'PROFESSIONAL', specialty: form.specialty || undefined, phone: form.phone || undefined, password: form.password });
      } else {
        const payload: any = { first_name: form.first_name, last_name: form.last_name, phone: form.phone, specialty: form.specialty, bio: form.bio, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        saved = await adminAPI.updateUser(professional!.id, payload);
      }
      if (photoFile) saved = await adminAPI.uploadUserPhoto(saved.id, photoFile);
      onSaved(saved, isNew);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
        setFormError(msgs.join(' · '));
      } else {
        setFormError('No se ha podido guardar.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
      {/* Foto */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow">
          {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-blue-400" />}
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
            <Camera className="w-3 h-3" /> {photoPreview ? 'Cambiar foto' : 'Añadir foto'}
          </button>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG o WebP · Máx. 2 MB</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label><input required value={form.first_name} onChange={e => set('first_name', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Apellidos *</label><input required value={form.last_name} onChange={e => set('last_name', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>
      </div>

      {isNew && (
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Email *</label><input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Especialidad</label><input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Ej: Fisioterapia" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>
      </div>

      <div><label className="block text-xs font-medium text-slate-600 mb-1">Biografía</label><textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none" /></div>

      <div><label className="block text-xs font-medium text-slate-600 mb-1">{isNew ? 'Contraseña *' : 'Nueva contraseña (vacío = sin cambios)'}</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} required={isNew} minLength={8} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" /></div>

      {!isNew && (
        <div className="flex items-center gap-2">
          <input id="pro_active" type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
          <label htmlFor="pro_active" className="text-sm text-slate-600">Profesional activo</label>
        </div>
      )}

      {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={submitting} className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60 inline-flex items-center gap-2">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isNew ? 'Crear profesional' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Tab Horario semanal
// ============================================================================
function ScheduleTab({ professionalId }: { professionalId: number }) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null); // day_of_week being saved

  // Draft rows: one per day
  const [drafts, setDrafts] = useState<Record<number, { enabled: boolean; start: string; end: string }>>(() => {
    const d: Record<number, { enabled: boolean; start: string; end: string }> = {};
    for (let i = 0; i < 7; i++) d[i] = { enabled: false, start: '09:00', end: '18:00' };
    return d;
  });

  useEffect(() => {
    availabilityAPI.getRules(professionalId).then(data => {
      setRules(data);
      const updated = { ...drafts };
      data.forEach(r => {
        updated[r.day_of_week] = {
          enabled: r.is_active,
          start: r.start_time.slice(0, 5),
          end: r.end_time.slice(0, 5),
        };
      });
      setDrafts(updated);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [professionalId]);

  const getRuleForDay = (day: number) => rules.find(r => r.day_of_week === day);

  const handleSaveDay = async (day: number) => {
    const draft = drafts[day];
    const existing = getRuleForDay(day);
    setSaving(day);
    try {
      if (!draft.enabled) {
        // Disable: delete or deactivate existing rule
        if (existing) {
          await availabilityAPI.deleteRule(existing.id);
          setRules(prev => prev.filter(r => r.id !== existing.id));
        }
      } else {
        if (existing) {
          const updated = await availabilityAPI.updateRule(existing.id, { start_time: draft.start + ':00', end_time: draft.end + ':00', is_active: true });
          setRules(prev => prev.map(r => r.id === existing.id ? updated : r));
        } else {
          const created = await availabilityAPI.createRule({ professional: professionalId, day_of_week: day, start_time: draft.start + ':00', end_time: draft.end + ':00' });
          setRules(prev => [...prev, created]);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.detail || 'Error al guardar';
      alert(msg);
    } finally {
      setSaving(null);
    }
  };

  const setDraft = (day: number, key: string, val: any) =>
    setDrafts(prev => ({ ...prev, [day]: { ...prev[day], [key]: val } }));

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="px-6 py-5 space-y-3">
      <p className="text-xs text-slate-500 mb-4">Configura los días y horarios en que este profesional está disponible. Los clientes solo podrán reservar en estas franjas.</p>
      {DAYS.map((dayName, i) => {
        const draft = drafts[i];
        const isBusy = saving === i;
        const hasRule = !!getRuleForDay(i);
        return (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${draft.enabled ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
            {/* Checkbox día */}
            <input type="checkbox" checked={draft.enabled} onChange={e => setDraft(i, 'enabled', e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
            <span className={`w-24 text-sm font-medium shrink-0 ${draft.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{dayName}</span>

            {/* Horario */}
            <div className={`flex items-center gap-2 flex-1 transition-opacity ${!draft.enabled ? 'opacity-30 pointer-events-none' : ''}`}>
              <input type="time" value={draft.start} onChange={e => setDraft(i, 'start', e.target.value)} className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white" />
              <span className="text-slate-400 text-sm">—</span>
              <input type="time" value={draft.end} onChange={e => setDraft(i, 'end', e.target.value)} className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white" />
            </div>

            {/* Guardar */}
            <button onClick={() => handleSaveDay(i)} disabled={isBusy} className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 inline-flex items-center gap-1 shrink-0">
              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {hasRule || draft.enabled ? 'Guardar' : 'Guardar'}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-slate-400 mt-2">Los cambios se aplican de inmediato. Para quitar un día, desmarca la casilla y guarda.</p>
    </div>
  );
}
