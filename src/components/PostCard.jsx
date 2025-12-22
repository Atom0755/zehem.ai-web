
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PostCard = ({ post, currentUser, onLike, onUserClick, onComment, onDeletePost, onDeleteComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  
  const isLiked = post.likes?.includes(currentUser.id);
  const isOwner = post.userId === currentUser.id;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(post.id, newComment);
    setNewComment('');
  };

  const handleShare = () => {
    toast({
      title: "Shared!",
      description: "Link copied to clipboard (simulated)",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative group">
      {isOwner && onDeletePost && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDeletePost(post.id)}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div 
          onClick={() => onUserClick && onUserClick(post.userId)}
          className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          {post.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p 
            onClick={() => onUserClick && onUserClick(post.userId)}
            className="font-semibold text-gray-800 cursor-pointer hover:underline hover:text-purple-600 transition-colors"
          >
            @{post.username}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.mediaUrl && (
        <div className="mb-4 rounded-lg overflow-hidden">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post media" className="w-full h-auto max-h-[400px] object-cover" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full h-auto max-h-[400px]" />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={`gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          {post.likes?.length || 0}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowComments(!showComments)} 
          className={`gap-2 ${showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
        >
          <MessageCircle className="w-5 h-5" />
          {post.comments?.length || 0}
        </Button>
        
        <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 text-gray-600">
          <Share2 className="w-5 h-5" />
          Share
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
          <div className="space-y-4 mb-4">
            {post.comments?.map(comment => (
              <div key={comment.id} className="flex gap-3 text-sm group/comment">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600">
                   <User className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800">@{comment.username}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{comment.content}</p>
                </div>
                {comment.userId === currentUser.id && onDeleteComment && (
                  <button 
                    onClick={() => onDeleteComment(post.id, comment.id)}
                    className="opacity-0 group-hover/comment:opacity-100 text-red-400 hover:text-red-600 transition-opacity self-center p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmitComment} className="flex gap-2">
             <input 
               type="text" 
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               placeholder="Write a comment..."
               className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
             <Button type="submit" size="sm" disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-700">
               <Send className="w-4 h-4" />
             </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
