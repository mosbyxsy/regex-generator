import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('opens and reloads at the top without scrolling the focused input into view', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 400 });
    await page.addInitScript(() => {
        localStorage.setItem('user.lastVersion', '3');
        localStorage.setItem('ui.locale', 'zh-CN');
    });
    await page.goto('/regex-generator/');
    const input = page.locator('#rg_raw_input_text');
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.reload();
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#rg-title')).toBeInViewport({ ratio: 1 });
});

test('shows the localized first-visit guide on a narrow screen', async ({ browser }) => {
    const page = await browser.newPage({ locale: 'zh-TW', viewport: { width: 390, height: 844 } });
    await page.goto('http://127.0.0.1:18373/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('.driver-popover-title')).toHaveText('欢迎使用正则表达式生成器');
    await expect(page.locator('.driver-next-btn')).toHaveText('下一步');
    await page.locator('.driver-next-btn').click();
    await expect(page.locator('.driver-popover-title')).toHaveText('示例文本');
    await page.keyboard.press('Escape');
    await expect(page.locator('#rg_raw_input_text')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.close();
});

for (const path of ['/', '/regex-generator/']) {
    test('restores, translates, copies and reloads a shared result at ' + path, async ({ page, context }) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        const failed: string[] = [];
        page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
        await context.addInitScript(() => {
            if (!localStorage.getItem('user.lastVersion')) {
                localStorage.setItem('user.lastVersion', '3');
            }
        });
        await page.goto(path + '?sampleText=abc123def&flags=i&selection=3%7CNumber');
        const result = page.locator('#rg_result_display');
        await expect(result).toHaveText('abc[0-9]+def');
        await expect(page.locator('#rg_cap_group_display')).toBeVisible();
        await expect(page.locator('.rg-item-selected')).toHaveCount(1);
        await page.getByRole('button', { name: 'JavaScript' }).click();
        const code = await page.locator('#JavaScript_code').textContent();
        await page.locator('#rg_locale').selectOption('zh-CN');
        await expect(page.locator('#rg-title')).toHaveText('正则表达式生成器');
        await expect(page.locator('#JavaScript_code')).toHaveText(code!);
        await expect(result).toHaveText('abc[0-9]+def');
        await expect(page.locator('#rg_cap_group_display')).toBeVisible();
        await expect(page.locator('.rg-item-selected')).toHaveCount(1);
        await page.getByRole('button', { name: '复制正则表达式' }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('abc[0-9]+def');

        await page.getByRole('button', { name: '选项' }).click();
        await page.getByLabel('匹配整行').check();
        await expect(result).toHaveText('^abc[0-9]+def$');
        await page.locator('#rg_button_copy_share_link').click();
        const link = await page.locator('#rg_result_link').textContent();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(link);
        expect(new URL(link!).pathname).toBe(path);
        await page.reload();
        await expect(result).toHaveText('^abc[0-9]+def$');
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
        await expect(page.locator('#JavaScript_code')).toBeVisible();
        await page.locator('#rg_locale').selectOption('en');
        await expect(page.locator('#rg-title')).toHaveText('Regex Generator');

        const manifestHref = await page.locator('link[rel=manifest]').getAttribute('href');
        const manifestUrl = new URL(manifestHref!, page.url());
        const manifest = await (await context.request.get(manifestUrl.href)).json();
        expect(new URL(manifest.start_url, manifestUrl).pathname).toBe(path);
        for (const icon of manifest.icons) expect((await context.request.get(new URL(icon.src, manifestUrl).href)).ok()).toBe(true);
        expect(failed).toEqual([]);
        expect(errors).toEqual([]);
    });
}

test('selects a suggestion and restores it through undo and redo', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('user.lastVersion', '3');
    });
    await page.goto('/?sampleText=abc123def&flags=i');
    const option = page.locator('.rg-recognizer a').filter({ hasText: /^Number$/ }).first();
    await option.locator('../../..').hover();
    await option.click();
    const result = page.locator('#rg_result_display');
    await expect(result).toHaveText('abc[0-9]+def');
    await page.locator('#rg_button_action_undo').click();
    await expect(result).toHaveText('abc123def');
    await page.locator('#rg_button_action_redo').click();
    await expect(result).toHaveText('abc[0-9]+def');
    await page.locator('#rg_raw_input_text').fill('x'.repeat(1001));
    await expect(page.locator('#rg_raw_input_message_shorten')).toBeVisible();
    await expect(page.locator('#rg_raw_input_text')).toHaveValue('x'.repeat(1000));
});

test('uses the original suggestion colors and time selection behavior in Chinese', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('user.lastVersion', '3');
        localStorage.setItem('ui.locale', 'zh-CN');
    });
    await page.goto('/');
    const time = page.locator('.rg-recognizer a').filter({ hasText: /^时间$/ });
    const box = time.locator('../../..');
    const text = page.locator('#rg_text_display .rg-char');
    await box.hover();
    await expect(time).toHaveCSS('color', 'rgb(33, 37, 41)');
    await expect(time).toHaveCSS('text-decoration-line', 'none');
    await expect(text.nth(11)).toHaveClass('rg-char bg-primary');
    await expect(text.nth(23)).toHaveClass('rg-char');
    await page.locator('#rg-title').hover();
    await expect(time).toBeHidden();
    await expect(text.nth(11)).toHaveClass('rg-char');

    await box.hover();
    await time.click();
    await expect(box).toHaveClass(/rg-item-selected/);
    await expect(box).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(text.nth(11)).toHaveClass('rg-char rg-char-selected');
    const iso = page.locator('.rg-recognizer a').filter({ hasText: /^ISO8601$/ });
    await expect(iso.locator('../../..')).toHaveClass(/rg-item-not-available/);
    await expect(page.locator('#rg_result_display')).toContainText('[0-9]{2}:[0-9]{2}');
    await box.click();
    await expect(box).not.toHaveClass(/rg-item-selected/);
    await expect(iso.locator('../../..')).not.toHaveClass(/rg-item-not-available/);
    await expect(page.locator('#rg_result_display')).toContainText('13:34:56\\.123');
});



test('restores, adds and deletes capture groups through the feature flag', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('user.lastVersion', '3');
    });
    await page.goto('/regex-generator/?sampleText=abc&flags=i&capturing-groups=true&capGroups=first%7C%7C0-0');
    const result = page.locator('#rg_result_display');
    await expect(result).toHaveText('(?<first>a)bc');
    await page.locator('#rg_locale').selectOption('zh-CN');
    await expect(page.getByText('添加捕获组（可选）')).toBeVisible();
    await page.getByRole('button', { name: '删除捕获组' }).click();
    await expect(result).toHaveText('abc');
    const symbol = page.locator('#rg_cap_group_display [data-index="1"]');
    await symbol.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const bounds = (await symbol.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    await page.mouse.down();
    await page.mouse.up();
    const popup = page.locator('.popover');
    const name = popup.getByLabel('名称（可选）');
    await expect(name).toBeFocused();
    await expect(popup.locator('.popover-header .btn-close')).toBeVisible();
    await expect(popup.locator('form .mb-3 > label + input')).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    await name.fill('1invalid');
    await expect(popup.locator('.invalid-feedback')).toBeVisible();
    const createGroup = popup.getByRole('button', { name: '创建捕获组' });
    await createGroup.click();
    await expect(result).toHaveText('abc');
    await name.fill('second');
    await expect(popup.locator('.invalid-feedback')).toBeHidden();
    await createGroup.click();
    await expect(result).toHaveText('a(?<second>b)c');
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    await page.reload();
    await expect(result).toHaveText('a(?<second>b)c');
    await expect(page.getByRole('button', { name: '删除捕获组' })).toBeVisible();
});


