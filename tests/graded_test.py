"""사이즈 병기 서술형 도안: 토글, 화면 표시, PDF 생성"""
from pathlib import Path
import asyncio
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(accept_downloads=True, viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        js = (ROOT / 'node_modules/jspdf/dist/jspdf.umd.min.js').read_text()
        await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=js))
        await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(300)
        print('사이즈 없을 때 안내', '2개 이상' in await pg.inner_text('.doc'))
        await pg.click('button[data-tab="schem"]'); await pg.wait_for_timeout(300)
        for k in ['w80', 'w85', 'w90']: await pg.click(f'[data-grade="{k}"]'); await pg.wait_for_timeout(150)
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(300)
        await pg.check('#tgrade'); await pg.wait_for_timeout(300)
        t = await pg.inner_text('.doc')
        print('병기 머리글', '사이즈: 80(85) 90' in t)
        print('코잡기 줄', [l for l in t.split('\n') if '일반코잡기' in l][0][:60])
        print('체크 없음', await pg.locator('.doc [data-ti]').count() == 0)
        await pg.uncheck('#tgrade'); await pg.wait_for_timeout(300)
        print('끄면 체크 복귀', await pg.locator('.doc [data-ti]').count() > 0)
        await pg.check('#tgrade'); await pg.wait_for_timeout(200)
        await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
        print('출력 탭 병기 체크', await pg.is_checked('#pgraded'))
        async with pg.expect_download(timeout=60000) as d: await pg.click('#mkpdf')
        f = await d.value; path = '/tmp/graded.pdf'; await f.save_as(path)
        print('PDF', f.suggested_filename, Path(path).stat().st_size)
        print('오류', errs)
        await b.close()
asyncio.run(main())
