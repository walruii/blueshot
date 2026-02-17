import { Suspense } from "react";
import AddEvent from "./AddEvent";

export default function PageWrapper() {
  return (
    <Suspense>
      <AddEvent />
    </Suspense>
  );
}
