const fs = require('fs');

const path = 'C:\\Users\\fenar\\.gemini\\antigravity\\brain\\9c650cff-f69a-4ef2-a57d-3a837ac2991b\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const results = [];
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    // Look for tool responses from run_command
    if (data.type === 'SYSTEM' || data.type === 'TOOL_RESPONSE' || data.type === 'PLANNER_RESPONSE') {
      let text = data.content || data.output || '';
      if (typeof text === 'string') {
        if (text.includes('Moved ') || text.includes('Removed ') || text.includes('Updated ') || text.includes('Unset ') || text.includes('Deleted ')) {
          // We only want the lines that actually contain these words
          const splitLines = text.split('\n');
          for (const l of splitLines) {
            if (l.includes('Moved ') || l.includes('Removed ') || l.includes('Updated ') || l.includes('Unset ') || l.includes('Deleted ')) {
              results.push(l);
            }
          }
        }
      }
    }
  } catch(e) {}
}

const uniqueResults = [...new Set(results)].filter(line => !line.includes('npm run') && !line.includes('console.log') && !line.includes('results.push'));
fs.writeFileSync('C:\\Users\\fenar\\.gemini\\antigravity\\brain\\9c650cff-f69a-4ef2-a57d-3a837ac2991b\\extracted-logs.txt', uniqueResults.join('\n'));
console.log('Done parsing.');
