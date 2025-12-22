
import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const FriendRequestCard = ({ request, currentUser, onUpdate }) => {
  const { toast } = useToast();

  const handleAccept = () => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          friends: [...(user.friends || []), request.fromId]
        };
      }
      if (user.id === request.fromId) {
        return {
          ...user,
          friends: [...(user.friends || []), currentUser.id]
        };
      }
      return user;
    });

    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const updatedRequests = requests.map(req => 
      req.id === request.id ? { ...req, status: 'accepted' } : req
    );
    localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

    toast({
      title: "Friend request accepted!",
      description: `You and @${request.fromUsername} are now friends.`,
    });

    onUpdate();
  };

  const handleDecline = () => {
    const requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const updatedRequests = requests.map(req => 
      req.id === request.id ? { ...req, status: 'declined' } : req
    );
    localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

    toast({
      title: "Friend request declined",
      description: "Request has been removed.",
    });

    onUpdate();
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {request.fromUsername[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-800">@{request.fromUsername}</p>
          <p className="text-xs text-gray-500">wants to be friends</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleAccept}
          size="sm"
          className="gap-1 bg-green-500 hover:bg-green-600"
        >
          <Check className="w-4 h-4" />
          Accept
        </Button>
        <Button
          onClick={handleDecline}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <X className="w-4 h-4" />
          Decline
        </Button>
      </div>
    </div>
  );
};

export default FriendRequestCard;
