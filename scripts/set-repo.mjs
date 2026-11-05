#!/usr/bin/env node
/** 發布到 GitHub 後執行一次：node scripts/set-repo.mjs 你的帳號/ziwei-tw
 *  會把安裝腳本、README、AI 安裝提示詞裡的 OWNER/ziwei-tw 換成實際位址。 */
import fs from 'node:fs';
const repo = process.argv[2];
if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) { console.log('用法：node scripts/set-repo.mjs 帳號/專案名稱'); process.exit(1); }
for (const f of ['install.sh', 'install.ps1', 'README.md', 'docs/AI安裝提示詞.md', '.env.example', 'lib/site.ts']) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8'); const t = s.replaceAll('OWNER/ziwei-tw', repo);
  if (t !== s) { fs.writeFileSync(f, t); console.log('已更新', f); }
}
