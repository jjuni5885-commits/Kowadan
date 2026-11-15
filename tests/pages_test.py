"""일반 브라우저(GitHub Pages와 같은 환경)에서 PDF 저장, JSON 백업 다운로드 시험"""
from pathlib import Path
import asyncio
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(accept_downloads=True, viewport={'width': 1200, 'height': 900})
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        js = (ROOT / 'node_modules/jspdf/dist/jspdf.umd.min.js').read_text()
        await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=js))
        await pg.goto((ROOT / 'docs/index.html').as_uri()); await pg.wait_for_timeout(1200)
        await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
        async with pg.expect_download(timeout=120000) as d:
            await pg.click('#mkpdf')
        dl = await d.value
        print('PDF', dl.suggested_filename, Path(await dl.path()).stat().st_size)
        async with pg.expect_download() as d2:
            await pg.click('#bk')
        print('JSON', (await d2.value).suggested_filename)
        print('인쇄 버튼', await pg.locator('#prpdf').count())
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
