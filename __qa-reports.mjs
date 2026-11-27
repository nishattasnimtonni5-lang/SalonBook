export default async function run(page, ui) {
  const results = { failedRequests: [], consoleErrors: [] };
  page.on("requestfailed", (req) => {
    results.failedRequests.push(req.url().slice(0, 150));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") results.consoleErrors.push(msg.text().slice(0, 200));
  });

  await page.goto("http://localhost:3000/admin-dashboard/manage-reports", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2500);

  results.url = page.url();
  results.bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1200));
  // Any red "must be signed in" style error?
  const body = await page.evaluate(() => document.body.innerText);
  results.has401Text = /must be signed in|Please login first|Unauthorized/i.test(body);
  await page.screenshot({ path: "C:/Projects/b-14-a-09-client/__qa-manage-reports.png" });
  return results;
}
