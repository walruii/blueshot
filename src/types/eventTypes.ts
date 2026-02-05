export type TEvent = {
  id: string;
  title: string;
  description: string;
  userId: string;
  date: Date;
  from: Date;
  to: Date | null;
};

export type TEventDTO = {
  title: string;
  description: string;
  userId: string;
  date: Date;
  from: Date;
  to: Date | null;
};

export type TEventDB = {
  id: string;
  date: string;
  title: string;
  description: string;
  userId: string;
  user_id: string;
  from: string;
  to: string | null;
};

export type TEventMap = Map<string, TEvent[]>;
