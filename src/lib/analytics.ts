import { track } from "@vercel/analytics";

export const analytics = {
  userSignup: () =>
    track("user_signup"),

  bookingStarted: (venueSlug: string) =>
    track("booking_started", { venueSlug }),

  bookingServiceSelected: (venueSlug: string, serviceName: string, price: number) =>
    track("booking_service_selected", { venueSlug, serviceName, price }),

  bookingDateSelected: (venueSlug: string) =>
    track("booking_date_selected", { venueSlug }),

  bookingTimeSelected: (venueSlug: string, time: string) =>
    track("booking_time_selected", { venueSlug, time }),

  bookingCompleted: (venueSlug: string, price: number, isGuest: boolean) =>
    track("booking_completed", { venueSlug, price, isGuest: String(isGuest) }),

  venueCreated: (category: string) =>
    track("venue_created", { category }),

  categoryFiltered: (category: string) =>
    track("category_filtered", { category }),

  searchUsed: (query: string) =>
    track("search_used", { query }),
};
