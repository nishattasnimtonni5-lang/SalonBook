export default async function run(page, ui) {
  const results = { consoleErrors: [], reportPost: null };
  page.on("console", (msg) => {
    if (msg.type() === "error") results.consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("response", async (res) => {
    if (res.url().includes("/api/reports") && res.request().method() === "POST") {
      results.reportPost = { status: res.status(), body: (await res.text()).slice(0, 250) };
    }
  });

  // Category select (Radix combobox)
  await ui.click("@e6");
  await page.waitForTimeout(600);
  const opts = await ui.snapshot();
  results.options = opts.split("\n").filter((l) => l.includes("option")).join("\n");
  const paymentOpt = opts.match(/@(e\d+) option "Payment Issue"/)?.[1];
  if (paymentOpt) await ui.click(paymentOpt);
  await page.waitForTimeout(400);

  await ui.fill("@e8", "QA verify report submission");
  await ui.fill("@e11", "Automated check that report submission works end to end.");
  await ui.click("@e12");
  await page.waitForTimeout(3500);

  const text = await page.evaluate(() => document.body.innerText);
  results.hasSuccess = /submitted|success|thank/i.test(text);
  results.hasError = /could not|failed|must be signed/i.test(text);
  results.head = text.slice(0, 400).replace(/\n+/g, " | ");
  await page.screenshot({ path: "C:/Projects/b-14-a-09-client/__qa-report-submit.png" });
  return results;
}
