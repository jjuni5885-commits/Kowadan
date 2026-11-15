"""src/의 엔진, 렌더러, 앱을 template.html에 넣어 dist/index.html 한 파일로 만든다."""
from pathlib import Path
root = Path(__file__).parent
t = (root / 'src/template.html').read_text(encoding='utf-8')
for k, f in [('ENGINE', 'engine.js'), ('RENDER', 'render.js'), ('APP', 'app.js')]:
    t = t.replace(f'/*{k}*/', (root / 'src' / f).read_text(encoding='utf-8').replace('</script', '<\\/script'))
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/index.html').write_text(t, encoding='utf-8')
print('dist/index.html', len(t), 'bytes')
