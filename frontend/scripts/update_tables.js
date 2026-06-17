const fs = require('fs');
const path = require('path');

const TARGET_THEAD = 'className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90"';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/User/Desktop/dinesh-tex/dinesh-tex/frontend/src');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace <thead className="...">
  content = content.replace(/<thead\s+className=["'][^"']*["']/g, `<thead ${TARGET_THEAD}`);
  
  // Replace <thead style="..."> (if any)
  content = content.replace(/<thead\s+style=\{[^}]+\}/g, `<thead ${TARGET_THEAD}`);
  
  // Just <thead ... > without className or style but other attributes
  content = content.replace(/<thead(\s+(?!className|style)[a-zA-Z]+=(?:["'][^"']*["']|\{[^}]+\}))*>/g, `<thead $1 ${TARGET_THEAD}>`);

  // Simple <thead>
  content = content.replace(/<thead>/g, `<thead ${TARGET_THEAD}>`);

  // Standardize row hovers
  content = content.replace(/className=["']([^"']*hover:bg-[a-z]+-?[0-9]*\/?\d*[^"']*)["']/g, (match, p1) => {
    let newClass = p1.replace(/hover:bg-[a-z]+-?[0-9]*\/?\d*/g, 'hover:bg-purple-50/15');
    if (!newClass.includes('transition-colors')) newClass += ' transition-colors';
    return `className="${newClass}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    count++;
  }
});

console.log(`Total files updated: ${count}`);
