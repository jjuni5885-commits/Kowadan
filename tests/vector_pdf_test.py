"""벡터 PDF 시험(병기 3사이즈). 글꼴은 /tmp에 npm install pretendard@1.3.9 해 두고 route로 넣음. --both 이미지 방식도, --nofont 글꼴 실패 시 이미지 대체 확인"""
import asyncio, base64, sys, time
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent; PRE = Path('/tmp/node_modules/pretendard/dist')
async def font_route(r):
    u = r.request.url
    if '/public/static/' in u: f = PRE / 'public/static' / u.split('/public/static/')[1]
    else: f = PRE / 'web/variable' / u.split('/dist/web/variable/')[1].replace('.min.css', '.css')
    if not f.exists(): return await r.fulfill(status=404)
    ct = {'.css': 'text/css', '.ttf': 'font/ttf'}.get(f.suffix, 'font/woff2')
    await r.fulfill(status=200, content_type=ct, body=f.read_bytes(), headers={'Access-Control-Allow-Origin': '*'})
async def run(pg, vec, out):
    await pg.evaluate(f"()=>{{ S.print.vec={str(vec).lower()}; }}")
    await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
    t = time.time()
    async with pg.expect_download(timeout=120000) as d: await pg.click('#mkpdf')
    f = await d.value; await f.save_as(out)
    for i in range(240):
        await pg.wait_for_timeout(500); st = await pg.inner_text('#pdfst')
        if '저장했습니다' in st or '못했' in st: break
    print(out, st, f'{time.time()-t:.1f}s')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(accept_downloads=True, viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        js = (ROOT / 'node_modules/jspdf/dist/jspdf.umd.min.js').read_text()
        await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=js))
        if '--nofont' in sys.argv: await pg.route('https://cdn.jsdelivr.net/**', lambda r: r.abort())
        else: await pg.route('https://cdn.jsdelivr.net/**', font_route)
        await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_timeout(1500)
        await pg.evaluate("""()=>{ S.dl={save:async ({filename,data})=>{ window.__pdf=data; return {status:'saved'} }}; }""")
        await pg.click('button[data-tab="schem"]'); await pg.wait_for_timeout(300)
        for k in ['44', '55', '66']: await pg.click(f'[data-grade="{k}"]'); await pg.wait_for_timeout(150)
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(300)
        await pg.check('#tgrade'); await pg.wait_for_timeout(200)
        await run(pg, True, '/tmp/vec.pdf')
        if '--both' in sys.argv: await run(pg, False, '/tmp/img.pdf')
        print('오류', errs); await b.close()
asyncio.run(main())
