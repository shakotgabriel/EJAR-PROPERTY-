import { useState, useCallback } from "react";
import messagesService, { type Conversation, type Message } from "@/api/messages.service";

interface UseMessagesReturn {
  conversations: Conversation[];
  selectedConversation: (Conversation & { messages: Message[] }) | null;
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string, attachment?: File) => Promise<void>;
  createConversation: (participantIds: number[], subject?: string) => Promise<Conversation>;
  deleteConversation: (id: number) => Promise<void>;
  clearSelectedConversation: () => void;
}

export const useMessages = (): UseMessagesReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<(Conversation & { messages: Message[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await messagesService.getConversations();
      setConversations(data);
    } catch (err) {
      setError("Failed to load conversations");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await messagesService.getConversation(id);
      const messagesSorted = [...(data.messages ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setSelectedConversation({ ...data, messages: messagesSorted });
    } catch (err) {
      setError("Failed to load conversation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (conversationId: number, content: string, attachment?: File) => {
      setError(null);
      try {
        const message = await messagesService.sendMessage(conversationId, content, attachment);
        
        // Update selected conversation with new message
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation({
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          });
        }

        // Refresh conversations list
        await fetchConversations();
      } catch (err) {
        setError("Failed to send message");
        console.error(err);
      }
    },
    [selectedConversation, fetchConversations]
  );

  const createConversation = useCallback(
    async (participantIds: number[], subject?: string): Promise<Conversation> => {
      setError(null);
      try {
        const conversation = await messagesService.createConversation(participantIds, subject);
        setConversations((prev) => [conversation, ...prev]);
        setSelectedConversation({
          ...(conversation as Conversation),
          messages: [],
        });
        return conversation;
      } catch (err) {
        setError("Failed to create conversation");
        console.error(err);
        throw err;
      }
    },
    []
  );

  const deleteConversation = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await messagesService.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedConversation?.id === id) {
          setSelectedConversation(null);
        }
      } catch (err) {
        setError("Failed to delete conversation");
        console.error(err);
      }
    },
    [selectedConversation]
  );

  const clearSelectedConversation = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  return {
    conversations,
    selectedConversation,
    isLoading,
    error,
    fetchConversations,
    fetchConversation,
    sendMessage,
    createConversation,
    deleteConversation,
    clearSelectedConversation,
  };
};
