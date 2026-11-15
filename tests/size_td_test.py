"""사이즈 체계(분류 먼저), 병기 표기, 차트 사이즈 선택, 탑다운 래글런/코코닛츠 화면과 PDF 시험"""
from pathlib import Path
import asyncio, sys
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
        ev = pg.evaluate
        await pg.evaluate("()=>{ S.print.vec = false; }")
        print('기본 사이즈', await ev("S.P.size"), await ev("S.P.body.chest"))
        await pg.click('[data-sgroup="m"]'); await pg.wait_for_timeout(200)
        print('남성 칩', await pg.locator('[data-preset^="m"]').count())
        await pg.click('[data-preset="m90"]'); await pg.wait_for_timeout(300)
        print('남성 90', await ev("JSON.stringify(S.P.body)"), await ev("S.P.design.length"))
        await pg.click('[data-sgroup="k"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-preset="k5"]'); await pg.wait_for_timeout(300)
        print('아동 5호 고무단', await ev("S.P.design.ribH"), '가슴', await ev("S.P.body.chest"))
        await pg.click('[data-sgroup="w"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-preset="w95"]'); await pg.wait_for_timeout(300)
        print('여성 95 고무단', await ev("S.P.design.ribH"))
        # 그레이딩
        await pg.click('button[data-tab="schem"]'); await pg.wait_for_timeout(300)
        for k in ['w95', 'w100', 'w105', 'w110', 'w115']: await pg.click(f'#grading [data-grade="{k}"]'); await pg.wait_for_timeout(120)
        print('그레이딩', await ev("JSON.stringify(gradeSizes())"))
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(300)
        await pg.check('#tgrade'); await pg.wait_for_timeout(400)
        t = await pg.inner_text('.doc')
        print('병기 머리글', [l for l in t.split('\n') if l.startswith('사이즈:')][:1])
        print('코잡기 줄', [l for l in t.split('\n') if '일반코잡기' in l][0][:90])
        # 차트 사이즈 선택
        await pg.click('button[data-tab="chart"]'); await pg.wait_for_timeout(400)
        print('차트 사이즈 칩', await pg.locator('[data-csize]').count())
        w0 = await ev("curPiece().W")
        await pg.click('[data-csize="w115"]'); await pg.wait_for_timeout(400)
        print('115 차트 폭', w0, '->', await ev("curPiece().W"))
        # 출력: 사이즈마다 차트
        await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
        print('사이즈별 차트 체크', await pg.is_checked('[data-pr="chartAll"]'))
        n1 = await ev("buildPages(S.C).length")
        await pg.uncheck('[data-pr="chartAll"]'); n2 = await ev("buildPages(S.C).length")
        await pg.uncheck('[data-pr="charts"]'); n3 = await ev("buildPages(S.C).length")
        print('쪽수 사이즈별/기준만/차트없음', n1, n2, n3)
        await pg.check('[data-pr="charts"]'); await pg.check('[data-pr="chartAll"]')
        # 멍석 3종
        await pg.click('button[data-tab="design"]'); await pg.wait_for_timeout(300)
        for k in ['seed', 'seed12', 'seed22']:
            await pg.click(f'[data-seg="pattern.bg"] [data-v="{k}"]'); await pg.wait_for_timeout(400)
            pc = 'S.C.pieces[0]'
            row = await ev(f"[1,2,3,4].map(r=>{pc}.codes[{pc}.ribRows+r].slice(5,13).map(v=>v==='k'?'|':v==='p'?'-':'?').join('')).join(' ')")
            print('바탕', k, row)
        await pg.click('[data-seg="pattern.bg"] [data-v="st"]'); await pg.wait_for_timeout(300)
        # 탑다운
        for mode in ['raglan', 'coco']:
            for g in ['pullover', 'cardigan']:
                await pg.click('[data-seg="dir"] [data-v="td"]'); await pg.wait_for_timeout(300)
                await pg.click(f'[data-seg="sleeve"] [data-v="{mode}"]'); await pg.wait_for_timeout(300)
                await pg.click(f'[data-seg="garment"] [data-v="{g}"]'); await pg.wait_for_timeout(500)
                print(mode, g, '조각', await ev("S.C && S.C.pieces.map(p=>p.name).join(', ')"), '경고', await ev("S.C && S.C.warnings.join(' ')"))
                for tab in ['chart', 'schem', 'text', 'print', 'size']:
                    await pg.click(f'button[data-tab="{tab}"]'); await pg.wait_for_timeout(300)
                await pg.click('button[data-tab="design"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-seg="garment"] [data-v="pullover"]'); await pg.wait_for_timeout(400)
        await pg.click('[data-seg="sleeve"] [data-v="raglan"]'); await pg.wait_for_timeout(400)
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(400)
        t = await pg.inner_text('.doc')
        print('래글런 병기 요크 줄', [l for l in t.split('\n') if '일반코잡기' in l][0][:110])
        await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
        async with pg.expect_download(timeout=120000) as d: await pg.click('#mkpdf')
        f = await d.value; path = '/tmp/td.pdf'; await f.save_as(path)
        print('PDF', f.suggested_filename, Path(path).stat().st_size)
        await pg.click('button[data-tab="chart"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/td_chart.png', full_page=False)
        await pg.click('button[data-tab="schem"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/td_schem.png', full_page=False)
        print('오류', errs)
        await b.close()
asyncio.run(main())
