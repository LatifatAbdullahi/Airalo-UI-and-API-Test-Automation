import type { APIRequestContext } from '@playwright/test';
import { apiConfig, testOrder } from './config';

/** Common meta in API responses. */
export interface ResponseMeta {
  message?: string;
}

/** Response from POST /token (OAuth2 client credentials). API returns token inside data. */
export interface TokenResponse {
  data?: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  meta?: ResponseMeta;
}

/** Sim item in order response (eSIM properties from the order). */
export interface OrderSimItem {
  iccid: string;
  id?: number;
  created_at?: string;
  lpa?: string;
  qrcode?: string;
  qrcode_url?: string;
  direct_apple_installation_url?: string;
  matching_id?: string;
  [key: string]: unknown;
}

export interface OrderResponse {
  data?: {
    id?: number;
    package_id?: string;
    quantity?: string | number;
    type?: string;
    description?: string;
    sims?: OrderSimItem[];
    [key: string]: unknown;
  };
  meta?: ResponseMeta;
  [key: string]: unknown;
}

export interface SimResponse {
  data?: {
    iccid?: string;
    id?: number;
    [key: string]: unknown;
  };
  meta?: ResponseMeta;
  [key: string]: unknown;
}

export interface TokenResult {
  accessToken: string;
  statusCode: number;
  response: TokenResponse;
}


export async function getToken(request: APIRequestContext): Promise<TokenResult> {

  const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
  const tokenUrl = `${baseUrl}/token`;

  const response = await request.post(tokenUrl, {
    form: {
      client_id: apiConfig.clientId,
      client_secret: apiConfig.clientSecret,
      grant_type: 'client_credentials',
    },
    headers: apiHeaders(),
  });

  const statusCode = response.status();
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Token request failed: ${statusCode} ${body}. URL: ${tokenUrl}`);
  }

  const body = (await response.json()) as TokenResponse;
  const accessToken = body.data?.access_token;
  if (!accessToken) throw new Error('Token response missing data.access_token');
  return { accessToken, statusCode, response: body };
}

function apiHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return headers;
}

export interface OrderResult {
  order: OrderResponse;
  statusCode: number;
  response: OrderResponse;
}

export async function submitOrder(
  request: APIRequestContext,
  accessToken: string,
  options: { quantity: number; packageId: string; description: string; toEmail: string } = {
    quantity: testOrder.quantity,
    packageId: testOrder.packageId,
    description: testOrder.description,
    toEmail: apiConfig.orderToEmail,
  }
): Promise<OrderResult> {
  const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
  const ordersUrl = `${baseUrl}/orders`;

  const response = await request.post(ordersUrl, {
    multipart: {
      quantity: String(options.quantity),
      package_id: options.packageId,
      type: 'sim',
      description: options.description,
      brand_settings_name: '',
      to_email: options.toEmail,
      'sharing_option[]': 'link',
      'copy_address[]': options.toEmail,
    },
    headers: apiHeaders(accessToken),
  });

  const statusCode = response.status();
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Submit order failed: ${statusCode} ${body}. URL: ${ordersUrl}`);
  }

  const order = (await response.json()) as OrderResponse;
  return { order, statusCode, response: order };
}

export interface SimResult {
  sim: Record<string, unknown>;
  statusCode: number;
  response: SimResponse;
}

export async function getSim(
  request: APIRequestContext,
  accessToken: string,
  iccid: string
): Promise<SimResult> {
  const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
  const simUrl = `${baseUrl}/sims/${iccid}`;

  const response = await request.get(simUrl, {
    headers: apiHeaders(accessToken),
  });

  const statusCode = response.status();
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Get sim failed: ${statusCode} ${body}. URL: ${simUrl}`);
  }

  const responseBody = (await response.json()) as SimResponse;
  const sim = (responseBody.data ?? responseBody) as Record<string, unknown>;
  return { sim, statusCode, response: responseBody };
}

export function getSimIccidsFromOrder(order: OrderResponse): string[] {
  const data = order.data as Record<string, unknown> | undefined;
  const sims =
    data?.sims ??
    (data?.order as { sims?: Array<{ iccid?: string }> })?.sims ??
    (order as { sims?: Array<{ iccid?: string }> }).sims;
  if (!Array.isArray(sims)) {
    throw new Error(
      `Order response has no sims array. Expected data.sims[].iccid. Got: ${JSON.stringify(order).slice(0, 500)}`
    );
  }
  const iccids = sims
    .map((s) => (typeof s === 'object' && s && 'iccid' in s ? String((s as { iccid: string }).iccid) : ''))
    .filter(Boolean);
  if (iccids.length === 0) {
    throw new Error(
      `Order response sims array has no iccid. Got: ${JSON.stringify(sims).slice(0, 500)}`
    );
  }
  return iccids;
}
