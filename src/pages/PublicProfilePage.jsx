
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MessageSquare, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PostCard from '@/components/PostCard';
import GroupCard from '@/components/GroupCard';
import GroupChatDialog from '@/components/GroupChatDialog';
import { supabase } from '@/lib/customSupabaseClient';

const PublicProfilePage = ({ targetUserId, currentUser, onBack }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [counts, setCounts] = useState({ friends: 0, groups: 0, posts: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadProfileData();
    checkFollowStatus();
  }, [targetUserId]);

  const loadProfileData = async () => {
    // User Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
    setUser(profile);

    // Posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
  id,
  content,
  media_url,
  media_type,
  created_at,
  user_id,
  profiles:profiles (
    id,
    display_name,
    username
  )
`)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    
    const formattedPosts = postsData?.map(p => ({
        ...p,
        userId: p.user_id,
        username: p.profiles.username,
        likes: [], // Simplified for preview
        comments: [],
        mediaUrl: p.media_url,
        mediaType: p.media_type
    })) || [];
    setPosts(formattedPosts);

    // Groups Created
    const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .eq('creator_id', targetUserId)
        .limit(5);
    
    // For groups list, we just need basic info for the card
    // Note: GroupCard expects 'members' array etc, for full fidelity we'd need more queries or a view. 
    // Here we'll do a basic map to prevent crash
    const formattedGroups = groupsData?.map(g => ({
        ...g,
        creatorId: g.creator_id,
        members: [], // Placeholder, would need subquery
        admins: []
    })) || [];
    setGroups(formattedGroups);

    // Counts
    const { count: friendsCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'friend')
        .or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`);
    
    setCounts({
        friends: friendsCount || 0,
        groups: groupsData?.length || 0,
        posts: postsData?.length || 0
    });
  };

  const checkFollowStatus = async () => {
      const { data } = await supabase
        .from('relationships')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUserId)
        .eq('type', 'follow')
        .single();
      setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (isFollowing) {
        await supabase
            .from('relationships')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUserId)
            .eq('type', 'follow');
        setIsFollowing(false);
        toast({ title: "Unfollowed", description: `You unfollowed @${user.username}` });
    } else {
        await supabase
            .from('relationships')
            .insert({
                follower_id: currentUser.id,
                following_id: targetUserId,
                type: 'follow'
            });
        setIsFollowing(true);
        toast({ title: "Following", description: `You are now following @${user.username}` });
    }
  };

  const handleJoinGroup = async (groupId) => {
    // Check if member already (skipped for brevity, RLS handles it usually or unique constraint)
    const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: currentUser.id,
        role: 'member'
    });
    
    if (!error) {
        toast({ title: "Joined group!", description: "You are now a member." });
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="font-bold text-lg text-gray-800">@{user.username}</h2>
          <p className="text-xs text-gray-500">Profile View</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 relative z-10 ring-4 ring-white shadow-lg">
            {user.username[0].toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">@{user.username}</h1>
          <p className="text-gray-500 mb-4">{user.email}</p>
          
          <Button 
            onClick={handleFollow}
            variant={isFollowing ? "outline" : "default"}
            className="mb-6 gap-2"
          >
            {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isFollowing ? "Following" : "Follow"}
          </Button>

          <div className="flex gap-6 text-sm text-gray-600">
             <div className="flex flex-col items-center">
               <span className="font-bold text-gray-900">{counts.friends}</span>
               <span>Friends</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="font-bold text-gray-900">{counts.groups}</span>
               <span>Groups</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="font-bold text-gray-900">{counts.posts}</span>
               <span>Posts</span>
             </div>
          </div>
        </motion.div>

        {/* Groups Section */}
        {groups.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
                <Users className="w-5 h-5 text-purple-600" />
                <h3>Groups created by @{user.username}</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {groups.map(group => (
                 <GroupCard
                   key={group.id}
                   group={group}
                   currentUser={currentUser}
                   onJoin={handleJoinGroup}
                   onOpenChat={() => setSelectedGroup(group)}
                 />
               ))}
             </div>
          </div>
        )}

        {/* Posts Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3>Recent Activity</h3>
           </div>
           
           {posts.length === 0 ? (
             <div className="bg-white rounded-lg p-8 text-center border border-dashed border-gray-300">
               <p className="text-gray-500">No recent posts to show.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {posts.map(post => (
                 <PostCard
                   key={post.id}
                   post={post}
                   currentUser={currentUser}
                   onLike={() => {}} 
                 />
               ))}
             </div>
           )}
        </div>
      </div>

      {selectedGroup && (
        <GroupChatDialog
          group={selectedGroup}
          currentUser={currentUser}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};

export default PublicProfilePage;
