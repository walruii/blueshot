import AcknowledgementButton from "@/components/AcknowledgementButton";
import { Card, CardContent } from "@/components/ui/card";

export default function AcknowledgementBanner({ id }: { id: string | null }) {
  return (
    <Card className="mb-6">
      <CardContent className="flex justify-between items-center py-6">
        <p>You Haven&apos;t Acknowledged the Event!</p>
        <AcknowledgementButton eventParticipateId={id} />
      </CardContent>
    </Card>
  );
}
