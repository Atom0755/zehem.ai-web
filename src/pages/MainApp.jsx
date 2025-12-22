
import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Heart, ShoppingBag, User, LogOut } from 'lucide-react';
import MessagesPage from '@/pages/MessagesPage';
import GroupsPage from '@/pages/GroupsPage';
import MomentsPage from '@/pages/MomentsPage';
import ShopPage from '@/pages/ShopPage';
import ProfilePage from '@/pages/ProfilePage';
import PublicProfilePage from '@/pages/PublicProfilePage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const MainApp = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('moments');
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const { signOut } = useAuth();

  useEffect(() => {
    // Fetch detailed profile for coins, username etc
    const fetchProfile = async () => {
      if (!currentUser?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (data) setUserProfile(data);
    };

    fetchProfile();

    // Subscribe to profile changes (e.g. coin updates)
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${currentUser.id}`
      }, (payload) => {
        setUserProfile(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const handleViewProfile = (userId) => {
    if (userId === currentUser.id) {
      setActiveTab('profile');
      setViewingProfileId(null);
    } else {
      setViewingProfileId(userId);
    }
    window.scrollTo(0, 0);
  };

  const tabs = [
    { id: 'moments', label: 'Moments', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (viewingProfileId) {
    return (
      <PublicProfilePage 
        targetUserId={viewingProfileId}
        currentUser={userProfile || currentUser}
        onBack={() => setViewingProfileId(null)}
      />
    );
  }

  // Use profile data if available, fallback to auth data
  const displayUser = userProfile || currentUser;
  const username = displayUser.username || displayUser.user_metadata?.username || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('moments')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">Community</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span 
                  className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-purple-600"
                  onClick={() => setActiveTab('profile')}
                >
                  @{username}
                </span>
                <span className="text-xs text-yellow-600 font-medium">
                  {displayUser.coins || 0} ZEHEM
                </span>
              </div>
              <Button
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] mb-10">
          {activeTab === 'moments' && (
            <MomentsPage 
              currentUser={displayUser} 
              onViewProfile={handleViewProfile}
            />
          )}
          {activeTab === 'messages' && <MessagesPage currentUser={displayUser} />}
          {activeTab === 'groups' && (
            <GroupsPage 
              currentUser={displayUser} 
            />
          )}
          {activeTab === 'shop' && (
            <ShopPage 
              currentUser={displayUser} 
            />
          )}
          {activeTab === 'profile' && (
            <ProfilePage 
              currentUser={displayUser} 
              onViewProfile={handleViewProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainApp;
