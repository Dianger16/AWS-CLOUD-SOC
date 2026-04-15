const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    // filter out React devtools logs
    if (!msg.text().includes('React DevTools')) {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:\n', error.stack || error.message));

  try {
    console.log('--- Navigating to Login ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    console.log('--- Filling Login Form ---');
    await page.type('input[placeholder="username"]', 'admin');
    await page.type('input[type="password"]', 'SOC2027'); 
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Navigation wait timeout'))
    ]);
    
    console.log('Current URL after login:', page.url());

    const sidebarExists = await page.evaluate(() => !!document.querySelector('aside'));
    console.log('Sidebar exists:', sidebarExists);

    if (sidebarExists) {
        console.log('Clicking Assets link...');
        await page.click('a[href="/assets"]');
        await new Promise(r => setTimeout(r, 1000));
        console.log('URL after click:', page.url());
        
        // checking what is in the main body
        const h2Text = await page.evaluate(() => document.querySelector('h2')?.innerText || 'No H2 found');
        console.log('H2 text on current page:', h2Text);
    } else {
        console.log('Could not find sidebar. Check if login was successful.');
        const html = await page.content();
        if (html.includes('Invalid username or password') || html.includes('Login failed')) {
             console.log('Login failed message found on page');
             // Try to just bypass login by injecting token
             console.log('Attempting to inject a fake token to bypass Login...');
             // Wait, token is in-memory only _accessToken! We can't inject it easily if it's protected.
        }
    }

  } catch (e) {
    console.error('Test failed:', e);
  }
  
  await browser.close();
})();
