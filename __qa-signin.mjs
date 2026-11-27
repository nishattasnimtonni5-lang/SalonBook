export default async function run(page, ui) {
  const results = {};
  page.on("response", async (res) => {
    if (res.url().includes("sign-in/email")) {
      results.signIn = { status: res.status() };
    }
  });

  // Pick the Admin role first — the form signs out mismatched roles.
  await ui.click("@e7");
  await ui.fill("@e9", "qa-manage-fix-1795755638581@example.com");
  await ui.fill("@e11", "QaTestPass123!");
  await ui.click("@e12");
  await page.waitForTimeout(4000);

  results.url = page.url();
  results.text = await page.evaluate(() => document.body.innerText.slice(0, 250));
  results.cookies = await page.evaluate(() => document.cookie);
  return results;
}
