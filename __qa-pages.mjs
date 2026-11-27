export default async function run(page, ui) {
  const results = { pages: {}, consoleErrors: [], failedRequests: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") results.consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("requestfailed", (req) => {
    results.failedRequests.push(req.method() + " " + req.url().slice(0, 140));
  });

  const check = async (name, path) => {
    await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const text = await page.evaluate(() => document.body.innerText);
    results.pages[name] = {
      url: page.url(),
      has401: /must be signed in|Please login first|Unauthorized/i.test(text),
      head: text.slice(0, 450).replace(/\n+/g, " | "),
    };
  };

  await check("adminDashboard", "/admin-dashboard");
  await check("manageAppointments", "/admin-dashboard/manage-appointments");
  await check("adminOffers", "/dashboard/admin/offers");
  await page.screenshot({ path: "C:/Projects/b-14-a-09-client/__qa-offers.png" });

  return results;
}
