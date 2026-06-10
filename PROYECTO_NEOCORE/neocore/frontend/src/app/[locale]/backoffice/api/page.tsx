'use client';

import { useState, useEffect } from 'react';
import {
  Code2, Copy, CheckCheck, ExternalLink, Play, Globe, Database,
  Shield, Users, CalendarDays, Clock, Sparkles, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Loader2, FileJson, AlertTriangle,
} from 'lucide-react';

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://neocoree.xyz';

// ── Definición de la API ──────────────────────────────────────────────────────
const API_GROUPS = [
  {
    id: 'auth', title: 'Autenticación', icon: Shield, color: 'blue',
    desc: 'Login, registro, JWT y gestión de sesiones',
    endpoints: [
      { method: 'POST', url: '/api/auth/login/', desc: 'Iniciar sesión', auth: 'public',
        body: '{"email":"usuario@ejemplo.com","password":"TuContraseña123!"}',
        note: 'Devuelve access token (15 min) + refresh token (7 días)' },
      { method: 'POST', url: '/api/auth/register/', desc: 'Registrar usuario', auth: 'public',
        body: '{"email":"nuevo@ejemplo.com","password1":"MiPass123!","password2":"MiPass123!","first_name":"Nombre","last_name":"Apellido","gdpr_consent":true}',
        note: 'Rol por defecto: CLIENT' },
      { method: 'GET',  url: '/api/auth/users/me/', desc: 'Perfil autenticado', auth: 'bearer',
        note: 'Datos completos del usuario que tiene el token' },
      { method: 'PATCH',url: '/api/auth/users/update_me/', desc: 'Actualizar mi perfil', auth: 'bearer',
        body: '{"first_name":"Nuevo","last_name":"Apellido","phone":"+34600000000"}',
        note: 'También acepta multipart/form-data para profile_image' },
      { method: 'POST', url: '/api/auth/logout/', desc: 'Cerrar sesión', auth: 'bearer',
        body: '{"refresh":"<refresh_token>"}',
        note: 'Invalida el refresh token en la blacklist' },
      { method: 'POST', url: '/api/token/refresh/', desc: 'Renovar access token', auth: 'public',
        body: '{"refresh":"<refresh_token>"}' },
      { method: 'POST', url: '/api/auth/password/reset/', desc: 'Solicitar reset contraseña', auth: 'public',
        body: '{"email":"usuario@ejemplo.com"}' },
    ],
  },
  {
    id: 'users', title: 'Usuarios (Admin)', icon: Users, color: 'purple',
    desc: 'Gestión completa de usuarios — requiere rol ADMIN',
    endpoints: [
      { method: 'GET',   url: '/api/auth/users/', desc: 'Listar todos los usuarios', auth: 'admin',
        note: 'Params: role=CLIENT|PROFESSIONAL|ADMIN, is_active=true|false, search=texto' },
      { method: 'POST',  url: '/api/auth/users/', desc: 'Crear usuario', auth: 'admin',
        body: '{"email":"pro@ejemplo.com","first_name":"Ana","last_name":"López","role":"PROFESSIONAL","password":"Pass123!","specialty":"Fisioterapia"}' },
      { method: 'PATCH', url: '/api/auth/users/{id}/', desc: 'Editar usuario', auth: 'admin',
        body: '{"role":"PROFESSIONAL","is_active":true}',
        note: 'También acepta password para restablecerla' },
      { method: 'DELETE',url: '/api/auth/users/{id}/', desc: 'Eliminar usuario', auth: 'admin' },
      { method: 'GET',   url: '/api/auth/users/professionals/', desc: 'Listar profesionales', auth: 'public',
        note: 'Endpoint público. Param: specialty=Fisioterapia' },
    ],
  },
  {
    id: 'services', title: 'Servicios', icon: Sparkles, color: 'emerald',
    desc: 'Catálogo de servicios — lectura pública, escritura solo admin',
    endpoints: [
      { method: 'GET',   url: '/api/services/', desc: 'Listar servicios activos', auth: 'public',
        note: 'Params: search=texto, is_active=true|false, ordering=name|-price' },
      { method: 'GET',   url: '/api/services/{id}/', desc: 'Detalle de servicio', auth: 'public' },
      { method: 'POST',  url: '/api/services/', desc: 'Crear servicio', auth: 'admin',
        body: '{"name":"Fisioterapia","description":"Tratamiento...","duration_minutes":60,"price":50}',
        note: 'Acepta multipart/form-data para incluir image' },
      { method: 'PATCH', url: '/api/services/{id}/', desc: 'Editar servicio', auth: 'admin',
        body: '{"price":55,"is_active":true}' },
      { method: 'DELETE',url: '/api/services/{id}/', desc: 'Eliminar servicio', auth: 'admin' },
    ],
  },
  {
    id: 'bookings', title: 'Reservas', icon: CalendarDays, color: 'amber',
    desc: 'Ciclo completo de reservas — PENDING → CONFIRMED/REJECTED → DONE/CANCELED',
    endpoints: [
      { method: 'GET',  url: '/api/bookings/', desc: 'Listar reservas', auth: 'bearer',
        note: 'Admin ve todas; profesional ve las suyas; cliente ve las suyas. Params: status, ordering' },
      { method: 'POST', url: '/api/bookings/', desc: 'Crear reserva', auth: 'client',
        body: '{"service":1,"professional":2,"start_datetime":"2026-06-15T10:00:00Z","end_datetime":"2026-06-15T11:00:00Z","client_notes":"Nota opcional"}',
        note: 'Solo usuarios con rol CLIENT pueden crear reservas' },
      { method: 'POST', url: '/api/bookings/{id}/confirm/', desc: 'Confirmar reserva', auth: 'prof',
        note: 'Solo el profesional asignado. PENDING → CONFIRMED' },
      { method: 'POST', url: '/api/bookings/{id}/reject/', desc: 'Rechazar reserva', auth: 'prof',
        body: '{"reason":"No disponible ese día"}',
        note: 'Solo el profesional asignado. PENDING → REJECTED' },
      { method: 'POST', url: '/api/bookings/{id}/cancel/', desc: 'Cancelar reserva', auth: 'bearer',
        body: '{"reason":"Motivo opcional"}',
        note: 'Cliente, profesional o admin pueden cancelar' },
      { method: 'POST', url: '/api/bookings/{id}/mark_done/', desc: 'Marcar completada', auth: 'prof',
        note: 'CONFIRMED → DONE' },
      { method: 'GET',  url: '/api/bookings/upcoming/', desc: 'Próximas reservas', auth: 'bearer' },
      { method: 'GET',  url: '/api/bookings/past/', desc: 'Reservas pasadas', auth: 'bearer' },
      { method: 'GET',  url: '/api/bookings/my_stats/', desc: 'Mis estadísticas', auth: 'bearer',
        note: 'Total, completadas, próximas, pendientes, canceladas' },
      { method: 'GET',  url: '/api/bookings/stats/', desc: 'Estadísticas globales', auth: 'admin',
        note: 'Param: days=30. Por servicio y profesional' },
    ],
  },
  {
    id: 'availability', title: 'Disponibilidad', icon: Clock, color: 'rose',
    desc: 'Horarios de profesionales y cálculo de slots libres',
    endpoints: [
      { method: 'GET',   url: '/api/availability/slots/get_slots/', desc: 'Horas disponibles', auth: 'public',
        note: 'Params requeridos: professional_id, service_duration (min). Opcionales: start_date, end_date (YYYY-MM-DD)' },
      { method: 'GET',   url: '/api/availability/rules/', desc: 'Reglas de horario', auth: 'bearer',
        note: 'Admin ve todas; profesional ve las suyas. Param: professional=id' },
      { method: 'POST',  url: '/api/availability/rules/', desc: 'Crear regla', auth: 'bearer',
        body: '{"day_of_week":0,"start_time":"09:00","end_time":"18:00"}',
        note: 'day_of_week: 0=Lunes ... 6=Domingo. Admin puede añadir professional=id' },
      { method: 'PATCH', url: '/api/availability/rules/{id}/', desc: 'Editar regla', auth: 'bearer',
        body: '{"start_time":"08:00","end_time":"17:00","is_active":true}' },
      { method: 'DELETE',url: '/api/availability/rules/{id}/', desc: 'Eliminar regla', auth: 'bearer' },
      { method: 'GET',   url: '/api/availability/time-off/', desc: 'Ausencias', auth: 'bearer' },
      { method: 'POST',  url: '/api/availability/time-off/', desc: 'Crear ausencia', auth: 'bearer',
        body: '{"start_date":"2026-07-01","end_date":"2026-07-15","reason":"Vacaciones"}' },
      { method: 'DELETE',url: '/api/availability/time-off/{id}/', desc: 'Eliminar ausencia', auth: 'bearer' },
    ],
  },
  {
    id: 'system', title: 'Sistema', icon: Database, color: 'slate',
    desc: 'Salud del sistema, documentación y contacto',
    endpoints: [
      { method: 'GET',  url: '/api/health/', desc: 'Estado del sistema', auth: 'public',
        note: 'Siempre devuelve {"status":"ok"} si Django está activo' },
      { method: 'GET',  url: '/api/docs/', desc: 'Swagger UI interactivo', auth: 'public',
        note: 'Documentación visual completa de todos los endpoints' },
      { method: 'GET',  url: '/api/schema/', desc: 'Esquema OpenAPI JSON', auth: 'public',
        note: 'Para importar en Postman, Insomnia u otras herramientas' },
      { method: 'POST', url: '/api/contact/', desc: 'Formulario de contacto', auth: 'public',
        body: '{"name":"Nombre","email":"email@ejemplo.com","subject":"Asunto","message":"Mensaje"}',
        note: 'Rate limit: 5 peticiones/hora por IP' },
    ],
  },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST:   'bg-blue-100 text-blue-700 border-blue-200',
  PATCH:  'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  PUT:    'bg-orange-100 text-orange-700 border-orange-200',
};

const AUTH_CONFIG: Record<string, { label: string; color: string }> = {
  public: { label: 'Público', color: 'bg-slate-100 text-slate-600' },
  bearer: { label: 'JWT Bearer', color: 'bg-blue-100 text-blue-700' },
  admin:  { label: 'Admin', color: 'bg-red-100 text-red-700' },
  client: { label: 'Cliente', color: 'bg-green-100 text-green-700' },
  prof:   { label: 'Profesional', color: 'bg-purple-100 text-purple-700' },
};

const GROUP_COLOR: Record<string, string> = {
  blue:    'border-blue-500 bg-blue-50',
  purple:  'border-purple-500 bg-purple-50',
  emerald: 'border-emerald-500 bg-emerald-50',
  amber:   'border-amber-500 bg-amber-50',
  rose:    'border-rose-500 bg-rose-50',
  slate:   'border-slate-500 bg-slate-50',
};

const GROUP_ICON_COLOR: Record<string, string> = {
  blue: 'text-blue-600', purple: 'text-purple-600', emerald: 'text-emerald-600',
  amber: 'text-amber-600', rose: 'text-rose-600', slate: 'text-slate-600',
};

// ── Componente principal ───────────────────────────────────────────────────────
export default function BackofficeApiPage() {
  const [token, setToken] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ auth: true });
  const [copied, setCopied] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { status: number; body: string; ok: boolean; loading: boolean }>>({});

  useEffect(() => {
    const t = localStorage.getItem('access_token');
    if (t) setToken(t);
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleGroup = (id: string) => setOpenGroups(g => ({ ...g, [id]: !g[id] }));

  const runEndpoint = async (epKey: string, method: string, url: string, body?: string) => {
    setResults(r => ({ ...r, [epKey]: { status: 0, body: 'Cargando...', ok: false, loading: true } }));
    try {
      const finalUrl = BASE + url.replace('{id}', '1').replace('{path}', '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(finalUrl, {
        method,
        headers,
        body: method !== 'GET' && body ? body : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResults(r => ({ ...r, [epKey]: { status: res.status, body: pretty, ok: res.ok, loading: false } }));
    } catch (e: any) {
      setResults(r => ({ ...r, [epKey]: { status: 0, body: e.message, ok: false, loading: false } }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Referencia de la API</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Todos los endpoints de NeoCore con acceso directo, ejemplos y prueba integrada
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/docs/" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Globe className="w-4 h-4" /> Swagger UI <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href="/api/schema/" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors">
            <FileJson className="w-4 h-4" /> OpenAPI JSON
          </a>
        </div>
      </div>

      {/* Config token + base URL */}
      <div className="bg-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 shrink-0">
          <Code2 className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 text-sm font-mono">Base URL:</span>
          <code className="text-emerald-400 text-sm font-mono">{BASE}</code>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={token} onChange={e => setToken(e.target.value)} placeholder="Bearer token (auto-rellenado tras login)"
            className="flex-1 bg-slate-700 text-slate-100 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-600 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          {token && (
            <button onClick={() => copyText(`Bearer ${token}`, 'token')}
              className="text-xs px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors">
              {copied === 'token' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          {Object.entries(AUTH_CONFIG).map(([k, v]) => (
            <span key={k} className={`px-2 py-0.5 rounded-full ${v.color}`}>{v.label}</span>
          ))}
        </div>
      </div>

      {/* Grupos de endpoints */}
      {API_GROUPS.map(group => {
        const Icon = group.icon;
        const isOpen = openGroups[group.id];
        return (
          <div key={group.id} className={`rounded-xl border-l-4 border bg-white shadow-sm overflow-hidden ${GROUP_COLOR[group.color]}`}>
            <button onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${GROUP_ICON_COLOR[group.color]}`} />
                <div className="text-left">
                  <p className="font-bold text-slate-800">{group.title}</p>
                  <p className="text-xs text-slate-500">{group.desc} · {group.endpoints.length} endpoints</p>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isOpen && (
              <div className="divide-y divide-slate-100 bg-white">
                {group.endpoints.map((ep, i) => {
                  const epKey = `${group.id}-${i}`;
                  const res = results[epKey];
                  return (
                    <EndpointRow key={epKey} ep={ep} epKey={epKey} res={res}
                      onCopyUrl={() => copyText(BASE + ep.url, epKey + '-url')}
                      onCopyBody={() => ep.body && copyText(ep.body, epKey + '-body')}
                      onRun={() => runEndpoint(epKey, ep.method, ep.url, ep.body)}
                      copiedKey={copied}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Fila de endpoint ──────────────────────────────────────────────────────────
function EndpointRow({ ep, epKey, res, onCopyUrl, onCopyBody, onRun, copiedKey }: {
  ep: any; epKey: string; res: any;
  onCopyUrl: () => void; onCopyBody: () => void; onRun: () => void;
  copiedKey: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const authCfg = AUTH_CONFIG[ep.auth] || AUTH_CONFIG.public;

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}>
        <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded border ${METHOD_COLOR[ep.method] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {ep.method}
        </span>
        <code className="flex-1 text-sm text-slate-800 font-mono truncate">{ep.url}</code>
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${authCfg.color}`}>{authCfg.label}</span>
        <span className="hidden lg:block text-xs text-slate-500 max-w-[220px] truncate">{ep.desc}</span>
        <div className="flex gap-1 ml-auto">
          <button onClick={e => { e.stopPropagation(); onCopyUrl(); }} title="Copiar URL"
            className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all">
            {copiedKey === epKey + '-url' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onRun(); }} title="Probar endpoint"
            className="p-1 rounded bg-blue-100 hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-all">
            {res?.loading ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : <Play className="w-3.5 h-3.5 text-blue-600" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-900 px-5 py-4 space-y-3 border-t border-slate-700">
          {/* Info */}
          <div>
            <p className="text-slate-300 text-sm mb-1">{ep.desc}</p>
            {ep.note && (
              <div className="flex items-start gap-1.5 text-xs text-amber-300">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {ep.note}
              </div>
            )}
          </div>

          {/* Curl */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">Ejemplo curl</span>
              <button onClick={() => {
                const curl = `curl -s -X ${ep.method} "${BASE}${ep.url}"${ep.auth !== 'public' ? ' \\\n  -H "Authorization: Bearer <token>"' : ''} \\\n  -H "Content-Type: application/json"${ep.body ? ` \\\n  -d '${ep.body}'` : ''}`;
                navigator.clipboard.writeText(curl);
              }} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
                <Copy className="w-3 h-3" /> Copiar
              </button>
            </div>
            <pre className="bg-slate-950 text-emerald-300 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
{`curl -s -X ${ep.method} "${BASE}${ep.url}"${ep.auth !== 'public' ? `
  -H "Authorization: Bearer <token>"` : ''}
  -H "Content-Type: application/json"${ep.body ? `
  -d '${ep.body}'` : ''}`}
            </pre>
          </div>

          {/* Body editor */}
          {ep.body && (
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Body de ejemplo</span>
              <pre className="bg-slate-950 text-blue-300 text-xs p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(JSON.parse(ep.body), null, 2)}
              </pre>
            </div>
          )}

          {/* Resultado */}
          {res && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                {res.loading ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" /> :
                  res.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                           <XCircle className="w-3.5 h-3.5 text-red-400" />}
                <span className={`text-xs font-bold ${res.ok ? 'text-emerald-400' : res.status === 0 ? 'text-slate-400' : 'text-red-400'}`}>
                  {res.loading ? 'Enviando...' : `HTTP ${res.status}`}
                </span>
              </div>
              {!res.loading && (
                <pre className="bg-slate-950 text-slate-200 text-xs p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                  {res.body}
                </pre>
              )}
            </div>
          )}

          {/* Botón ejecutar */}
          <button onClick={onRun} disabled={res?.loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {res?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Ejecutar solicitud
          </button>
        </div>
      )}
    </div>
  );
}
