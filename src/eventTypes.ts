export type TEventDB = {
  id: string;
  date: string;
  title: string;
  status: string;
};

export type TEvent = {
  id: string;
  title: string;
  status: string;
};

export type TEventMap = Map<string, TEvent[]>;
