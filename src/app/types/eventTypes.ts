export type TEvent = {
  id: string;
  title: string;
  status: "Not Started" | "On Going" | "Done";
};

export type TEventDB = TEvent & {
  date: string;
};

export type TEventMap = Map<string, TEvent[]>;
