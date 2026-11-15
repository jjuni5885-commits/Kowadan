from pathlib import Path
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        vw = int(sys.argv[1]) if len(sys.argv)>1 else 1200
        pg = await b.new_page(viewport={'width':vw,'height':900}, device_scale_factor=1)
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        await pg.goto((Path(__file__).resolve().parent.parent/'docs/index.html').as_uri())
        await pg.wait_for_timeout(1500)
        tabs = sys.argv[2].split(',') if len(sys.argv)>2 else ['size','design','motif','chart','schem','text','print','proj']
        for t in tabs:
            await pg.click(f'button[data-tab="{t}"]')
            await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'shot_{t}_{vw}.png', full_page=False)
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
