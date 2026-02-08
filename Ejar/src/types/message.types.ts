export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  avatar?: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: User;
  sender_name: string;
  content: string;
  attachment?: string | null;
  attachment_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  participants: User[];
  other_participant: User | null;
  property?: number | null;
  subject: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem {
  id: number;
  participants: User[];
  other_participant: User | null;
  property?: number | null;
  subject: string;
  last_message?: {
    id: number;
    sender: string;
    content: string;
    created_at: string;
  } | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  participant_ids: number[];
  property?: number;
  subject?: string;
}

export interface SendMessagePayload {
  content: string;
  attachment?: File;
}
