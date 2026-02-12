export type TAlert = {
  title: string;
  type: "warning" | "info" | "error" | "success";
  description?: string;
};
