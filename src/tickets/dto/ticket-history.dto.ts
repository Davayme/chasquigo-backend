export interface TicketHistoryItem {
  id: number;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  ticket: {
    id: number;
    qrCode: string;
    qrBase64?: string;
    status: string;
    passengerCount: number;
    routeInfo: {
      originCity: string;
      destinationCity: string;
      departureTime: string;
      date: string;
    };
  };
  passengers: Array<{
    id: number;
    passengerName: string;
    seatNumber: string;
    seatType: string;
    passengerType: string;
    finalPrice: number;
  }>;
}

export interface TicketHistoryResponse {
  totalTickets: number;
  tickets: TicketHistoryItem[];
}

export interface QRValidationResult {
  isValid: boolean;
  ticket?: any;
  message: string;
}
