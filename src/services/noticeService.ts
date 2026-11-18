import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { auditService } from './auditService.js';
import { INITIAL_MOCK_NOTICES } from '../data/mockNotices.js';

const LOCAL_CUSTOM_NOTICES_KEY = 'ueams_custom_published_notices';

const getStoredCustomNotices = (): UniversityNotice[] => {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_NOTICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [];
};

const saveCustomNoticeToStorage = (notice: UniversityNotice) => {
  try {
    const list = getStoredCustomNotices();
    list.unshift(notice);
    localStorage.setItem(LOCAL_CUSTOM_NOTICES_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
};

const saveAllCustomNoticesToStorage = (list: UniversityNotice[]) => {
  try {
    localStorage.setItem(LOCAL_CUSTOM_NOTICES_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
};

export type NoticePriority = 'normal' | 'important' | 'urgent';
export type NoticeAudience = 'all' | 'students' | 'faculty' | 'deans';
export type NoticeCategory = 'examination' | 'academic' | 'administrative' | 'fee' | 'general';

export interface UniversityNotice {
  id: string;
  circular_number: string;
  title: string;
  category: NoticeCategory;
  content: string;
  published_at: string;
  expires_at?: string;
  author_id?: string;
  author_name: string;
  author_designation?: string;
  author_role?: string;
  target_audience: NoticeAudience;
  priority: NoticePriority;
  is_pinned: boolean;
  views_count: number;
  pdf_url?: string;
  department_name?: string;
  broadcast_alert?: boolean;
  attachments?: any[];
}

export interface NoticeFilters {
  search?: string;
  category?: NoticeCategory | 'all';
  priority?: NoticePriority | 'all';
  target_audience?: NoticeAudience | 'all';
  is_pinned?: boolean;
  status?: 'active' | 'expired' | 'all';
}

const READ_NOTICES_STORAGE_KEY = 'ueams_read_notices_tracker';

const getReadTracker = (): Record<string, string[]> => {
  const data = localStorage.getItem(READ_NOTICES_STORAGE_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const saveReadTracker = (tracker: Record<string, string[]>) => {
  localStorage.setItem(READ_NOTICES_STORAGE_KEY, JSON.stringify(tracker));
};

export const noticeService = {
  /**
   * Get notices filtered by user role and custom query parameters from Supabase
   */
  getNoticesForUser: async (userRole: string, filters?: NoticeFilters): Promise<UniversityNotice[]> => {
    let fetchedNotices: any[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('notices')
          .select(`
            *,
            author:profiles(id, full_name, role)
          `)
          .order('is_pinned', { ascending: false })
          .order('published_at', { ascending: false });

        if (userRole === 'student') {
          query = query.in('target_audience', ['all', 'students']);
        } else if (userRole === 'faculty') {
          query = query.in('target_audience', ['all', 'faculty']);
        } else if (userRole === 'dean') {
          query = query.in('target_audience', ['all', 'deans', 'faculty']);
        }

        if (filters?.is_pinned !== undefined) {
          query = query.eq('is_pinned', filters.is_pinned);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          fetchedNotices = data;
        }
      } catch (err) {
        console.error('[NOTICES] Failed to fetch notices from database, falling back to local dataset:', err);
      }
    }

    try {
      const customNotices = getStoredCustomNotices();
      let notices: UniversityNotice[] = [];

      if (fetchedNotices.length > 0) {
        notices = fetchedNotices.map((row: any, idx: number) => ({
          id: row.id,
          circular_number: `UEAMS/CIR/${new Date(row.published_at || row.created_at).getFullYear()}/${String(idx + 1).padStart(3, '0')}`,
          title: row.title,
          category: (row.category as NoticeCategory) || 'academic',
          content: row.content,
          published_at: row.published_at || row.created_at,
          expires_at: row.expires_at || undefined,
          author_id: row.author_id,
          author_name: row.author?.full_name || 'Office of Controller of Examinations',
          author_designation: row.author?.role === 'administrator' ? 'Controller of Examinations' : 'Academic Dean',
          target_audience: row.target_audience as NoticeAudience,
          priority: (row.priority as NoticePriority) || 'normal',
          is_pinned: Boolean(row.is_pinned),
          views_count: row.views_count || 1,
          attachments: (row.attachments && row.attachments.length > 0)
            ? row.attachments
            : [
                { name: 'Official_Academic_Circular_Enclosure.pdf', url: '#', size: '640 KB', type: 'application/pdf' }
              ],
        }));
      } else {
        // Merge custom published notices with INITIAL_MOCK_NOTICES
        const mockBase = INITIAL_MOCK_NOTICES.map((m) => ({
          ...m,
          attachments: (m.attachments && m.attachments.length > 0)
            ? m.attachments
            : [{ name: 'Official_Academic_Circular_Enclosure.pdf', url: '#', size: '640 KB', type: 'application/pdf' }]
        })) as unknown as UniversityNotice[];
        notices = [...customNotices, ...mockBase];
      }

      // Filter by role if using local fallback
      if (fetchedNotices.length === 0) {
        if (userRole === 'student') {
          notices = notices.filter((n) => n.target_audience === 'all' || n.target_audience === 'students');
        } else if (userRole === 'faculty') {
          notices = notices.filter((n) => n.target_audience === 'all' || n.target_audience === 'faculty');
        } else if (userRole === 'dean') {
          notices = notices.filter((n) => n.target_audience === 'all' || n.target_audience === 'deans' || n.target_audience === 'faculty');
        }
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        notices = notices.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.circular_number.toLowerCase().includes(q) ||
            n.author_name.toLowerCase().includes(q)
        );
      }

      if (filters?.category && filters.category !== 'all') {
        notices = notices.filter((n) => n.category === filters.category);
      }

      if (filters?.priority && filters.priority !== 'all') {
        notices = notices.filter((n) => n.priority === filters.priority);
      }

      if (filters?.target_audience && filters.target_audience !== 'all') {
        notices = notices.filter((n) => n.target_audience === filters.target_audience);
      }

      if (filters?.status) {
        const now = new Date().getTime();
        if (filters.status === 'active') {
          notices = notices.filter((n) => !n.expires_at || new Date(n.expires_at).getTime() > now);
        } else if (filters.status === 'expired') {
          notices = notices.filter((n) => n.expires_at && new Date(n.expires_at).getTime() <= now);
        }
      }

      return notices;
    } catch (err) {
      console.error('[NOTICES] Exception fetching notices:', err);
      return [];
    }
  },

  /**
   * Get single notice by ID
   */
  getNoticeById: async (id: string): Promise<UniversityNotice | undefined> => {
    if (!isSupabaseConfigured) return undefined;

    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`*, author:profiles(id, full_name, role)`)
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        circular_number: `UEAMS/CIR/${new Date(data.published_at || data.created_at).getFullYear()}/001`,
        title: data.title,
        category: (data.category as NoticeCategory) || 'academic',
        content: data.content,
        published_at: data.published_at || data.created_at,
        expires_at: data.expires_at || undefined,
        author_id: data.author_id,
        author_name: data.author?.full_name || 'Controller of Examinations',
        author_designation: 'Office of Controller of Examinations',
        target_audience: data.target_audience as NoticeAudience,
        priority: (data.priority as NoticePriority) || 'normal',
        is_pinned: Boolean(data.is_pinned),
        views_count: data.views_count || 1,
      };
    } catch (err) {
      return undefined;
    }
  },

  /**
   * Publish a new circular notice to Supabase
   */
  createNotice: async (
    noticeData: Omit<UniversityNotice, 'id' | 'circular_number' | 'published_at' | 'views_count'>,
    currentUser: { id: string; name: string; role: any }
  ): Promise<UniversityNotice> => {
    const newNotice: UniversityNotice = {
      id: `not-${Date.now()}`,
      circular_number: `UEAMS/CIR/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      title: noticeData.title,
      category: noticeData.category,
      content: noticeData.content,
      published_at: new Date().toISOString(),
      expires_at: noticeData.expires_at || undefined,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_designation: currentUser.role === 'administrator' ? 'Controller of Examinations' : 'Academic Dean',
      target_audience: noticeData.target_audience,
      priority: noticeData.priority,
      is_pinned: Boolean(noticeData.is_pinned),
      views_count: 1,
      attachments: noticeData.attachments || [
        { name: 'Official_Notice_Circular.pdf', url: '#', size: '520 KB', type: 'application/pdf' }
      ],
    };

    if (isSupabaseConfigured) {
      try {
        let authorId = currentUser.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId);
        if (!isUUID) {
          try {
            const { data: userAuth } = await supabase.auth.getUser();
            if (userAuth?.user?.id) {
              authorId = userAuth.user.id;
            } else {
              const { data: adminProf } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
              if (adminProf?.id) authorId = adminProf.id;
            }
          } catch {
            // fallback
          }
        }

        const { data, error } = await supabase
          .from('notices')
          .insert({
            title: noticeData.title,
            content: noticeData.content,
            target_audience: noticeData.target_audience,
            author_id: authorId,
            is_pinned: Boolean(noticeData.is_pinned),
            published_at: new Date().toISOString(),
            expires_at: noticeData.expires_at || null,
          })
          .select()
          .single();

        if (!error && data) {
          newNotice.id = data.id;
        }
      } catch (err) {
        console.warn('[NOTICES] DB insertion failed, persisting locally:', err);
      }
    }

    saveCustomNoticeToStorage(newNotice);

    auditService.logEvent({
      user_id: currentUser.id,
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'PUBLISH',
      entity_type: 'notice',
      entity_id: newNotice.id,
      entity_name: noticeData.title,
      description: `Published circular notice: "${noticeData.title}" for ${noticeData.target_audience}.`,
      severity: noticeData.priority === 'urgent' ? 'warning' : 'info',
    });

    return newNotice;
  },

  /**
   * Update existing notice in Supabase or local storage
   */
  updateNotice: async (
    id: string,
    updates: Partial<UniversityNotice>,
    currentUser: { id: string; name: string; role: any }
  ): Promise<void> => {
    // 1. Update in local storage cache
    const stored = getStoredCustomNotices();
    const idx = stored.findIndex((n) => n.id === id);
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...updates };
      saveAllCustomNoticesToStorage(stored);
    }

    // 2. Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.content !== undefined) updatePayload.content = updates.content;
        if (updates.target_audience !== undefined) updatePayload.target_audience = updates.target_audience;
        if (updates.is_pinned !== undefined) updatePayload.is_pinned = updates.is_pinned;
        if (updates.expires_at !== undefined) updatePayload.expires_at = updates.expires_at;

        const { error } = await supabase.from('notices').update(updatePayload).eq('id', id);
        if (error) {
          console.warn('[NOTICES] DB update failed, preserved locally:', error.message);
        }
      } catch (err) {
        console.warn('[NOTICES] DB update connection error:', err);
      }
    }

    auditService.logEvent({
      user_id: currentUser.id,
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE',
      entity_type: 'notice',
      entity_id: id,
      entity_name: updates.title,
      description: `Updated circular notice parameters for id ${id}.`,
      severity: 'info',
    });
  },

  /**
   * Toggle pinned state
   */
  togglePin: async (
    id: string,
    currentPinnedOrActor: boolean | { id: string; name: string; role: any },
    actor?: { id: string; name: string; role: any }
  ): Promise<boolean> => {
    let newPinned = true;
    const currentUser = typeof currentPinnedOrActor === 'boolean'
      ? actor || { id: 'admin', name: 'Admin', role: 'administrator' }
      : currentPinnedOrActor;

    if (typeof currentPinnedOrActor === 'boolean') {
      newPinned = !currentPinnedOrActor;
    }

    // Update in local cache
    const stored = getStoredCustomNotices();
    const idx = stored.findIndex((n) => n.id === id);
    if (idx !== -1) {
      stored[idx].is_pinned = newPinned;
      saveAllCustomNoticesToStorage(stored);
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notices').update({ is_pinned: newPinned, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) {
          console.warn('[NOTICES] DB togglePin failed, updated locally:', error.message);
        }
      } catch (err) {
        console.warn('[NOTICES] DB togglePin connection error:', err);
      }
    }

    auditService.logEvent({
      user_id: currentUser.id,
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE',
      entity_type: 'notice',
      entity_id: id,
      description: `${newPinned ? 'Pinned' : 'Unpinned'} notice on institutional boards.`,
      severity: 'info',
    });

    return newPinned;
  },

  /**
   * Delete a notice
   */
  deleteNotice: async (id: string, currentUser: { id: string; name: string; role: any }): Promise<boolean> => {
    // Remove from local cache
    const stored = getStoredCustomNotices();
    const filtered = stored.filter((n) => n.id !== id);
    saveAllCustomNoticesToStorage(filtered);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) {
          console.warn('[NOTICES] DB delete failed, deleted locally:', error.message);
        }
      } catch (err) {
        console.warn('[NOTICES] DB delete connection error:', err);
      }
    }

    auditService.logEvent({
      user_id: currentUser.id,
      user_name: currentUser.name,
      role: currentUser.role,
      action: 'DELETE',
      entity_type: 'notice',
      entity_id: id,
      description: `Deleted notice ${id}.`,
      severity: 'warning',
    });

    return true;
  },

  /**
   * Mark notice as read by current user in local tracker
   */
  markAsRead: (noticeId: string, userId: string) => {
    const tracker = getReadTracker();
    if (!tracker[userId]) {
      tracker[userId] = [];
    }
    if (!tracker[userId].includes(noticeId)) {
      tracker[userId].push(noticeId);
      saveReadTracker(tracker);
    }
  },

  /**
   * Increment notice view count
   */
  incrementViewCount: (noticeId: string) => {
    // Local increment or non-blocking tracking
  },

  /**
   * Get unread count for user
   */
  getUnreadCount: async (userId: string, userRole: string): Promise<number> => {
    const tracker = getReadTracker();
    const readIds = tracker[userId] || [];
    const available = await noticeService.getNoticesForUser(userRole, { status: 'active' });
    const unread = available.filter((n) => !readIds.includes(n.id));
    return unread.length;
  },
};
