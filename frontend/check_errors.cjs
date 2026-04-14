const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('CONSOLE ERROR:', msg.text());
    } else {
       console.log('PAGE LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:\n', error.stack || error.message));

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 5000 });
  } catch (e) {}
  
  await browser.close();
})();
