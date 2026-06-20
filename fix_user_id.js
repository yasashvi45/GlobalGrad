import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace .userId === 1 with .userId === uid
    if (content.includes('userId === 1')) {
      content = content.replace(/userId === 1/g, 'userId === (Number(localStorage.getItem(\'userId\')) || 1)');
    }
    
    // Replace { userId: 1,  with { userId: (Number(localStorage.getItem('userId')) || 1),
    if (content.includes('userId: 1')) {
      content = content.replace(/userId:\s*1/g, 'userId: (Number(localStorage.getItem(\'userId\')) || 1)');
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
