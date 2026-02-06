import { Event } from "./eventTypes";

export type TMouse = {
  x: number;
  y: number;
};

export type THoverData = {
  events: Event[];
  mouse: TMouse;
};
