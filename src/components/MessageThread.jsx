
import React, { useState, useEffect } from 'react';
import { Send, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MessageThread = ({ conversation, currentUser, onSendMessage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    const threadMessages = allMessages.filter(
      msg => 
        (msg.senderId === currentUser.id && msg.receiverId === conversation.userId) ||
        (msg.senderId === conversation.userId && msg.receiverId === currentUser.id)
    );
    setMessages(threadMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
  }, [conversation.userId, currentUser.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(conversation.userId, newMessage);
    setNewMessage('');

    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    const threadMessages = allMessages.filter(
      msg => 
        (msg.senderId === currentUser.id && msg.receiverId === conversation.userId) ||
        (msg.senderId === conversation.userId && msg.receiverId === currentUser.id)
    );
    setMessages(threadMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
  };

  const insertMention = () => {
    setNewMessage(prev => prev + `@${conversation.username} `);
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">@{conversation.username}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.senderId === currentUser.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertMention}
            className="gap-1"
          >
            <AtSign className="w-4 h-4" />
          </Button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
          />
          <Button
            type="submit"
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </form>
    </>
  );
};

export default MessageThread;
