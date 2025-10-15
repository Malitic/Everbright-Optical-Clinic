import { getApiUrl, getAuthHeaders } from '@/config/api';

export interface ReceiptItemInput {
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

export interface ReceiptTotalsInput {
  vatable_sales: number;
  vat_amount: number; // kept for parity though backend uses add_vat/less_vat
  zero_rated_sales: number;
  vat_exempt_sales: number;
  net_of_vat: number;
  less_vat: number;
  add_vat: number;
  discount: number;
  withholding_tax: number;
  total_due: number;
}

export interface CreateReceiptInput {
  appointment_id: number;
  sales_type: 'cash' | 'charge';
  date: string; // YYYY-MM-DD
  customer_name: string;
  tin?: string;
  address?: string;
  items: ReceiptItemInput[];
  totals: ReceiptTotalsInput;
}

export async function createReceipt(payload: CreateReceiptInput) {
  const resp = await fetch(getApiUrl('/receipts'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || 'Failed to create receipt');
  }
  return resp.json();
}
