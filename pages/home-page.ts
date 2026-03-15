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
      await acceptButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
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
    await this.page.waitForTimeout(300); 
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
    const searchBox = this.page.getByPlaceholder(selector.homepage.searchBoxField);
    const resultsList = this.page.locator(selector.homepage.searchResultsList);
    const resultOption = resultsList.getByText(text, { exact: false }).first();

    await searchBox.waitFor({ state: 'visible' });
    await searchBox.scrollIntoViewIfNeeded();
    await this.dismissCookieModalIfPresent();

    const dropdownVisible = await resultsList.isVisible().catch(() => false);
    if (!dropdownVisible) {
      await searchBox.scrollIntoViewIfNeeded();
      await searchBox.click({ force: true });
      await searchBox.press('Enter');
    }

    await resultsList.waitFor({ state: 'visible' });
    await this.dismissCookieModalIfPresent();

    await resultOption.waitFor({ state: 'visible' });
    await resultOption.click();
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
