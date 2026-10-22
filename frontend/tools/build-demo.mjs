import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
const out = 'dist/nihongo-trail/browser';
const path = `${out}/index.html`;
writeFileSync(path, readFileSync(path, 'utf8').replace('<html ', '<html data-demo="true" '));
copyFileSync('../THIRD_PARTY_NOTICES.md', `${out}/THIRD_PARTY_NOTICES.md`);
writeFileSync(`${out}/vercel.json`, JSON.stringify({framework:null,buildCommand:'',outputDirectory:'.',rewrites:[{source:'/((?!api/|assets/|.*\\.).*)',destination:'/index.html'}]}));
