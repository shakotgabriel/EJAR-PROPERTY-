import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Send, Loader } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

const Messages: React.FC = () => {
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, selectedConversation, isLoading, error, fetchConversations, fetchConversation, createConversation, sendMessage } = useMessages();
  const { user } = useAuth();

  
  useEffect(() => {
    if (conversations.length === 0) return;

    const convId = searchParams.get("conv");
    const ownerId = searchParams.get("owner");

    if (convId) {
     
      fetchConversation(parseInt(convId));
      setSearchParams({});
    } else if (ownerId) {
     
      const ownerIdNum = parseInt(ownerId);
      const existingConv = conversations.find((c) => c.other_participant?.id === ownerIdNum);
      if (existingConv) {
        fetchConversation(existingConv.id);
      } else {
       
        createConversation([ownerIdNum]).then((conv) => {
          fetchConversation(conv.id);
        });
      }
      setSearchParams({});
    }
  }, [searchParams, conversations, fetchConversation, createConversation, setSearchParams]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = conversations.filter((c) => {
    const otherParticipant = c.other_participant?.first_name || c.other_participant?.email || "";
    return otherParticipant.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectConversation = (id: number) => {
    fetchConversation(id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    try {
      await sendMessage(selectedConversation.id, messageInput);
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
       
        <div className="w-full md:w-80 flex flex-col">
       
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

      
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/80 backdrop-blur border-gray-200 focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <Card className="flex-1 overflow-y-auto rounded-2xl shadow-xl border border-white/50 bg-white/90 backdrop-blur p-2">
          {isLoading && conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center flex-col gap-2 text-gray-500">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
                💬
              </div>
              <p className="font-medium">No conversations found</p>
              <p className="text-sm">Start a new message to begin chatting</p>
            </div>
          ) : (
            filtered.map((c) => {
              const otherParticipant = c.other_participant;
              const isSelected = selectedConversation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-100 border-2 border-indigo-500'
                      : 'hover:bg-indigo-50 border-2 border-transparent'
                  }`}
                >
                  <Avatar className="h-11 w-11 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                      {otherParticipant?.first_name?.charAt(0) || otherParticipant?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">
                      {otherParticipant?.first_name || otherParticipant?.email}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {c.last_message?.content || 'No messages yet'}
                    </p>
                  </div>

                  {c.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-1">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </Card>
        </div>

   
        <div className="w-full flex-1 flex flex-col">
          {selectedConversation ? (
            <>
             
              <div className="mb-4 pb-4 border-b border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedConversation.other_participant?.first_name ||
                      selectedConversation.other_participant?.email}
                  </h2>
                  {selectedConversation.property && (
                    <p className="text-sm text-gray-500">
                      About: {selectedConversation.property.title}
                    </p>
                  )}
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading
                  </div>
                )}
              </div>

         
              <Card className="flex-1 overflow-y-auto rounded-2xl shadow-xl border border-white/50 bg-white/90 backdrop-blur p-4 mb-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-500">
                    <div>
                      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl mx-auto mb-3">
                        💬
                      </div>
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm">Send the first message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender.id === user?.id
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-gray-200 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender.id === user?.id ? 'text-indigo-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-white/80 border-gray-200 focus:ring-2 focus:ring-indigo-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Card className="flex-1 rounded-2xl shadow-xl border border-white/50 bg-white/90 backdrop-blur flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl mx-auto mb-4">
                  💬
                </div>
                <p className="text-lg font-medium text-gray-800">No conversation selected</p>
                <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
