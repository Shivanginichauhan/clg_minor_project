import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Plus,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { adminService, CustomRole } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const RolePermissionPage: React.FC = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Role Form
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [description, setDescription] = useState('');
  const [isDeptScoped, setIsDeptScoped] = useState(false);
  const [scopeDept, setScopeDept] = useState('Department of Computer Science');

  const reloadData = () => {
    const list = adminService.getCustomRoles();
    setRoles(list);
    if (list.length > 0 && !selectedRole) {
      setSelectedRole(list[0]);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleTogglePermission = (
    moduleKey: keyof CustomRole['permissions'],
    action: string
  ) => {
    if (!selectedRole) return;

    const currentActions = selectedRole.permissions[moduleKey] as string[];
    const exists = currentActions.includes(action);
    const updatedActions = exists
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];

    const updatedRole: CustomRole = {
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [moduleKey]: updatedActions,
      },
    };

    setSelectedRole(updatedRole);
    adminService.saveCustomRole(updatedRole);
    setNotice(`Updated permissions for ${updatedRole.role_name}`);
    reloadData();
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    const newRole: CustomRole = {
      id: `role-${Date.now()}`,
      role_code: roleCode.toUpperCase().replace(/\s+/g, '_'),
      role_name: roleName,
      description,
      department_scoped: isDeptScoped,
      scope_department: isDeptScoped ? scopeDept : undefined,
      is_system_reserved: false,
      permissions: {
        academics: ['view'],
        examinations: ['view'],
        finance: [],
        grievances: ['view'],
        audit: [],
      },
      assigned_users_count: 0,
    };

    adminService.saveCustomRole(newRole);
    reloadData();
    setSelectedRole(newRole);
    setIsNewRoleOpen(false);
    setNotice(`Custom statutory role ${newRole.role_name} registered.`);
    setRoleName('');
    setRoleCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Access Governance</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Role & Permission Matrix
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Create custom statutory roles, bind department-level scoping, and configure granular action permissions across academic modules.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-indigo-300 font-medium">Custom Roles</p>
              <div className="text-xl font-bold text-white mt-0.5">{roles.length} Defined</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-emerald-600">✕</button>
        </div>
      )}

      {/* Main Split: Role List + Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">Configured Roles</h3>
            <button
              onClick={() => setIsNewRoleOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold bg-[#0F2747] text-white rounded hover:bg-[#1E5AA8] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Role
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedRole?.id === r.id
                    ? 'bg-blue-50/80 border-[#1E5AA8] shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {r.role_code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {r.assigned_users_count} Users
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#0F2747]">{r.role_name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                {r.department_scoped && (
                  <div className="mt-2 text-[10px] text-[#1E5AA8] font-semibold flex items-center gap-1">
                    <Building className="w-3 h-3" /> Scoped: {r.scope_department}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="academic-card p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedRole.role_code}
                  </span>
                  {selectedRole.department_scoped && (
                    <span className="text-xs font-semibold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded">
                      Department Scoped
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[#0F2747] mt-1">{selectedRole.role_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
              </div>

              {/* Matrix Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Module Action Entitlements
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Academic Module</th>
                        <th className="py-2.5 px-4 text-center">View</th>
                        <th className="py-2.5 px-4 text-center">Create</th>
                        <th className="py-2.5 px-4 text-center">Edit</th>
                        <th className="py-2.5 px-4 text-center">Approve / Disburse</th>
                        <th className="py-2.5 px-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Academics */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0F2747]">Academics & Structure</td>
                        {['view', 'create', 'edit', 'approve', 'delete'].map((action) => {
                          const isChecked = selectedRole.permissions.academics.includes(action as any);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission('academics', action)}
                                className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Examinations */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0F2747]">Examinations & Seating</td>
                        {['view', 'create', 'edit', 'approve', 'delete'].map((action) => {
                          const isChecked = selectedRole.permissions.examinations.includes(action as any);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission('examinations', action)}
                                className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Finance */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0F2747]">Fee & Finance Ledger</td>
                        {['view', 'issue', 'refund', 'approve', 'delete'].map((action) => {
                          const isChecked = selectedRole.permissions.finance.includes(action as any);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission('finance', action)}
                                className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Grievances */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0F2747]">Grievance Helpdesk</td>
                        {['view', 'resolve', 'escalate', 'approve', 'delete'].map((action) => {
                          const isChecked = selectedRole.permissions.grievances.includes(action as any);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission('grievances', action)}
                                className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Audit */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0F2747]">Security Audit Log</td>
                        {['view', 'export', 'edit', 'approve', 'delete'].map((action) => {
                          const isChecked = selectedRole.permissions.audit.includes(action as any);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission('audit', action)}
                                className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="academic-card p-12 text-center text-slate-400 text-sm">
              Select a statutory role to review and modify permission matrices.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE ROLE */}
      {isNewRoleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747]">Create Custom Institutional Role</h3>
              <button onClick={() => setIsNewRoleOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Display Title</label>
                <input
                  type="text"
                  placeholder="e.g. Examination Superintendent"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role Code</label>
                <input
                  type="text"
                  placeholder="e.g. EXAM_SUPERINTENDENT"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Functional Description</label>
                <textarea
                  rows={2}
                  placeholder="Responsibilities and functional mandate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDeptScoped}
                    onChange={(e) => setIsDeptScoped(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F2747]"
                  />
                  Scope Privileges to Specific Department Only
                </label>

                {isDeptScoped && (
                  <select
                    value={scopeDept}
                    onChange={(e) => setScopeDept(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="Department of Computer Science">Department of Computer Science</option>
                    <option value="Department of Electronics Engineering">Department of Electronics Engineering</option>
                    <option value="Department of Management Studies">Department of Management Studies</option>
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRoleOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2747] text-white rounded font-semibold hover:bg-[#1E5AA8]"
                >
                  Register Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
