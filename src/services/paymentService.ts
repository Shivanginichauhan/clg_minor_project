export interface PaymentRequest {
  orderId: string;
  title: string;
  amount: number;
  currency?: string;
  category: 'tuition' | 'exam_fee' | 'revaluation' | 'library' | 'other';
  studentId: string;
  studentName: string;
  rollNumber?: string;
}

export interface PaymentReceipt {
  paymentId: string;
  orderId: string;
  receiptNumber: string;
  amount: number;
  paidAt: string;
  paymentMode: 'UPI' | 'NetBanking' | 'DebitCard' | 'CreditCard';
  status: 'SUCCESS' | 'FAILED';
  bankReference: string;
  gatewayFee: number;
}

class PaymentService {
  private storageKey = 'itm_payment_records_v1';

  private getHistory(): PaymentReceipt[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  private saveReceipt(receipt: PaymentReceipt): void {
    const history = this.getHistory();
    history.unshift(receipt);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  async processPayment(
    request: PaymentRequest,
    mode: 'UPI' | 'NetBanking' | 'DebitCard' | 'CreditCard',
    details?: { upiId?: string; bankName?: string; cardNumber?: string }
  ): Promise<PaymentReceipt> {
    // Realistic gateway processing latency simulation (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const receipt: PaymentReceipt = {
      paymentId: `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: request.orderId,
      receiptNumber: `ITM/FEE/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      amount: request.amount,
      paidAt: new Date().toISOString(),
      paymentMode: mode,
      status: 'SUCCESS',
      bankReference: `BNK-REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      gatewayFee: 0,
    };

    this.saveReceipt(receipt);
    return receipt;
  }
}

export const paymentService = new PaymentService();
