
import React from 'react';
import { Users, Crown, MessageSquare, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GroupCard = ({ group, currentUser, onOpenChat, onJoin }) => {
  const isAdmin = group.admins?.includes(currentUser.id);
  const isMember = group.members?.includes(currentUser.id);
  const hasUnread = group.mentions?.some(m => m.userId === currentUser.id);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Notification Badge */}
      {hasUnread && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-bl-lg flex items-center gap-1 font-bold z-10 animate-pulse">
            <Flame className="w-3 h-3 fill-current" />
            NEW
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg pr-6">{group.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
        </div>
        {isAdmin && (
          <div className="bg-yellow-100 p-2 rounded-full flex-shrink-0">
            <Crown className="w-4 h-4 text-yellow-600" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {group.members?.length || 0} members
        </div>
        <div className="flex items-center gap-1">
          <Crown className="w-4 h-4" />
          {group.admins?.length || 0} admins
        </div>
      </div>

      <div className="flex gap-2">
        {isMember ? (
          <Button
            onClick={onOpenChat}
            className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <MessageSquare className="w-4 h-4" />
            {hasUnread ? 'View Mentions' : 'Open Chat'}
          </Button>
        ) : (
          <Button
            onClick={() => onJoin(group.id)}
            variant="outline"
            className="flex-1"
          >
            Join Group
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
