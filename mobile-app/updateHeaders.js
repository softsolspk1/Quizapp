const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(screensDir);

let count = 0;
files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const oldContent = content;

  // Split by <LinearGradient to isolate each component safely
  const parts = content.split('<LinearGradient');
  for (let i = 1; i < parts.length; i++) {
    // Find the end of the opening tag '>'
    const endTagIndex = parts[i].indexOf('>');
    if (endTagIndex === -1) continue;
    
    const openingTag = parts[i].substring(0, endTagIndex);
    
    // Only modify if this specific LinearGradient is the header
    if (openingTag.includes('style={styles.header}') || openingTag.includes('style={styles.headerStart}')) {
      const isSelfClosing = openingTag.endsWith('/');
      // Remove any start={{...}} end={{...}} colors={...} and style={styles.header...}
      const newOpeningTag = `\n        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}\n        start={{ x: 0, y: 0 }}\n        end={{ x: 1, y: 1 }}\n        style={styles.header}\n      ${isSelfClosing ? '/' : ''}`;
      
      parts[i] = newOpeningTag + parts[i].substring(endTagIndex);
    }
  }

  content = parts.join('<LinearGradient');

  if (content !== oldContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
    count++;
  }
});
console.log('Total files updated: ' + count);
