export interface PurchaseResponse {
  purchaseTransaction: {
    id: number;
    buyerUserId: number;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    finalAmount: number;
    status: string;
    purchaseDate: string;
  };
  ticket: {
    id: number;
    qrCode: string;
    status: string;
    passengerCount: number;
    routeInfo: {
      routeSheetDetailId: number;
      date: string;
      originCity: string;
      destinationCity: string;
      departureTime: string;
    };
  };
  passengers: {
    id: number;
    passengerName: string;
    seatNumber: string;
    seatType: string;
    passengerType: string;
    finalPrice: number;
  }[];
  payment?: {
    method: string;
    status: string;
    stripePaymentIntentId?: string;
  };
}

export interface PricingCalculation {
  passengers: {
    seatId: number;
    seatType: string;
    basePrice: number;
    discountAmount: number;
    taxAmount: number;
    finalPrice: number;
  }[];
  totals: {
    totalBasePrice: number;
    totalDiscountAmount: number;
    totalTaxAmount: number;
    finalTotalPrice: number;
  };
}