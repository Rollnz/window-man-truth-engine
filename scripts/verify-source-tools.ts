/**
 * Verifies SOURCE_TOOLS arrays are synchronized between
 * frontend and backend.
 * 
 * Run: npm run verify:source-tools
 * Automatically runs on: npm run build (via prebuild hook)
 */
import * as fs from 'fs';

const FRONTEND_PATH = 'src/types/sourceTool.ts';
const BACKEND_PATH = 'supabase/functions/_shared/sourceTools.ts';

function extractSourceTools(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract array contents between [ and ] after SOURCE_TOOLS =
  const match = content.match(/SOURCE_TOOLS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  if (!match) {
    throw new Error(`Could not find SOURCE_TOOLS array in ${filePath}`);
  }
  
  // Parse the array items - extract strings between quotes
  const arrayContent = match[1];
  const items: string[] = [];
  const stringMatches = arrayContent.matchAll(/['"]([^'"]+)['"]/g);
  
  for (const stringMatch of stringMatches) {
    items.push(stringMatch[1]);
  }
  
  return items.sort();
}

function main() {
  console.log('🔍 Verifying SOURCE_TOOLS synchronization...\n');
  
  // Check files exist
  if (!fs.existsSync(FRONTEND_PATH)) {
    console.error(`❌ Frontend file not found: ${FRONTEND_PATH}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(BACKEND_PATH)) {
    console.error(`❌ Backend file not found: ${BACKEND_PATH}`);
    process.exit(1);
  }
  
  try {
    const frontendTools = extractSourceTools(FRONTEND_PATH);
    const backendTools = extractSourceTools(BACKEND_PATH);
    
    console.log(`Frontend (${FRONTEND_PATH}): ${frontendTools.length} tools`);
    console.log(`Backend (${BACKEND_PATH}): ${backendTools.length} tools\n`);
    
    // Find differences
    const onlyInFrontend = frontendTools.filter(t => !backendTools.includes(t));
    const onlyInBackend = backendTools.filter(t => !frontendTools.includes(t));
    
    if (onlyInFrontend.length === 0 && onlyInBackend.length === 0) {
      console.log('✅ SOURCE_TOOLS are synchronized!\n');
      console.log('Tools:', frontendTools.join(', '));
      process.exit(0);
    }
    
    console.error('❌ SOURCE_TOOLS are OUT OF SYNC!\n');
    
    if (onlyInFrontend.length > 0) {
      console.error('Missing from backend (_shared/sourceTools.ts):');
      onlyInFrontend.forEach(t => console.error(`  - ${t}`));
      console.error('');
    }
    
    if (onlyInBackend.length > 0) {
      console.error('Missing from frontend (src/types/sourceTool.ts):');
      onlyInBackend.forEach(t => console.error(`  - ${t}`));
      console.error('');
    }
    
    console.error('Please update both files to match and try again.');
    process.exit(1);
    
  } catch (error) {
    console.error('❌ Error parsing SOURCE_TOOLS:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
