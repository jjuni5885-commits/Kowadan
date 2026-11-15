"""개편 기능 시험: 단 트래커, 스크롤 보존, 무늬 편집기, 일람표, 서술형 체크, 단일 도안 내보내기/불러오기, 이미지 저장"""
from pathlib import Path
import asyncio, json
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(accept_downloads=True, viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        # 핏 프리셋
        await pg.click('[data-fit="over"]'); await pg.wait_for_timeout(400)
        print('오버핏 가슴 여유', await ev("S.P.ease.chest"), '완성', await ev("fmt(S.C.finished.chest)"))
        await pg.click('[data-sgroup="m"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-preset="m100"]'); await pg.wait_for_timeout(400)
        print('남성100 가슴', await ev("S.P.body.chest"), '인스펙터', (await pg.inner_text('.insp'))[:60].replace('\n', ' '))
        # 차트 트래커
        await pg.click('button[data-tab="chart"]'); await pg.wait_for_timeout(500)
        for _ in range(3): await pg.click('#rnext')
        await pg.keyboard.press('ArrowUp'); await pg.wait_for_timeout(200)
        print('현재 단', await ev("S.P.progress.back"), await pg.inner_text('.prog'))
        await pg.fill('#rjump', '115'); await pg.press('#rjump', 'Enter'); await pg.wait_for_timeout(300)
        print('115단 배지', await pg.inner_text('.badges'))
        await pg.fill('#rjump', '19'); await pg.press('#rjump', 'Enter'); await pg.wait_for_timeout(300)
        print('19단 배지', await pg.inner_text('.badges'))
        st = await ev("$('#chartbox').scrollTop")
        await pg.click('[data-c="tint"]'); await pg.wait_for_timeout(300)
        print('옵션 변경 후 스크롤 보존', st == await ev("$('#chartbox').scrollTop"), st)
        hl = await ev("$('#chartbox svg').innerHTML.includes('rgba(140,59,50,0.18)')")
        print('하이라이트 있음', hl)
        async with pg.expect_download() as d: await pg.click('#cpng')
        print('PNG', (await d.value).suggested_filename)
        async with pg.expect_download() as d: await pg.click('#csvg')
        print('SVG', (await d.value).suggested_filename)
        # 다른 탭 다녀와도 진행 단 유지
        await pg.click('button[data-tab="text"]'); await pg.click('button[data-tab="chart"]'); await pg.wait_for_timeout(300)
        print('탭 왕복 후 단', await ev("S.P.progress.back"))
        # 무늬 편집기
        await pg.click('button[data-tab="motif"]'); await pg.click('#mnew'); await pg.wait_for_timeout(300)
        await pg.click('[data-tool="p"]')
        await pg.locator('#ecanvas').scroll_into_view_if_needed()
        box = await pg.locator('#ecanvas svg').bounding_box()
        cs = await ev("S.editor.cs")
        x0, y0 = box['x'], box['y']
        G = await ev("(()=>{const g=chartGeom({W:S.editor.w,total:S.editor.h},{cw:S.editor.cs,ch:S.editor.cs});return [g.mL,g.mT]})()")
        cx = lambda c: x0 + G[0] + (c + .5) * cs
        cy = lambda r: y0 + G[1] + (8 - r + .5) * cs  # r 1부터
        await pg.mouse.move(cx(0), cy(2)); await pg.mouse.down()
        for c in range(1, 6): await pg.mouse.move(cx(c), cy(2), steps=2)
        await pg.mouse.up()
        print('드래그 칠하기 2단', await ev("S.editor.cells[1].join(',')"))
        await pg.click('#eundo'); print('실행 취소 후', await ev("S.editor.cells[1].join(',')"))
        await pg.click('#eredo'); print('다시 실행 후', await ev("S.editor.cells[1].join(',')"))
        await pg.keyboard.press('Control+z'); print('Ctrl+Z 후', await ev("S.editor.cells[1].join(',')"))
        await pg.click('[data-tool="LC2/2"]')
        await pg.locator('#ecanvas').scroll_into_view_if_needed(); box = await pg.locator('#ecanvas svg').bounding_box(); x0, y0 = box['x'], box['y']
        await pg.mouse.click(cx(0), cy(1))
        await pg.click('#emirror'); print('대칭 후 1단 토큰', await ev("editorTokens(S.editor)[0].join(' ')"))
        await pg.click('#edup'); print('복제 후 높이', await ev("S.editor.h"))
        await pg.click('#edel'); print('삭제 후 높이', await ev("S.editor.h"))
        print('2x2 미리보기', await pg.locator('#etile svg').count())
        await pg.click('#ecancel')
        # 일람표
        await pg.click('button[data-tab="schem"]'); await pg.wait_for_timeout(400)
        rows = await ev("scheduleRows(S.C.pieces[1], S.C).slice(0,12).map(x=>x.r+': '+x.text+' -> '+x.after)")
        print('\n'.join(rows))
        async with pg.expect_download() as d: await pg.click('#spng')
        print('도식화 PNG', (await d.value).suggested_filename)
        # 서술형 체크
        await pg.click('button[data-tab="text"]'); await pg.wait_for_timeout(300)
        await pg.locator('.tick').nth(2).click(); await pg.locator('.tick').nth(5).click()
        print('체크', await ev("S.P.textDone"), await pg.locator('.tick.done').count())
        # 단일 도안 내보내기 / 불러오기
        await pg.click('button[data-tab="print"]')
        async with pg.expect_download() as d: await pg.click('#exone')
        dl = await d.value; path = await dl.path(); print('단일 내보내기', dl.suggested_filename)
        j = json.loads(Path(path).read_text()); j['P']['name'] = '불러온 도안'
        tmp = ROOT / 'tmp_one.json'; tmp.write_text(json.dumps(j, ensure_ascii=False))
        await ev("S.dirty=false")
        await pg.set_input_files('#imone', str(tmp)); await pg.wait_for_timeout(600)
        print('불러온 이름', await ev("S.P.name"), '진행', await ev("S.P.progress.back"), '탭', await ev("S.tab"))
        tmp.unlink()
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
