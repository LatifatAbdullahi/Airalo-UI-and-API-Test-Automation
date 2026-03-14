import { test, expect } from '@playwright/test';
import { testOrder } from '../../api/config';
import {
  getToken,
  submitOrder,
  getSim,
  getSimIccidsFromOrder,
  type TokenResult,
  type OrderResult,
  type SimResult,
  type OrderSimItem,
} from '../../api/partner-api.client';

test.describe('@api Partner API', () => {
  test.describe('@api-token Token', () => {
    let tokenResult: TokenResult;

    test.beforeAll(async ({ request }) => {
      tokenResult = await getToken(request);
    });

    test('obtains OAuth2 token with client credentials', () => {
      const { accessToken, statusCode, response } = tokenResult;
      expect(statusCode).toBe(200);
      expect(accessToken).toBe(response.data?.access_token);
      expect(typeof response.data?.expires_in).toBe('number');
    });
  });

  test.describe('@api-order Order and eSIM details', () => {
    let accessToken: string;

    test.beforeAll(async ({ request }) => {
      const result = await getToken(request);
      accessToken = result.accessToken;
    });

    test('submits order for 6 eSIMs and retrieves each eSIM', async ({ request }) => {
      const toEmail = process.env.ORDER_TO_EMAIL || '';

      const orderResult: OrderResult = await submitOrder(request, accessToken, {
        quantity: testOrder.quantity,
        packageId: testOrder.packageId,
        description: testOrder.description,
        toEmail,
      });

      expect(orderResult.statusCode).toBe(200);
      const order = orderResult.order;
      expect(order.data).toBeDefined();

      const orderData = order.data!;
      expect(orderData.package_id).toBe(testOrder.packageId);
      expect(String(orderData.quantity)).toBe(String(testOrder.quantity));
      expect(orderData.sims).toHaveLength(testOrder.quantity);

      const simsFromOrder = orderData.sims as OrderSimItem[];
      for (const sim of simsFromOrder) {
        expect(sim.iccid).toBeDefined();
        expect(typeof sim.iccid).toBe('string');
      }

      console.log('Order submitted successfully:', orderData.id ?? orderData);

      const iccids = getSimIccidsFromOrder(order);
      for (const iccid of iccids) {
        const result: SimResult = await getSim(request, accessToken, iccid);
        expect(result.statusCode).toBe(200);

        const data = (result.response.data ?? result.sim) as Record<string, unknown>;
        const simIccid = data.iccid ?? (data.data as Record<string, unknown> | undefined)?.iccid;
        expect(String(simIccid ?? '')).toBe(iccid);

        if (data.id != null) expect(typeof data.id).toBe('number');
        if (data.created_at != null) expect(typeof data.created_at).toBe('string');
        if (data.matching_id != null) expect(typeof data.matching_id).toBe('string');
        if (data.qrcode != null) expect(typeof data.qrcode).toBe('string');
        if (data.qrcode_url != null) expect(typeof data.qrcode_url).toBe('string');
        console.log(`Retrieved SIM details for ICCID ${iccid}:`, data);
      }
    });
  });
});
