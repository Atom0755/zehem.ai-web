
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Crown, Settings, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const GroupChatDialog = ({ group: initialGroup, currentUser, onClose, onDeleteGroup }) => {
  const [group, setGroup] = useState(initialGroup);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [membersDetails, setMembersDetails] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [editName, setEditName] = useState('');
  
  const scrollRef = useRef(null);
  const { toast } = useToast();

  const isOwner = group.creatorId === currentUser.id;
  const isAdmin = group.admins?.includes(currentUser.id);

  // Fetch Messages & Members on Mount
  useEffect(() => {
    const fetchData = async () => {
        // Messages
        const { data: msgs } = await supabase
            .from('group_messages')
            .select('*, profiles!user_id(username)')
            .eq('group_id', group.id)
            .order('created_at', { ascending: true });
        
        const formattedMessages = msgs?.map(m => ({
            ...m,
            userId: m.user_id,
            username: m.profiles.username,
            timestamp: m.created_at,
            isMentionAll: m.is_mention_all
        })) || [];
        setMessages(formattedMessages);

        // Members
        const { data: mems } = await supabase
            .from('group_members')
            .select('user_id, role, profiles!user_id(username)')
            .eq('group_id', group.id);
        
        const formattedMembers = mems?.map(m => ({
            id: m.user_id,
            username: m.profiles.username,
            role: m.role
        })) || [];
        setMembersDetails(formattedMembers);
        
        setEditName(group.name);

        // Mark Mentions as Read
        await supabase
            .from('group_mentions')
            .update({ read: true })
            .eq('group_id', group.id)
            .eq('user_id', currentUser.id);
    };

    fetchData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`group_chat:${group.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${group.id}`
      }, async (payload) => {
         // Fetch profile for the new message sender
         const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();
         
         const newMsg = {
             ...payload.new,
             userId: payload.new.user_id,
             username: profile?.username,
             timestamp: payload.new.created_at,
             isMentionAll: payload.new.is_mention_all
         };
         setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [group.id, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let mentionUserIds = [];
    const isMentionAll = (isOwner || isAdmin) && newMessage.includes('@everyone');
    
    if (isMentionAll) {
        mentionUserIds = membersDetails.filter(m => m.id !== currentUser.id).map(m => m.id);
    } else {
        const words = newMessage.split(' ');
        words.forEach(word => {
            if (word.startsWith('@')) {
                const username = word.substring(1);
                const mentionedUser = membersDetails.find(u => u.username === username);
                if (mentionedUser && mentionedUser.id !== currentUser.id) {
                    mentionUserIds.push(mentionedUser.id);
                }
            }
        });
    }
    const uniqueMentions = [...new Set(mentionUserIds)];

    // Send Message
    const { data: sentMsg, error } = await supabase.from('group_messages').insert({
        group_id: group.id,
        user_id: currentUser.id,
        content: newMessage,
        is_mention_all: isMentionAll
    }).select().single();

    if (error) return;

    // Create Mentions
    if (uniqueMentions.length > 0) {
        const mentionsToInsert = uniqueMentions.map(uid => ({
            group_id: group.id,
            user_id: uid,
            message_id: sentMsg.id,
            read: false
        }));
        await supabase.from('group_mentions').insert(mentionsToInsert);
    }

    setNewMessage('');
  };

  const updateMemberRole = async (memberId, newRole) => {
      const { error } = await supabase.from('group_members')
        .update({ role: newRole })
        .eq('group_id', group.id)
        .eq('user_id', memberId);
      
      if (!error) {
          setMembersDetails(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
          // Optimistically update local group state (admin list)
          setGroup(prev => {
              const currentAdmins = prev.admins || [];
              let newAdmins = [...currentAdmins];
              if (newRole === 'admin') newAdmins.push(memberId);
              else newAdmins = newAdmins.filter(id => id !== memberId);
              return { ...prev, admins: newAdmins };
          });
          toast({ title: "Success", description: "Role updated" });
      }
  };

  const handleAddAdmin = (memberId) => {
     if ((group.admins?.length || 0) >= 7) {
         return toast({ title: "Limit reached", description: "Max 7 admins allowed", variant: "destructive" });
     }
     updateMemberRole(memberId, 'admin');
  };

  const handleRemoveAdmin = (memberId) => {
     updateMemberRole(memberId, 'member');
  };

  const handleUpdateName = async () => {
      if (!editName.trim()) return;
      const { error } = await supabase.from('groups').update({ name: editName }).eq('id', group.id);
      if (!error) {
          setGroup(prev => ({ ...prev, name: editName }));
          toast({ title: "Success", description: "Group name updated" });
      }
  };

  const renderMessageContent = (msg) => {
      // In a real app we'd fetch mentions for this message to be precise, 
      // but here we can check local logic or if `msg` has a mentions array attached from backend view
      const isMentioned = msg.isMentionAll || msg.content.includes(`@${currentUser.username}`);
      
      if (!isMentioned) return msg.content;

      const words = msg.content.split(' ');
      const first20 = words.slice(0, 20).join(' ');
      const rest = words.slice(20).join(' ');

      return (
          <span>
              <span className="font-bold">{first20}</span>{' '}
              {rest}
          </span>
      );
  };

  const displayedMembers = showAllMembers ? membersDetails : membersDetails.slice(0, 20);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden"
      >
        <div className={`flex-1 flex flex-col h-full border-r border-gray-200 ${showSettings ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                {isAdmin && <Crown className="w-5 h-5 text-yellow-600" />}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                   <Settings className="w-5 h-5" />
                </Button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.userId === currentUser.id 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                    {msg.userId !== currentUser.id && (
                      <p className="text-xs font-bold mb-1 opacity-70">@{msg.username}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {renderMessageContent(msg)}
                    </p>
                    <p className={`text-[10px] mt-1 ${msg.userId === currentUser.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message... (@username or @everyone)"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                />
                <Button type="submit" size="icon" className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
        </div>

        {/* Settings Sidebar */}
        {(showSettings) && (
            <div className="w-full md:w-80 bg-white flex flex-col h-full overflow-y-auto absolute md:relative inset-0 md:inset-auto z-10">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Group Management</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} className="md:hidden">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="p-4 space-y-6">
                    {/* Name Edit */}
                    {(isOwner || isAdmin) && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Group Name</label>
                            <div className="flex gap-2">
                                <input 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 text-sm border rounded px-2 py-1"
                                />
                                <Button size="sm" onClick={handleUpdateName}>Save</Button>
                            </div>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-gray-500">Members ({membersDetails.length})</label>
                            {!showAllMembers && membersDetails.length > 20 && (
                                <button onClick={() => setShowAllMembers(true)} className="text-xs text-blue-600 hover:underline">
                                    See all
                                </button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {displayedMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                            {member.username[0].toUpperCase()}
                                        </div>
                                        <span className={member.role === 'admin' || member.role === 'owner' ? "font-semibold text-blue-600" : ""}>
                                            @{member.username}
                                        </span>
                                        {member.role === 'owner' && <Crown className="w-3 h-3 text-yellow-500" />}
                                    </div>
                                    
                                    {/* Admin Controls (Owner Only) */}
                                    {isOwner && member.id !== currentUser.id && (
                                        member.role === 'admin' ? (
                                            <button onClick={() => handleRemoveAdmin(member.id)} title="Remove Admin" className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        ) : member.role === 'member' ? (
                                            <button onClick={() => handleAddAdmin(member.id)} title="Make Admin" className="text-green-500 hover:bg-green-50 p-1 rounded">
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        ) : null
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    {isOwner && (
                         <div className="pt-6 border-t border-gray-200">
                             <label className="text-xs font-semibold uppercase text-red-500 block mb-2">Danger Zone</label>
                             <Button 
                                variant="destructive" 
                                className="w-full gap-2"
                                onClick={() => {
                                    if(window.confirm("Are you sure you want to delete this group? It cannot be undone.")) {
                                        onDeleteGroup(group.id);
                                        onClose();
                                    }
                                }}
                             >
                                 <Trash2 className="w-4 h-4" />
                                 Delete Group
                             </Button>
                         </div>
                    )}
                </div>
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default GroupChatDialog;
