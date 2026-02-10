export type Upcoming = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventUserId: string;
  eventUserName: string;
  eventUserEmail: string;
  eventFrom: Date;
  eventTo: Date | null;
};

export type UpcomingDB = {
  id: string;
  event: {
    id: string;
    title: string;
    date: string;
    from: string;
    to: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
};
