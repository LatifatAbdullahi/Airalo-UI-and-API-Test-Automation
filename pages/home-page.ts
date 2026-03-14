const selector = require('../elements/locators.json')
import { Page } from "@playwright/test";


class HomePage {
  constructor(private page: Page) {}

  async navigate() {
     await this.page.goto('/');
  }

  async dismissCookieModalIfPresent() {
    const timeout = 500;
    const acceptButton = this.page.getByRole('button', { name: 'Accept basic cookies', exact: true });
    try {
      await acceptButton.click({ timeout });
    } catch {
    }
  }

  async dismissNotificationModalIfPresent() {
    const shortTimeout = 500;
    const dismissButton = this.page.getByRole('button', { name: /Don't allow/i });
    try {
      await dismissButton.click({ timeout: shortTimeout });
    } catch {
    }
  }

  async dismissCookieAndNotificationModals() {
    await this.dismissCookieModalIfPresent();
    await this.dismissNotificationModalIfPresent();
  } 

    getAiraloLogo() {
    return this.page.getByAltText(selector.homepage.airaloLogo);
    }

    async selectCountry(text: string) {
    await this.page.getByTestId(selector.homepage.locationDropdown).click();
    await this.page.getByTestId(selector.homepage.popularLocations)
    .getByText(text).click();
    }

    async typeInSearchBox(text: string) {
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).click();
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).fill(text);
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).press('Enter');
    }

    async selectFromSearchResults(text: string) {
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).press('Enter');
    await this.dismissCookieModalIfPresent();
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).press('Enter');
    await this.page.locator(selector.homepage.searchResultsList).waitFor({ state: 'visible' });
    await this.dismissCookieModalIfPresent();
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).scrollIntoViewIfNeeded();
    await this.page.getByPlaceholder(selector.homepage.searchBoxField).press('Enter');
    await this.page.locator(selector.homepage.searchResultOption).getByText(text).click();
    }

    getLocationHeading() {
    return this.page.getByTestId(selector.homepage.locationHeading);
    }
    async clickAnyButtonWithText(text: string) {
    await this.page.getByRole('button', { name: text }).scrollIntoViewIfNeeded();
    await this.page.getByRole('button', { name: text }).click();
    }

   async clickUnlimitedTab() {
    await this.page.getByTestId(selector.homepage.unlimitedTab).click();
   }

    async scrollToText(text: string) {
    await this.page.getByText(text).scrollIntoViewIfNeeded();
    }

    async click7DaysPackage() {
    await this.page.getByLabel(selector.homepage.sevenDaysPackage).click();
    }; 

    async getPackageAndTotalPrice(): Promise<{ packagePrice: string; totalPrice: string }> {
    await this.page.locator(selector.homepage.packagePrice).waitFor({ state: 'visible' });

    const totalPriceLocator = this.page.getByText(/£[\d.]+/).last();
    await totalPriceLocator.waitFor({ state: 'visible' });

    const packagePrice = await this.page.locator(selector.homepage.packagePrice).innerText();
    const totalPrice = await totalPriceLocator.innerText();
    return { packagePrice, totalPrice };
    }
}
export default HomePage;
