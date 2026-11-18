import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { User, Phone, Mail, ShieldCheck, Calendar, X, Check, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
        await refreshProfile();
      } catch (err) {
        console.error('Failed to update profile:', err);
      }
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-[#172033]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-blue-200 flex-shrink-0 flex items-center justify-center text-[#0F2747] font-bold text-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile.full_name.charAt(0)
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">{profile.full_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                {profile.role}
              </span>
              <span className="text-xs text-[#16A34A] flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Active Account
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Full Legal Name</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8] pl-9"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Institutional Email</label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed pl-9"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Managed via official university identity registrar.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8] pl-9"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Account UID:</span>
              <span className="font-mono text-slate-700 text-[11px]">{profile.id.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Member Since:</span>
              <span className="text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saved}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
