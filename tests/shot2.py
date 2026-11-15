from pathlib import Path
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1400,'height':1000})
        await pg.goto((Path(__file__).resolve().parent.parent/'docs/index.html').as_uri()); await pg.wait_for_timeout(1200)
        js = sys.argv[1]
        res = await pg.evaluate(js)
        print(str(res)[:3000])
        await pg.screenshot(path=sys.argv[2], full_page=True)
        await b.close()
asyncio.run(main())
