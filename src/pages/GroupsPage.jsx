
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateGroupDialog from '@/components/CreateGroupDialog';
import GroupCard from '@/components/GroupCard';
import GroupChatDialog from '@/components/GroupChatDialog';
import { supabase } from '@/lib/customSupabaseClient';

const GroupsPage = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, [currentUser.id]);

  const loadGroups = async () => {
    // Fetch groups where user is a member
    const { data: memberOf } = await supabase
        .from('group_members')
        .select('group_id')
        .order('created_at', { ascending: false });

    if (!memberOf?.length) {
        setGroups([]);
        return;
    }
    
   // 你加入的群 id
const groupIds = memberOf.map(m => m.group_id);

// 1) 公开群
const { data: publicGroupsData, error: e1 } = await supabase
  .from('groups')
  .select(`
    *,
    group_members (user_id, role),
    group_mentions (user_id, read)
  `)
  .eq('is_public', true);

if (e1) console.error("public groups error:", e1);

// 2) 我加入的群
let memberGroupsData = [];
if (groupIds.length > 0) {
  const { data: g2, error: e2 } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (user_id, role),
      group_mentions (user_id, read)
    `)
    .in('id', groupIds);

  if (e2) console.error("member groups error:", e2);
  memberGroupsData = g2 || [];
}

// 3) 合并去重（按 group.id）
const map = new Map();
[...(publicGroupsData || []), ...memberGroupsData].forEach(g => map.set(g.id, g));
const groupsData = Array.from(map.values());

    
    const formattedGroups = groupsData?.map(g => ({
        ...g,
        creatorId: g.creator_id,
        members: g.group_members.map(m => m.user_id),
        admins: g.group_members.filter(m => m.role === 'admin' || m.role === 'owner').map(m => m.user_id),
        mentions: g.group_mentions.filter(m => !m.read).map(m => ({ userId: m.user_id }))
    })) || [];

    setGroups(formattedGroups);
  };

  const handleCreateGroup = async (groupData) => {
    // 1. Create Group
    const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
            name: groupData.name,
            description: groupData.description,
            creator_id: currentUser.id
        })
        .select()
        .single();

    if (error || !newGroup) return toast({ title: "Error", description: "Failed to create group", variant: "destructive" });

    // 2. Add creator as owner/member
    await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id: currentUser.id,
        role: 'owner'
    });
    
    // Earn 1 Coin
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    await supabase.from('profiles').update({ coins: (profile?.coins || 0) + 1 }).eq('id', currentUser.id);

    loadGroups();
    setShowCreateDialog(false);
    
    toast({
      title: "Group created!",
      description: "You earned 1 ZEHEM Coin!",
      className: "bg-green-50 border-green-200"
    });
  };

  const handleJoinGroup = async (groupId) => {
    await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: currentUser.id,
        role: 'member'
    });

    loadGroups();
    toast({ title: "Joined group!", description: "You are now a member of this group." });
  };

  const handleDeleteGroup = async (groupId) => {
    await supabase.from('groups').delete().eq('id', groupId);
    
    // Lose 1 Coin
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    const newBalance = Math.max(0, (profile?.coins || 0) - 1);
    await supabase.from('profiles').update({ coins: newBalance }).eq('id', currentUser.id);
    
    loadGroups();
    
    toast({
      title: "Group deleted",
      description: "You lost 1 ZEHEM Coin.",
      variant: "destructive"
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
          <p className="text-gray-600">Connect with communities</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No groups yet. Create or join one!</p>
          </div>
        ) : (
          groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <GroupCard
                group={group}
                currentUser={currentUser}
                onOpenChat={() => setSelectedGroup(group)}
                onJoin={handleJoinGroup}
              />
            </motion.div>
          ))
        )}
      </div>

      {showCreateDialog && (
        <CreateGroupDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {selectedGroup && (
        <GroupChatDialog
          group={selectedGroup}
          currentUser={currentUser}
          onClose={() => setSelectedGroup(null)}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
    </div>
  );
};

export default GroupsPage;
