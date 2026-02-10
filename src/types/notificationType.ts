// Domain type - notification with both user and event details
export type EventNotification = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventUserId: string;
  eventUsername: string;
  eventEmail: string;
  mailSent: boolean;
  acknowledgement: boolean;
};

// DB response - matches event_participant with user and event joins
export type EventNotificationDB = {
  id: string;
  event: {
    id: string;
    title: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  mail_sent: boolean;
  acknowledgement: boolean;
};
