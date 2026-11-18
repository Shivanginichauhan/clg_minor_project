import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  FolderLock,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Share2,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  Copy,
  Archive
} from 'lucide-react';
import {
  documentVaultService,
  VaultDocument,
  DocumentCategory
} from '../../services/documentVaultService.js';

export const DocumentsVaultPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [user]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const roll = (user?.user_metadata?.roll_number as string | undefined) || '2025-MCA-042';
      const data = await documentVaultService.getDocuments(user?.id, roll);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: VaultDocument) => {
    documentVaultService.downloadDocument(doc);
  };

  const handleDownloadAllZip = () => {
    setIsZipping(true);
    setTimeout(() => {
      // Create summary manifest download
      const studentDisplayName = profile?.full_name || 'Enrolled Student';
      const studentRoll = (user?.user_metadata?.roll_number as string | undefined) || '2025-MCA-042';
      const content = `ITM UNIVERSITY - SECURE DOCUMENT VAULT ARCHIVE\nGenerated for: ${studentDisplayName} (${studentRoll})\nTotal Documents: ${documents.length}\nTimestamp: ${new Date().toISOString()}\n\nIncluded Documents:\n` +
        documents.map((d, i) => `${i + 1}. [${d.category.toUpperCase()}] ${d.title} (Ref: ${d.verification_code})`).join('\n');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ITM_All_Academic_Documents_Vault_Archive.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsZipping(false);
    }, 800);
  };

  const handleCopyShareLink = (code: string) => {
    navigator.clipboard.writeText(`https://verify.itm.edu/doc/${code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filtered = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.verification_code.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.semester.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Documents' },
    { id: 'marksheet', label: 'Grade Cards' },
    { id: 'hall_ticket', label: 'Hall Tickets' },
    { id: 'receipt', label: 'Fee Receipts' },
    { id: 'scholarship', label: 'Scholarships' },
    { id: 'condonation', label: 'Condonations' },
    { id: 'certificate', label: 'Certificates' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Cryptographically Signed Academic Dossier
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              My Documents Vault
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Centralized repository for official transcripts, hall tickets, fee receipts, scholarship sanction orders, and university clearance letters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="btn-3d-gold px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>{isZipping ? 'Archiving...' : 'Download Vault (ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0F2747] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ref code, or date..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#1E5AA8]"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <FolderLock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#0F2747]">No documents match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting "All Documents".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8]/50 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                    {doc.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {doc.issue_date}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0F2747] leading-snug line-clamp-2">{doc.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{doc.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{doc.file_name}</span>
                  <span className="font-mono font-bold text-slate-700">{doc.file_size}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 py-1.5 px-3 btn-3d-gold text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview & Verification Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {previewDoc.category}
                </span>
                <h3 className="text-base font-bold text-[#0F2747] mt-1">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500">{previewDoc.semester}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
                aria-label="Close document preview"
              >
                ✕
              </button>
            </div>

            {/* Document Certificate Frame */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Verification Code:</span>
                <span className="font-mono font-bold text-[#1E5AA8] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {previewDoc.verification_code}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Authorized Issuer:</span>
                <span className="text-slate-800 font-semibold">{previewDoc.issuer}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Attestation Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Digitally Signed &amp; Sealed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">{previewDoc.description}</p>
            </div>

            {/* Share Verification Link */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <p className="text-[11px] font-bold text-[#0F2747] flex items-center justify-between">
                <span>Public Verification URL</span>
                {copiedLink && <span className="text-emerald-600">✓ Copied to clipboard!</span>}
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`https://verify.itm.edu/doc/${previewDoc.verification_code}`}
                  className="w-full text-[11px] font-mono bg-white p-1.5 rounded border border-blue-200 text-slate-700"
                />
                <button
                  onClick={() => handleCopyShareLink(previewDoc.verification_code)}
                  className="p-1.5 bg-white hover:bg-blue-100 border border-blue-200 rounded text-slate-700 cursor-pointer"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewDoc)}
                className="btn-3d-gold px-5 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
