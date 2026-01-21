export type EventDB = {
  id: string;
  date: string;
  title: string;
  status: string;
};

export type Event = {
  id: string;
  title: string;
  status: string;
};

export type EventMap = Map<string, Event[]>;
