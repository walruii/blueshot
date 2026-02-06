// Domain type - normalized, consistent application type
export type Event = {
  id: string;
  title: string;
  description: string;
  userId: string;
  date: Date;
  from: Date;
  to: Date | null;
};

// Input type - what client sends to backend
export type EventInput = {
  title: string;
  description: string;
  userId: string;
  date: Date;
  from: Date;
  to: Date | null;
};

// Database response type - exactly matches Supabase event table
export type EventDB = {
  id: string;
  date: string;
  title: string;
  description: string;
  user_id: string;
  from: string;
  to: string | null;
};

export type EventMap = Map<string, Event[]>;
