import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { INITIAL_MOCK_AUDIT_LOGS } from '../data/mockAuditLogs.js';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'security';
export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PUBLISH'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'IMPORT'
  | 'VERIFY'
  | 'WITHHOLD'
  | 'REVALUATE'
  | 'SECURITY_ALERT';
export type AuditEntityType = 'user' | 'course' | 'enrollment' | 'attendance' | 'examination' | 'schedule' | 'marks' | 'result' | 'results' | 'seating' | 'notice' | 'system' | 'security';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  created_at?: string;
  user_id: string;
  user_name: string;
  role: string;
  action: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name?: string;
  description: string;
  ip_address: string;
  user_agent?: string;
  severity: AuditSeverity;
  changes_payload?: Record<string, any>;
}

export interface AuditFilters {
  search?: string;
  entity_type?: AuditEntityType | 'all';
  action?: AuditActionType | 'all';
  severity?: AuditSeverity | 'all';
  role?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  /**
   * Fetch all audit logs directly from Supabase
   */
  getLogs: async (filters?: AuditFilters): Promise<AuditLogEntry[]> => {
    let entries: AuditLogEntry[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('audit_logs')
          .select(`
            id,
            user_id,
            user_name,
            role,
            action,
            entity_type,
            entity_id,
            entity_name,
            description,
            severity,
            ip_address,
            created_at,
            profile:profiles(full_name)
          `)
          .order('created_at', { ascending: false });

        if (filters?.entity_type && filters.entity_type !== 'all') {
          query = query.eq('entity_type', filters.entity_type);
        }
        if (filters?.action && filters.action !== 'all') {
          query = query.eq('action', filters.action);
        }
        if (filters?.role && filters.role !== 'all') {
          query = query.eq('role', filters.role);
        }
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          entries = data.map((row: any) => {
            let derivedSeverity: AuditSeverity = 'info';
            const actionStr = String(row.action).toUpperCase();
            if (actionStr === 'DELETE' || actionStr === 'REJECT') derivedSeverity = 'warning';
            if (actionStr === 'LOGIN' || actionStr === 'LOGOUT') derivedSeverity = 'info';
            if (row.description && row.description.toLowerCase().includes('password')) derivedSeverity = 'security';

            return {
              id: row.id,
              timestamp: row.created_at,
              created_at: row.created_at,
              user_id: row.user_id || 'system',
              user_name: row.user_name || row.profile?.full_name || (row.role ? `${row.role.toUpperCase()} User` : 'System Operator'),
              role: row.role || 'system',
              action: row.action as AuditActionType,
              entity_type: (row.entity_type || 'system') as AuditEntityType,
              entity_id: row.entity_id || '',
              entity_name: row.entity_name || row.entity_id || '',
              description: row.description || '',
              ip_address: row.ip_address || '127.0.0.1',
              severity: row.severity || derivedSeverity,
            };
          });
        }
      } catch (err) {
        console.warn('[AUDIT] Failed to fetch audit logs, falling back to mock:', err);
      }
    }

    if (entries.length === 0) {
      entries = INITIAL_MOCK_AUDIT_LOGS.map((m) => ({
        ...m,
        created_at: m.timestamp,
        entity_id: m.entity_id || '',
      })) as unknown as AuditLogEntry[];
      if (filters?.entity_type && filters.entity_type !== 'all') {
        entries = entries.filter((l) => l.entity_type === filters.entity_type);
      }
      if (filters?.action && filters.action !== 'all') {
        entries = entries.filter((l) => l.action === filters.action);
      }
      if (filters?.role && filters.role !== 'all') {
        entries = entries.filter((l) => l.role === filters.role);
      }
      if (filters?.startDate) {
        entries = entries.filter((l) => l.timestamp >= filters.startDate!);
      }
      if (filters?.endDate) {
        entries = entries.filter((l) => l.timestamp <= filters.endDate!);
      }
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      entries = entries.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.user_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity_type.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }

    return entries;
  },

  /**
   * Record a new audit log event in database
   */
  logEvent: async (
    event: Partial<Omit<AuditLogEntry, 'id' | 'timestamp' | 'ip_address' | 'user_agent'>> & {
      action: string;
      entity_type?: string;
      description: string;
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<void> => {
    if (!isSupabaseConfigured) return;

    try {
      await supabase.from('audit_logs').insert({
        user_id: event.user_id === 'system' ? null : event.user_id,
        user_name: event.user_name || null,
        role: event.role || 'system',
        action: event.action,
        entity_type: event.entity_type || 'system',
        entity_id: event.entity_id || null,
        entity_name: event.entity_name || null,
        description: event.description,
        severity: event.severity || 'info',
        ip_address: event.ip_address || null,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[AUDIT] Failed to persist audit log to database:', e);
    }
  },

  /**
   * Universal action logger used across services
   */
  logAction: async (
    eventOrAction:
      | string
      | {
          action: string;
          entity_type?: string;
          entity_id?: string;
          entity_name?: string;
          description: string;
          severity?: AuditSeverity;
          user_id?: string;
          user_name?: string;
          role?: string;
          changes_payload?: Record<string, any>;
          ip_address?: string;
        },
    entity_type?: string,
    description?: string,
    user_name?: string
  ): Promise<void> => {
    if (typeof eventOrAction === 'string') {
      return auditService.logEvent({
        action: (eventOrAction as AuditActionType) || 'UPDATE',
        entity_type: (entity_type as AuditEntityType) || 'system',
        entity_id: 'action',
        description: description || eventOrAction,
        user_name: user_name || 'System Operator',
        role: 'system',
        severity: 'info',
      });
    }
    const event = eventOrAction;
    return auditService.logEvent({
      user_id: event.user_id || 'system',
      user_name: event.user_name || 'System Operator',
      role: event.role || 'system',
      action: (event.action as AuditActionType) || 'UPDATE',
      entity_type: (event.entity_type as AuditEntityType) || 'system',
      entity_id: event.entity_id || '',
      entity_name: event.entity_name,
      description: event.description || '',
      severity: event.severity || 'info',
      changes_payload: event.changes_payload,
      ip_address: event.ip_address || '127.0.0.1',
    });
  },

  /**
   * Get aggregate metrics for executive dashboard
   */
  getMetrics: async () => {
    const logs = await auditService.getLogs();
    const totalLogs = logs.length;
    const securityAlerts = logs.filter((l) => l.severity === 'security' || l.severity === 'critical').length;
    const totalUsersActive = new Set(logs.map((l) => l.user_id)).size;

    const byEntity: Record<string, number> = {};
    logs.forEach((l) => {
      byEntity[l.entity_type] = (byEntity[l.entity_type] || 0) + 1;
    });

    const bySeverity: Record<string, number> = {
      info: logs.filter((l) => l.severity === 'info').length,
      warning: logs.filter((l) => l.severity === 'warning').length,
      critical: logs.filter((l) => l.severity === 'critical').length,
      security: logs.filter((l) => l.severity === 'security').length,
    };

    return {
      totalLogs,
      securityAlerts,
      totalUsersActive,
      byEntity,
      bySeverity,
    };
  },

  /**
   * Export audit log records in CSV format with formula injection sanitization
   */
  exportToCSV: (logs: AuditLogEntry[]): string => {
    const sanitize = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Entity Target', 'Severity', 'IP Address', 'Description'];
    const rows = logs.map((l) => [
      sanitize(l.id),
      sanitize(l.timestamp),
      sanitize(l.user_name),
      sanitize(l.role),
      sanitize(l.action),
      sanitize(l.entity_type),
      sanitize(l.entity_name || l.entity_id || ''),
      sanitize(l.severity.toUpperCase()),
      sanitize(l.ip_address),
      sanitize(l.description),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
