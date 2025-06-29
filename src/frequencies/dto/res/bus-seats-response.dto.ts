export interface BusSeatsResponse {
  busInfo: {
    id: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photo: string | null;
    busType: {
      id: number;
      name: string;
      floorCount: number;
      capacity: number;
    };
  };
  routeInfo: {
    routeSheetDetailId: number;
    date: string;
    frequency: {
      id: number;
      departureTime: string;
      originCity: string;
      destinationCity: string;
    };
  };
  seatsLayout: {
    floor: number;
    seats: {
      id: number;
      number: string;
      type: 'NORMAL' | 'VIP';
      location: 'WINDOW_LEFT' | 'WINDOW_RIGHT' | 'AISLE_LEFT' | 'AISLE_RIGHT' | 'MIDDLE';
      isOccupied: boolean;
      occupiedBy?: {
        ticketId: number;
        passengerType: string;
        passengerName: string;
        
      };
    }[];
  }[];
  availability: {
    normal: {
      total: number;
      available: number;
      occupied: number;
    };
    vip: {
      total: number;
      available: number;
      occupied: number;
    };
  };
  pricing: {
    normalSeat: {
      basePrice: number;
      discounts: {
        CHILD: number;
        SENIOR: number;
        HANDICAPPED: number;
      };
    };
    vipSeat: {
      basePrice: number;
      discounts: {
        CHILD: number;
        SENIOR: number;
        HANDICAPPED: number;
      };
    };
  };
}