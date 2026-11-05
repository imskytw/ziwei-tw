"""
把原專案（簡體）轉成繁體（台灣用語）。同步原版更新時使用：
  python3 scripts/sync-upstream/convert-to-tw.py <資料夾>
轉完記得：algorithm.ts 的 iztro 語系改 zh-TW，並跑 npm test。
"""
import sys, os, re, opencc
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_fix import fix
root = sys.argv[1]
c = opencc.OpenCC('s2twp')
exts = ('.ts', '.tsx', '.css', '.md', '.js', '.json', '.yml')
skip_dirs = {'node_modules', '.git', '.next'}
skip_files = {'package-lock.json', 'package.json', 'tsconfig.json'}
changed = 0
for dp, dns, fns in os.walk(root):
    dns[:] = [d for d in dns if d not in skip_dirs]
    for fn in fns:
        if not fn.endswith(exts) or fn in skip_files: continue
        p = os.path.join(dp, fn)
        s = open(p, encoding='utf-8').read()
        if not re.search(r'[一-鿿]', s): continue
        t = fix(c.convert(s))
        if t != s:
            open(p, 'w', encoding='utf-8').write(t); changed += 1
print('converted files:', changed)
