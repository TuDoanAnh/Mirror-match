import fs from 'fs';

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity-ide/brain/62f5aa8f-e66a-4ccd-b696-1a858e563bba/.system_generated/steps/757/content.md', 'utf8');

// Find all quoted strings in minified JS
const strings = content.match(/"[^"]+"/g) || [];
const uniqueStrings = [...new Set(strings.map(s => s.slice(1, -1)))];

console.log('--- ALL STRINGS WITH "game" OR "ready" OR "loading" OR "message" ---');
uniqueStrings.filter(s => /game|ready|loading|message|completed|start|platform|state/i.test(s)).forEach(s => {
  console.log(s);
});
