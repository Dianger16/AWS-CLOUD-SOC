const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', error => console.log('PAGE ERROR:\n', error.stack || error.message));

  try {
    console.log('--- Navigating to Login ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    // Check if we need to login
    const title = await page.title();
    console.log('Page Title:', title);

    console.log('--- Checking Dashboard ---');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    console.log('Dashboard URL:', page.url());

    console.log('--- Navigating to Assets ---');
    await page.goto('http://localhost:5173/assets', { waitUntil: 'networkidle0' });
    console.log('Assets URL:', page.url());

    console.log('--- Navigating to Vulnerabilities ---');
    await page.goto('http://localhost:5173/vulnerabilities', { waitUntil: 'networkidle0' });
    console.log('Vulnerabilities URL:', page.url());

  } catch (e) {
    console.error('Test failed:', e);
  }
  
  await browser.close();
})();
