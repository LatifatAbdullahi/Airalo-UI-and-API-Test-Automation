import { test, expect } from "@playwright/test";
import HomePage from "../../pages/home-page";

test.describe("@ui eSim Package selection flow", () => {
  test("Select a Japan eSim package", async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.navigate();
    await homePage.dismissCookieModalIfPresent();
    await expect(homePage.getAiraloLogo()).toBeVisible();

    await homePage.typeInSearchBox("Japan");
    await homePage.selectFromSearchResults("Japan");

    await expect(homePage.getLocationHeading()).toBeVisible();
    await expect(homePage.getLocationHeading()).toContainText("Japan");

    await homePage.clickUnlimitedTab();
    await homePage.scrollToText("7 days");
    await homePage.click7DaysPackage();

    const { packagePrice, totalPrice } = await homePage.getPackageAndTotalPrice();
    console.log('Compared prices:', { packagePrice, totalPrice });
    expect(packagePrice).toBe(totalPrice);
  })

});
