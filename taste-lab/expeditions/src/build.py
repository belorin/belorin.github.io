from pathlib import Path
import sys
root=Path(__file__).resolve().parent.parent
name=sys.argv[1]
kind,version=name.split('-')
html=(root/'src'/f'{kind}.html').read_text()
html=html.replace('/*STYLE*/',(root/'src/style.css').read_text()).replace('/*ENGINE*/',(root/'src/engine.js').read_text()).replace('/*APP*/',(root/'src'/f'{kind}.js').read_text()).replace('__VERSION__',version)
target=root/'versions'/f'{name}.html'
if target.exists(): raise SystemExit('Immutable snapshot already exists: '+str(target))
target.write_text(html)
print(target)
