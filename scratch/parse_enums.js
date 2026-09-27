import fs from 'fs';

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity-ide/brain/62f5aa8f-e66a-4ccd-b696-1a858e563bba/.system_generated/steps/757/content.md', 'utf8');

// Search for SendMessageName or sendMessage or platform message constants
const matches = content.match(/[A-Z0-9_]{3,}\s*:\s*"[a-z0-9_]+"/gi) || [];
console.log('--- ENUM MATCHES ---');
matches.forEach(m => console.log(m));
