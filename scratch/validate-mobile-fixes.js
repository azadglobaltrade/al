const fs = require('fs');
const files = ['index.html','product.html','blog.html','documents.html','export.html','privacy.html','terms.html','about.html','jutebags.html','blog/blog-eu-import-documentation.html','blog/blog-jute-bag-gsm-eu.html','blog/blog-jute-vs-cotton-tote.html'];
let fail = false;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  // strip script/style so JS template strings do not skew counts
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const count = (re) => (s.match(re) || []).length;
  const raw = fs.readFileSync(f, 'utf8');
  const issues = [];
  const divBal = count(/<div[ >]/g) - count(/<\/div\s*>/g);
  const navBal = count(/<nav[ >]/g) - count(/<\/nav>/g);
  const secBal = count(/<section[ >]/g) - count(/<\/section>/g);
  if (divBal !== 0) issues.push('div balance ' + divBal);
  if (navBal !== 0) issues.push('nav balance ' + navBal);
  if (secBal !== 0) issues.push('section balance ' + secBal);
  if (!raw.includes('viewport-fit=cover')) issues.push('no viewport-fit=cover');
  if (!/passive:\s?true/.test(raw)) issues.push('no passive scroll');
  if (!raw.includes('min-w-11 min-h-11') && f !== 'jutebags.html') issues.push('no 44px close button');
  if (issues.length) { fail = true; console.log('FAIL', f, '->', issues.join('; ')); } else console.log('OK  ', f);
}
console.log(fail ? 'RESULT: ISSUES FOUND' : 'RESULT: ALL FILES OK');
