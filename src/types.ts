export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface StudentProfile {
  uid: string;
  memory: string;
  style: string;
  tone: string;
  updatedAt: string;
}

export interface AssistantChatData {
  uid: string;
  messages: Message[];
}

export interface UserProgress {
  uid: string;
  completedIds: number[];
  updatedAt: string;
}
