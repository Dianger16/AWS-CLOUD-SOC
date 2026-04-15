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
    
    // Simulate login by setting a token if possible, but our app likely uses a real login process.
    // Let's assume the user is already logged in for this test or we just navigate directly.
    // Since we saw earlier that it redirects to /login, we might need to bypass auth or use a test account.
    
    console.log('--- Trying to navigate to /dashboard ---');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'load' });
    
    // If it redirects to /login, let's try to find if there's a "token" we can set in localStorage.
    // Based on Common context, typical projects use 'auth_token' or 'token'.
    
    console.log('Current URL:', page.url());

    // Let's try to click a link if we are on a page with a sidebar.
    // If the sidebar is visible even on /login (unlikely) or if we are redirected.
    
    const sidebarExists = await page.evaluate(() => !!document.querySelector('aside'));
    console.log('Sidebar exists:', sidebarExists);

    if (sidebarExists) {
        console.log('Clicking Assets link...');
        await page.click('a[href="/assets"]');
        await page.waitForTimeout(1000);
        console.log('URL after click:', page.url());
    }

  } catch (e) {
    console.error('Test failed:', e);
  }
  
  await browser.close();
})();
