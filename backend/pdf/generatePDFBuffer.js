const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer");

const generatePDFBuffer = async (data) => {
  const html = await ejs.renderFile(
    path.join(__dirname, "template.ejs"),
    data
  );

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = generatePDFBuffer;
