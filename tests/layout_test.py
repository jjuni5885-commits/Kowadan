"""배치 시험: 아이폰 폭(375px)과 데스크톱에서 모든 탭의 가로 넘침, 차트 배지 한 줄, 머리 마크 크기 확인"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
TABS = ['proj', 'size', 'design', 'motif', 'chart', 'schem', 'text', 'print']
async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, w in [('375', 375), ('1280', 1280)]:
            ctx = await b.new_context(viewport={'width': w, 'height': 812}, is_mobile=w < 500, has_touch=w < 500)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.route('https://cdn.jsdelivr.net/**', lambda r: r.abort())
            await pg.goto((ROOT / 'index.html').as_uri()); await pg.evaluate("localStorage.clear()"); await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_timeout(800)
            for t in TABS:
                await pg.click(f'button[data-tab="{t}"]'); await pg.wait_for_timeout(400)
                if t == 'chart':
                    await pg.fill('#rjump', '125'); await pg.press('#rjump', 'Enter'); await pg.wait_for_timeout(300)
                    for txt, bw, bh in await pg.evaluate("[...document.querySelectorAll('.badges .badge')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent, r.width, r.height]})"):
                        if bh > 32 or bw < bh: bad.append(f'{name} 차트 배지 여러 줄: {txt} {bw:.0f}x{bh:.0f}')
                over = await pg.evaluate("[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect(); if(r.right<=innerWidth+1) return false; let p=e.parentElement; while(p&&p!==document.body){const o=getComputedStyle(p).overflowX; if(o==='auto'||o==='scroll'||o==='hidden') return false; p=p.parentElement;} return true;}).slice(0,3).map(e=>e.tagName+'.'+e.className)")
                if over: bad.append(f'{name} {t} 가로 넘침: {over}')
            mk = await pg.evaluate("(()=>{const e=document.querySelector('.bmark'); if(!e) return null; const r=e.getBoundingClientRect();return [r.width,r.height]})()")
            if mk != [40, 40]: bad.append(f'{name} 머리 마크 크기 {mk}')
            if errs: bad.append(f'{name} 오류 {errs}')
            await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else '배치 이상 없음')
asyncio.run(main())
