'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2, Crown, Edit3, Eye } from 'lucide-react';
import { useTripMembers, useAddMember, useRemoveMember } from '@roamera/sdk';
import type { TripMember } from '@roamera/types';

interface Props {
  tripId: string;
  myRole: string;
  onClose: () => void;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5 text-yellow-500" />,
  editor: <Edit3 className="h-3.5 w-3.5 text-blue-500" />,
  viewer: <Eye className="h-3.5 w-3.5 text-slate-400" />,
};

function MemberRow({ member, myRole, tripId }: { member: TripMember; myRole: string; tripId: string }) {
  const removeMember = useRemoveMember();

  const canRemove = myRole === 'owner' && member.role !== 'owner';

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {member.username?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{member.username ?? member.userId}</p>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 capitalize">
          {ROLE_ICONS[member.role]}
          {member.role}
        </span>
      </div>
      {canRemove && (
        <button
          onClick={() => removeMember.mutate({ tripId, userId: member.userId })}
          disabled={removeMember.isPending}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </div>
  );
}

export function MembersModal({ tripId, myRole, onClose }: Props) {
  const { data: members, isLoading } = useTripMembers(tripId);
  const addMember = useAddMember();

  const [username, setUsername] = useState('');
  const [memberRole, setMemberRole] = useState('viewer');
  const [addError, setAddError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!username.trim()) return;
    try {
      await addMember.mutateAsync({ tripId, username: username.trim(), memberRole });
      setUsername('');
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trip Members</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Members list */}
        <div className="p-5 max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 text-teal-600 animate-spin" /></div>
          ) : members?.length ? (
            members.map((m) => <MemberRow key={m.userId} member={m} myRole={myRole} tripId={tripId} />)
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No members yet.</p>
          )}
        </div>

        {/* Invite section (owner + editor only) */}
        {(myRole === 'owner' || myRole === 'editor') && (
          <form onSubmit={handleAdd} className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Invite a Member</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
            <button
              type="submit"
              disabled={addMember.isPending || !username.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
            >
              {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Member
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
