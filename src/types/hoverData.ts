import { TEvent } from "./eventTypes";

export type TMouse = {
  x: number;
  y: number;
};

export type THoverData = {
  events: TEvent[];
  mouse: TMouse;
};
