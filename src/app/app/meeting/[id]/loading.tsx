import { Loader2 } from "lucide-react";

export default function MeetingLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Joining meeting...
        </h2>
        <p className="text-gray-400">Setting up your connection</p>
      </div>
    </div>
  );
}
