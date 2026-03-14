import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });


export const apiConfig = {
  baseUrl: process.env.PARTNERS_API_BASE_URL || 'https://partners-api.airalo.com/v2',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  orderToEmail: process.env.ORDER_TO_EMAIL || '',
} as const;

export const testOrder = {
  quantity: 6,
  packageId: 'moshi-moshi-7days-1gb',
  description: '',
} as const;
