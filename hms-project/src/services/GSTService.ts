export class GSTService {
  static calculateGST(amount: number, stateCode: string, isInterState: boolean, productCategory?: string) {
    const rate = this.getGSTRate(productCategory);
    
    if (isInterState) {
      return { 
        igst: amount * rate,
        rate: rate * 100
      };
    }
    return {
      cgst: amount * (rate / 2),
      sgst: amount * (rate / 2),
      rate: rate * 100
    };
  }

  private static getGSTRate(category?: string): number {
    // GST slab logic
    switch(category) {
      case 'medical-equipment': return 0.12;
      case 'pharma': return 0.05;
      default: return 0.18;
    }
  }
}
