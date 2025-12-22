
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, UserCheck, Ban, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FriendRequestCard from '@/components/FriendRequestCard';

const ProfilePage = ({ currentUser, onViewProfile }) => {
  const [users, setUsers] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
  const { toast } = useToast();

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(allUsers.filter(u => u.id !== currentUser.id));
    setCurrentUserData(allUsers.find(u => u.id === currentUser.id));
  }, [currentUser.id]);

  const handleSendFriendRequest = (userId) => {
    const requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const newRequest = {
      id: Date.now().toString(),
      fromId: currentUser.id,
      fromUsername: currentUser.username,
      toId: userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    requests.push(newRequest);
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    
    toast({
      title: "Friend request sent!",
      description: "You'll be notified when they respond.",
    });
  };

  const handleFollow = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(user => {
      if (user.id === currentUser.id) {
        const following = user.following || [];
        return {
          ...user,
          following: following.includes(userId)
            ? following.filter(id => id !== userId)
            : [...following, userId]
        };
      }
      return user;
    });
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setCurrentUserData(updatedUsers.find(u => u.id === currentUser.id));
    
    toast({
      title: currentUserData?.following?.includes(userId) ? "Unfollowed" : "Following!",
      description: currentUserData?.following?.includes(userId) 
        ? "You've unfollowed this user"
        : "You're now following this user",
    });
  };

  const handleBlacklist = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(user => {
      if (user.id === currentUser.id) {
        const blacklist = user.blacklist || [];
        return {
          ...user,
          blacklist: blacklist.includes(userId)
            ? blacklist.filter(id => id !== userId)
            : [...blacklist, userId]
        };
      }
      return user;
    });
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setCurrentUserData(updatedUsers.find(u => u.id === currentUser.id));
    
    toast({
      title: currentUserData?.blacklist?.includes(userId) ? "Removed from blacklist" : "Blocked",
      description: currentUserData?.blacklist?.includes(userId)
        ? "User has been removed from blacklist"
        : "User has been added to blacklist",
      variant: currentUserData?.blacklist?.includes(userId) ? "default" : "destructive",
    });
  };

  const friendRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]')
    .filter(req => req.toId === currentUser.id && req.status === 'pending');

  const friends = users.filter(u => currentUserData?.friends?.includes(u.id));
  const following = users.filter(u => currentUserData?.following?.includes(u.id));
  const blacklisted = users.filter(u => currentUserData?.blacklist?.includes(u.id));
  const discover = users.filter(u => 
    !currentUserData?.friends?.includes(u.id) && 
    !currentUserData?.blacklist?.includes(u.id)
  );

  const renderUserList = (userList, showActions = true) => {
    if (userList.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>No users found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userList.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => onViewProfile && onViewProfile(user.id)}
                  className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:opacity-90"
                >
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p 
                    onClick={() => onViewProfile && onViewProfile(user.id)}
                    className="font-semibold text-gray-800 cursor-pointer hover:underline hover:text-purple-600"
                  >
                    @{user.username}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              {showActions && (
                <div className="flex gap-2">
                  {!currentUserData?.friends?.includes(user.id) && !currentUserData?.blacklist?.includes(user.id) && (
                    <Button
                      onClick={() => handleSendFriendRequest(user.id)}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleFollow(user.id)}
                    size="sm"
                    variant={currentUserData?.following?.includes(user.id) ? "default" : "outline"}
                    className="gap-1"
                  >
                    {currentUserData?.following?.includes(user.id) ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleBlacklist(user.id)}
                    size="sm"
                    variant={currentUserData?.blacklist?.includes(user.id) ? "destructive" : "outline"}
                    className="gap-1"
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile & Connections</h2>
        <p className="text-gray-600">Manage your friends, followers, and connections</p>
      </div>

      {friendRequests.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Friend Requests ({friendRequests.length})</h3>
          <div className="space-y-2">
            {friendRequests.map(request => (
              <FriendRequestCard
                key={request.id}
                request={request}
                currentUser={currentUser}
                onUpdate={() => {
                  const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                  setCurrentUserData(allUsers.find(u => u.id === currentUser.id));
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['discover', 'friends', 'following', 'blacklist'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'discover' && renderUserList(discover)}
        {activeTab === 'friends' && renderUserList(friends, false)}
        {activeTab === 'following' && renderUserList(following)}
        {activeTab === 'blacklist' && renderUserList(blacklisted)}
      </div>
    </div>
  );
};

export default ProfilePage;
