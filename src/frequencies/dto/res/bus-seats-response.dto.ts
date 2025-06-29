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
      location: 'pasillo' | 'ventana';
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
}