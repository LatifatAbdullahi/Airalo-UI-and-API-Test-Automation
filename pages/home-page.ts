const selector = require('../elements/locators.json')
import { Page } from "@playwright/test";


class HomePage {
  constructor(private page: Page) {}

    async navigate() {
    await this.page.goto('/');
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
    const resultOption = this.page
      .getByRole('listbox')
      .or(this.page.locator(selector.homepage.searchResultsList))
      .getByText(text)

    await this.dismissCookieModalIfPresent();
    await searchBox.waitFor({ state: 'visible' });
    await searchBox.scrollIntoViewIfNeeded();
    await searchBox.click();
    await searchBox.press('Enter');

    const listVisible = await resultOption.waitFor({ state: 'visible' }).then(() => true).catch(() => false);
    if (!listVisible) {
      await searchBox.click();
      await searchBox.press('Enter');
    }

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
    const packageOption = this.page.getByLabel(/Select Unlimited - 7 days/i);
    await packageOption.waitFor({ state: 'visible', timeout: 1_000 });
    await packageOption.scrollIntoViewIfNeeded();
    await packageOption.click();
    } 

    async getPackageAndTotalPrice(): Promise<{ packagePrice: string; totalPrice: string }> {
    const packageLocator = this.page.getByRole('button', { name: /Select Unlimited - 7 days/i });
    await packageLocator.scrollIntoViewIfNeeded();
    await packageLocator.click();

    const packagePriceLocator = packageLocator.getByTestId(selector.homepage.packagePrice);
    await packagePriceLocator.waitFor({ state: 'visible' });
    const packagePrice = (await packagePriceLocator.innerText()).trim();

    const totalPriceLocator = this.page.getByText(/[£$][\d.]+/).last();
    await totalPriceLocator.waitFor({ state: 'visible' });
    const totalPrice = (await totalPriceLocator.innerText()).trim();

    return { packagePrice, totalPrice };
    }

  async dismissCookieModalIfPresent() {
    const acceptButton = this.page.getByRole('button', { name: 'Accept basic cookies', exact: true });
    try {
      await acceptButton.waitFor({ state: 'visible', timeout: 10_000 });
      await acceptButton.click();
      await acceptButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch {
    }
  }


}
export default HomePage;
