export interface RouteSearchResponse {
  routeSheetDetailId: number;
  date: string;
  frequency: {
    id: number;
    departureTime: string;
    status: string;
    antResolution: string;
    originCity: {
      id: number;
      name: string;
      province: string;
    };
    destinationCity: {
      id: number;
      name: string;
      province: string;
    };
    intermediateStops: {
      id: number;
      order: number;
      city: {
        id: number;
        name: string;
        province: string;
      };
    }[];
  };
  bus: {
    id: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photo: string | null;
    stoppageDays: number;
    busType: {
      id: number;
      name: string;
      floorCount: number;
      capacity: number;
    };
  };
  cooperative: {
    id: number;
    name: string;
    logo: string;
    phone: string;
    email: string;
  };
  seatsAvailability: {
    normal: {
      available: number;
      total: number;
      sold: number;
    };
    vip: {
      available: number;
      total: number;
      sold: number;
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
  status: string;
  duration: string;
  estimatedArrival: string;
}