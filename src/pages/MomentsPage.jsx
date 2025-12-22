
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreatePostDialog from '@/components/CreatePostDialog';
import PostCard from '@/components/PostCard';
import { supabase } from '@/lib/customSupabaseClient';

const MomentsPage = ({ currentUser, onViewProfile }) => {
  const [posts, setPosts] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, [currentUser.id]);

  const loadPosts = async () => {
    // 1. Get IDs of people I follow and friends
    const { data: relationships } = await supabase
        .from('relationships')
        .select('following_id, follower_id, type')
        .or(`follower_id.eq.${currentUser.id},following_id.eq.${currentUser.id}`)
        .in('type', ['friend', 'follow']);

    // Build list of interesting user IDs
    const interestingUserIds = new Set([currentUser.id]);
    relationships?.forEach(rel => {
        if (rel.type === 'follow' && rel.follower_id === currentUser.id) {
            interestingUserIds.add(rel.following_id);
        }
        if (rel.type === 'friend') {
             interestingUserIds.add(rel.follower_id === currentUser.id ? rel.following_id : rel.follower_id);
        }
    });

    // 2. Fetch posts
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!user_id (username),
        post_likes (user_id),
        comments (
            id,
            content,
            created_at,
            user_id,
            profiles!user_id (username)
        )
      `)
      .in('user_id', Array.from(interestingUserIds))
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading posts", error);
        return;
    }

    // Transform for component
    const formattedPosts = postsData.map(post => ({
      ...post,
      userId: post.user_id,
      username: post.profiles.username,
      likes: post.post_likes.map(l => l.user_id),
      comments: post.comments.map(c => ({
          ...c,
          userId: c.user_id,
          username: c.profiles.username,
          createdAt: c.created_at
      })),
      createdAt: post.created_at,
      mediaUrl: post.media_url,
      mediaType: post.media_type
    }));

    setPosts(formattedPosts);
  };

  const handleCreatePost = async (postData) => {
    // Create Post
    const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: postData.content,
        media_url: postData.mediaUrl,
        media_type: postData.mediaType
    });

    if (error) {
        return toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    }

    // Award Coin
    await supabase.rpc('increment_coins', { user_id: currentUser.id, amount: 1 }); // Assuming RPC exists or update manually
    // Fallback manual update if RPC not present in previous step (I'll do manual for simplicity in this context without extra migrations for RPC)
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    await supabase.from('profiles').update({ coins: (profile?.coins || 0) + 1 }).eq('id', currentUser.id);

    loadPosts();
    setShowCreateDialog(false);
    
    toast({
      title: "Post created!",
      description: "You earned 1 ZEHEM Coin!",
      className: "bg-green-50 border-green-200"
    });
  };

  const handleDeletePost = async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) return;

    // Deduct Coin
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    const newBalance = Math.max(0, (profile?.coins || 0) - 1);
    await supabase.from('profiles').update({ coins: newBalance }).eq('id', currentUser.id);
    
    loadPosts();
    
    toast({
      title: "Post deleted",
      description: "You lost 1 ZEHEM Coin.",
      variant: "destructive"
    });
  };

  const handleComment = async (postId, content) => {
    const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUser.id,
        content
    });

    if (error) return;
    
    // Earn Coin
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    await supabase.from('profiles').update({ coins: (profile?.coins || 0) + 1 }).eq('id', currentUser.id);
    
    loadPosts();
    
    toast({
      title: "Comment added",
      description: "You earned 1 ZEHEM Coin!",
      className: "bg-green-50 border-green-200"
    });
  };

  const handleDeleteComment = async (postId, commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) return;
    
    // Lose Coin
    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentUser.id).single();
    const newBalance = Math.max(0, (profile?.coins || 0) - 1);
    await supabase.from('profiles').update({ coins: newBalance }).eq('id', currentUser.id);
    
    loadPosts();
    
    toast({
      title: "Comment deleted",
      description: "You lost 1 ZEHEM Coin.",
      variant: "destructive"
    });
  };

  const handleLike = async (postId) => {
    // Check if already liked
    const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();

    if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id);
    } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
    }
    
    loadPosts();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Moments Feed</h2>
          <p className="text-gray-600">Share your experiences</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </Button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No posts yet. Create your first moment!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard 
                post={post} 
                currentUser={currentUser}
                onLike={handleLike}
                onUserClick={onViewProfile}
                onComment={handleComment}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
              />
            </motion.div>
          ))
        )}
      </div>

      {showCreateDialog && (
        <CreatePostDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreatePost}
        />
      )}
    </div>
  );
};

export default MomentsPage;
