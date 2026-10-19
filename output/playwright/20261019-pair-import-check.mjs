import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    // Isolated browser test state; no user account or persistent profile is used.
    localStorage.setItem('rdln_beta_terms_accepted', JSON.stringify({ accepted: true, version: '0.6.3' }));
    localStorage.setItem('tour-rdln-welcome-tour-completed', 'true');
    localStorage.setItem('rdln-auto-compare-enabled', 'false');
  });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const original = page.locator('[data-panel-id="original"] textarea:visible');
  const revised = page.locator('[data-panel-id="revised"] textarea:visible');
  await original.waitFor({ timeout: 60000 });
  console.log('Visible inputs:', await page.locator('textarea:visible').count());
  await original.fill('Existing original');
  await revised.fill('Existing revised');
  await page.screenshot({ path: 'output/playwright/20261019-pair-import-before.png', fullPage: true });

  async function drop(target, files) {
    const dataTransfer = await page.evaluateHandle(items => {
      const transfer = new DataTransfer();
      for (const item of items) transfer.items.add(new File([item.text], item.name, {
        type: item.type || 'text/plain', lastModified: item.date
      }));
      return transfer;
    }, files);
    await target.dispatchEvent('drop', { dataTransfer });
    await dataTransfer.dispose();
  }
  const old = { name: 'Contract-original.txt', text: 'The fee is 100 dollars.', date: 100000 };
  const newer = { name: 'Contract-revised.txt', text: 'The fee is 200 dollars.', date: 200000 };
  async function expectPair() {
    await page.waitForFunction(() => [...document.querySelectorAll('[data-panel-id="revised"] textarea')]
      .some(el => el.value === 'The fee is 200 dollars.'));
    assert.equal(await original.inputValue(), old.text);
    assert.equal(await revised.inputValue(), newer.text);
  }
  await drop(original, [newer, old]);
  await expectPair();
  assert.equal(await page.getByText(old.name, { exact: true }).filter({ visible: true }).count(), 1);
  await page.screenshot({ path: 'output/playwright/20261019-pair-import-after.png', fullPage: true });
  await page.getByRole('button', { name: 'Undo import', exact: true }).click();
  assert.equal(await original.inputValue(), 'Existing original');
  assert.equal(await revised.inputValue(), 'Existing revised');
  console.log('PASS: original target, reversed list, filenames, Undo');

  await drop(revised, [old, newer]);
  await expectPair();
  await page.locator('[data-swap-content-button]:visible').click();
  assert.equal(await original.inputValue(), newer.text);
  assert.equal(await revised.inputValue(), old.text);
  console.log('PASS: revised target and Swap');

  await drop(original, [old, newer, { ...old, name: 'third.txt' }]);
  assert.match(await page.getByRole('alert').innerText(), /Oops, you dropped more than two files!/);
  assert.equal(await original.inputValue(), newer.text);
  assert.equal(await revised.inputValue(), old.text);
  await page.screenshot({ path: 'output/playwright/20261019-pair-import-too-many.png', fullPage: true });
  console.log('PASS: more than two rejected without replacing either input');

  await drop(original, [old, { name: 'empty.txt', text: '', date: 200000 }]);
  await page.getByRole('alert').filter({ hasText: 'empty.txt' }).waitFor();
  assert.equal(await original.inputValue(), newer.text);
  assert.equal(await revised.inputValue(), old.text);
  console.log('PASS: empty second document preserves both inputs');

  await drop(revised, [old, { ...newer, date: old.date }]);
  await expectPair();
  assert.match(await page.getByRole('status').filter({ hasText: 'Modification dates' }).innerText(), /check the order/);
  await drop(original, [{ name: 'Single.txt', text: 'Single-file import stays here.', date: 300000 }]);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-panel-id="original"] textarea')]
    .some(el => el.value === 'Single-file import stays here.'));
  assert.equal(await revised.inputValue(), newer.text);
  console.log('PASS: tied dates and single-file drop');

  await page.locator('[data-live-compare-toggle]:visible').click();
  await drop(revised, [newer, old]);
  await expectPair();
  await page.locator('[data-swap-content-button]:visible').waitFor();
  await page.waitForFunction(() => document.querySelector('[data-output-panel]'));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-swap-content-button]')]
    .some(el => el.offsetParent !== null && !el.disabled));
  console.log('PASS: live comparison after complete pair import');

  await page.locator('[data-live-compare-toggle]:visible').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await drop(original, [{ ...newer, text: 'Mobile revised document' }, { ...old, text: 'Mobile original document' }]);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-panel-id="revised"] textarea')]
    .some(el => el.value === 'Mobile revised document'));
  assert.equal(await original.inputValue(), 'Mobile original document');
  assert.equal(await revised.inputValue(), 'Mobile revised document');
  await page.screenshot({ path: 'output/playwright/20261019-pair-import-mobile.png', fullPage: true });
  console.log('PASS: mobile layout');
  assert.deepEqual(errors, []);
  console.log('PASS: no browser page errors');
} finally {
  await browser.close();
}
