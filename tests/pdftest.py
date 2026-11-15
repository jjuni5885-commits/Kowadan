from pathlib import Path
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1200,'height':900})
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        js=open(Path(__file__).resolve().parent.parent/'node_modules/jspdf/dist/jspdf.umd.min.js').read()
        await pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=js))
        await pg.goto((Path(__file__).resolve().parent.parent/'dist/index.html').as_uri()); await pg.wait_for_timeout(1500)
        # 가디건 V넥으로 바꿔 시험
        await pg.evaluate("""()=>{ S.dl={save:async ({filename,data})=>{ window.__pdf=data; window.__fn=filename; return {status:'saved'} }}; }""")
        await pg.click('button[data-tab="print"]'); await pg.wait_for_timeout(300)
        await pg.click('#mkpdf')
        for i in range(120):
            await pg.wait_for_timeout(500)
            st = await pg.inner_text('#pdfst')
            if '저장했습니다' in st or '못했' in st: break
        print(st)
        b64 = await pg.evaluate("""async()=>{ const b=window.__pdf; if(!b) return null; const buf=new Uint8Array(await b.arrayBuffer()); let s=''; for(let i=0;i<buf.length;i+=32768) s+=String.fromCharCode.apply(null, buf.subarray(i,i+32768)); return btoa(s); }""")
        if b64: open('out.pdf','wb').write(base64.b64decode(b64)); print('pdf bytes', len(base64.b64decode(b64)))
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
