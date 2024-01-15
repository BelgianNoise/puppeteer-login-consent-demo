import fs from 'fs/promises';
import { executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

(async () => {
  puppeteer.use(StealthPlugin());
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
      'Accept-Language': 'nl-BE,nl'
  });

  console.log("reading cookies...")
  try {
    const cookiesString = await fs.readFile('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log("using cookies")
  } catch {
    console.log("no cookies found")
  }

  await page.setViewport({width: 1920, height: 1080});
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0');
  await page.goto('https://www.vtmgo.be/vtmgo');

  console.log('=== PAGE LOADED')

  try {
    console.log('Accepting cookies...')
    const frame = await page.waitForSelector(
      'iframe[title="SP Consent Message"]',
      { timeout: 2000 },
    )
    const frameContent = await frame.contentFrame()
    const button = await frameContent.waitForSelector('button.pg-action-button.pg-accept-button')
    await button.click()
    console.log('Cookies accepted!')
  } catch {
    console.log('No cookies to accept, continuing...')
  }

  try {
    // login check
    await page.waitForSelector(
      'a[aria-label="Mijn Lijst"]',
      { timeout: 2000 },
    )
    console.log('Already logged in!')
  } catch {
    console.log('Logging in...')
    const loginButton = await page.waitForSelector('a.btn[js-module="loginRedirect"]')
    await loginButton.click()
  
    const usernameInput = await page.waitForSelector('input#username')
    await usernameInput.type('king.arthur360@gmail.com')
    const submitButton = await page.waitForSelector('form button[type="submit"]')
    await submitButton.click()
    const passwordInput = await page.waitForSelector('input#password')
    await passwordInput.type('XXX')
    const submitButton2 = await page.waitForSelector('form button[type="submit"]')
    await submitButton2.click()
  
    await page.waitForSelector('a[aria-label="Mijn Lijst"]')
    console.log('Logged in successfully!')
  }

  console.log('=== READY')

  console.log('Saving cookies...')
  const cookies = await page.cookies()
  await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2))
  console.log('Cookies saved!')

  // await browser.close();
})();
