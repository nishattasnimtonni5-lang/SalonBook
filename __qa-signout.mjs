export default async function run(page, ui) {
  const results = {};

  // Sign out via the navbar avatar menu.
  await ui.click("@e2");
  await page.waitForTimeout(700);
  const menu = await ui.snapshot();
  results.menu = menu.split("\n").filter((l) => /sign out|logout|log out/i.test(l)).join("\n");
  const signOut = menu.match(/@(e\d+) (?:menuitem|button|item) "Sign ?Out"/i)?.[1]
    ?? menu.match(/@(e\d+) "Sign ?Out"/i)?.[1];
  if (signOut) {
    await ui.click(signOut);
    await page.waitForTimeout(2500);
  }
  results.urlAfterSignOut = page.url();

  // Signed-out visit to a protected dashboard page → should bounce to /signin.
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  results.dashboardUrl = page.url();
  results.dashboardText = (await page.evaluate(() => document.body.innerText)).slice(0, 250).replace(/\n+/g, " | ");

  results.cookies = await page.evaluate(() => document.cookie);
  return results;
}
