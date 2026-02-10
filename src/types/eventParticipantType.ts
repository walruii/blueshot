// Domain type - normalized, what app uses everywhere
export type EventParticipant = {
  id: string;
  userId: string;
  eventId: string;
  userEmail: string;
  mailSent: boolean;
  acknowledgement: boolean;
};

// DB response when fetching event_participant WITH user
export type EventParticipantWithUserDB = {
  id: string;
  user: {
    id: string;
    email: string;
  };
  event_id: string;
  mail_sent: boolean;
  acknowledgement: boolean;
};

// DB response when fetching event_participant WITH user AND event
export type EventParticipantFullDB = {
  id: string;
  user: {
    id: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
  event_id: string;
  mail_sent: boolean;
  acknowledgement: boolean;
};
