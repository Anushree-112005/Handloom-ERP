const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git')) return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const regex1 = /<div className="search-bar"[^>]*>[\s\n]*<Search size=\{16\} color="var\(--text-muted\)" \/>[\s\n]*<input type="text" placeholder="([^"]+)" \/>[\s\n]*<\/div>/g;
const regex2 = /<div className="search-bar" style={{ width: \d+ }}>/g;
const regex3 = /<div className="search-bar" style={{ width: '\d+px' }}>/g;

let count = 0;
walkDir('/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src', function(filePath) {
    if (!filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern 1: No value binding
    content = content.replace(
        /<div className="search-bar"[^>]*>[\s\n]*<Search size=\{16\}[^>]*\/>[\s\n]*<input type="text" placeholder="([^"]+)" \/>[\s\n]*<\/div>/g, 
        (match, placeholder) => {
            return `<div className="search-bar" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="${placeholder}" className="form-control" style={{ paddingLeft: 36, width: 250 }} />
            </div>`;
        }
    );

    // Replace the specific format in OperatorMaster and others
    content = content.replace(
        /<div className="search-bar" style=\{\{ width: \d+ \}\}>\s*<Search size=\{16\} color="var\(--text-muted\)" \/>\s*<input type="text" placeholder="([^"]+)" \/>\s*<\/div>/g,
        (match, placeholder) => {
            return `<div className="search-bar" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="${placeholder}" className="form-control" style={{ paddingLeft: 36, width: 250 }} />
            </div>`;
        }
    );
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log(`Updated ${filePath}`);
    }
});
console.log(`Finished. Updated ${count} files.`);
