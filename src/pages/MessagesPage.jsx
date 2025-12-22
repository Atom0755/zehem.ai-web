
import React, { useState, useEffect } from 'react';
import { Search, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MessageThread from '@/components/MessageThread';

const MessagesPage = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const userMessages = messages.filter(
      msg => msg.senderId === currentUser.id || msg.receiverId === currentUser.id
    );

    const conversationMap = new Map();
    userMessages.forEach(msg => {
      const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherId)) {
        const otherUser = users.find(u => u.id === otherId);
        if (otherUser) {
          conversationMap.set(otherId, {
            userId: otherId,
            username: otherUser.username,
            lastMessage: msg.content,
            timestamp: msg.timestamp,
          });
        }
      }
    });

    setConversations(Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    ));
  }, [currentUser.id]);

  const handleSendMessage = (receiverId, content) => {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const newMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    toast({
      title: "Message sent!",
      description: "Your message has been delivered.",
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[600px] flex">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.userId === conv.userId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {conv.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{conv.username}</p>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
