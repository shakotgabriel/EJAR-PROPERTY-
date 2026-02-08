import API from "./api";

export interface Message {
  id: number;
  conversation: number;
  sender: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  sender_name: string;
  content: string;
  attachment?: string;
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>;
  other_participant?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  property?: {
    id: number;
    title: string;
  };
  subject: string;
  last_message?: {
    id: number;
    sender: string;
    content: string;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
}

class MessagesService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await API.get<Conversation[]>("messages/conversations/");
      return res.data;
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(id: number): Promise<Conversation & { messages: Message[] }> {
    try {
      const res = await API.get<Conversation & { messages: Message[] }>(
        `messages/conversations/${id}/`
      );
      return res.data;
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(participantIds: number[], subject?: string): Promise<Conversation> {
    try {
      const res = await API.post<Conversation>("messages/conversations/", {
        participant_ids: participantIds,
        subject: subject || "",
      });
      return res.data;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: number,
    content: string,
    attachment?: File
  ): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const res = await API.post<Message>(
        `messages/conversations/${conversationId}/send_message/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAsRead(conversationId: number): Promise<void> {
    try {
      await API.get(`messages/conversations/${conversationId}/`);
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: number): Promise<void> {
    try {
      await API.delete(`messages/conversations/${id}/`);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      throw error;
    }
  }
}

export default new MessagesService();
