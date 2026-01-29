export type TEvent = {
  id: string;
  title: string;
  status: "Not Started" | "On Going" | "Done";
  startTime: Date | null;
  endTime: Date | null;
};

export type TEventDB = {
  id: string;
  date: string;
  title: string;
  status: "Not Started" | "On Going" | "Done";
  start_time: string | null;
  end_time: string | null;
};

export type TEventMap = Map<string, TEvent[]>;
