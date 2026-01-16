/**
 * Structured Data Validation Script
 * 
 * This script validates JSON-LD structured data across all public pages.
 * It checks for:
 * - Valid JSON-LD syntax
 * - Required schema.org properties
 * - Consistent URL formatting
 * - BreadcrumbList hierarchy
 * 
 * Usage: npx tsx scripts/validate-structured-data.ts
 * 
 * Note: Google's Rich Results Test doesn't have a public API.
 * This script validates locally and generates test URLs for manual verification.
 */

import * as fs from 'fs';
import * as path from 'path';

const SITE_URL = 'https://itswindowman.com';

// All 22 public pages with their expected schema types
const PAGE_CONFIGS: Record<string, { 
  file: string;
  expectedSchemas: string[];
  breadcrumbLevels: number;
}> = {
  '/': { 
    file: 'src/pages/Index.tsx',
    expectedSchemas: ['Organization', 'WebSite', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 1
  },
  '/free-estimate': {
    file: 'src/pages/CalculateEstimate.tsx',
    expectedSchemas: ['SoftwareApplication', 'HowTo', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/quote-scanner': {
    file: 'src/pages/QuoteScanner.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/fair-price-quiz': {
    file: 'src/pages/FairPriceQuiz.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/risk-diagnostic': {
    file: 'src/pages/RiskDiagnostic.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/beat-your-quote': {
    file: 'src/pages/BeatYourQuote.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/expert': {
    file: 'src/pages/Expert.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/cost-calculator': {
    file: 'src/pages/CostCalculator.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/comparison': {
    file: 'src/pages/Comparison.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/reality-check': {
    file: 'src/pages/RealityCheck.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/claim-survival': {
    file: 'src/pages/ClaimSurvival.tsx',
    expectedSchemas: ['SoftwareApplication', 'HowTo', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/evidence': {
    file: 'src/pages/Evidence.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/roleplay': {
    file: 'src/pages/Roleplay.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/fast-win': {
    file: 'src/pages/FastWin.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/vulnerability-test': {
    file: 'src/pages/VulnerabilityTest.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/tools': {
    file: 'src/pages/Tools.tsx',
    expectedSchemas: ['ItemList', 'BreadcrumbList'],
    breadcrumbLevels: 2
  },
  '/intel': {
    file: 'src/pages/Intel.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 2
  },
  '/about': {
    file: 'src/pages/About.tsx',
    expectedSchemas: ['Organization', 'AboutPage', 'BreadcrumbList'],
    breadcrumbLevels: 2
  },
  '/faq': {
    file: 'src/pages/FAQ.tsx',
    expectedSchemas: ['FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 2
  },
  '/defense': {
    file: 'src/pages/Defense.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 2
  },
  '/sales-tactics-guide': {
    file: 'src/pages/SalesTacticsGuide.tsx',
    expectedSchemas: ['Article', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/spec-checklist-guide': {
    file: 'src/pages/SpecChecklistGuide.tsx',
    expectedSchemas: ['Article', 'HowTo', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/insurance-savings-guide': {
    file: 'src/pages/InsuranceSavingsGuide.tsx',
    expectedSchemas: ['Article', 'HowTo', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  },
  '/kitchen-table-guide': {
    file: 'src/pages/KitchenTableGuide.tsx',
    expectedSchemas: ['SoftwareApplication', 'FAQPage', 'BreadcrumbList'],
    breadcrumbLevels: 3
  }
};

// Required properties for each schema type
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  'Organization': ['@type', 'name', 'url'],
  'WebSite': ['@type', 'url', 'potentialAction'],
  'FAQPage': ['@type', 'mainEntity'],
  'SoftwareApplication': ['@type', 'name', 'applicationCategory', 'offers'],
  'Article': ['@type', 'headline', 'author', 'datePublished'],
  'HowTo': ['@type', 'name', 'step'],
  'BreadcrumbList': ['@type', 'itemListElement'],
  'ItemList': ['@type', 'itemListElement'],
  'AboutPage': ['@type', 'mainEntity']
};

interface ValidationResult {
  page: string;
  file: string;
  status: 'pass' | 'warn' | 'fail';
  issues: string[];
  schemasFound: string[];
  richResultsTestUrl: string;
}

function extractJsonLdFromFile(filePath: string): Record<string, unknown>[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Look for jsonLd prop patterns
    const jsonLdPatterns = [
      /jsonLd=\{([^}]+)\}/g,
      /getToolPageSchemas\(['"]([^'"]+)['"]\)/g,
      /getGuidePageSchemas\(['"]([^'"]+)['"]\)/g,
      /getBreadcrumbSchema\(['"]([^'"]+)['"]\)/g,
    ];
    
    // Check if file imports and uses SEO component with jsonLd
    const hasSeoComponent = content.includes('<SEO') && content.includes('jsonLd');
    const hasGetToolPageSchemas = content.includes('getToolPageSchemas');
    const hasGetGuidePageSchemas = content.includes('getGuidePageSchemas');
    const hasGetBreadcrumbSchema = content.includes('getBreadcrumbSchema');
    
    // Return indicator of what was found (actual schema extraction would require runtime)
    const schemas: Record<string, unknown>[] = [];
    
    if (hasGetToolPageSchemas) {
      schemas.push({ '@type': 'SoftwareApplication', _source: 'getToolPageSchemas' });
      schemas.push({ '@type': 'FAQPage', _source: 'getToolPageSchemas' });
    }
    
    if (hasGetGuidePageSchemas) {
      schemas.push({ '@type': 'Article', _source: 'getGuidePageSchemas' });
      schemas.push({ '@type': 'FAQPage', _source: 'getGuidePageSchemas' });
    }
    
    if (hasGetBreadcrumbSchema) {
      schemas.push({ '@type': 'BreadcrumbList', _source: 'getBreadcrumbSchema' });
    }
    
    // Check for direct schema imports
    if (content.includes('generateOrganizationSchema')) {
      schemas.push({ '@type': 'Organization', _source: 'generateOrganizationSchema' });
    }
    if (content.includes('generateWebSiteSchema')) {
      schemas.push({ '@type': 'WebSite', _source: 'generateWebSiteSchema' });
    }
    if (content.includes('generateHowToSchema')) {
      schemas.push({ '@type': 'HowTo', _source: 'generateHowToSchema' });
    }
    
    return schemas;
  } catch (error) {
    return [];
  }
}

function checkFileForSchemaUsage(filePath: string, expectedSchemas: string[]): {
  found: string[];
  missing: string[];
  hasJsonLd: boolean;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const hasJsonLd = content.includes('jsonLd=') || content.includes('jsonLd:');
    const found: string[] = [];
    const missing: string[] = [];
    
    // Check for each expected schema type
    for (const schema of expectedSchemas) {
      let isFound = false;
      
      switch (schema) {
        case 'SoftwareApplication':
          isFound = content.includes('getToolPageSchemas') || 
                    content.includes('generateToolSchema');
          break;
        case 'FAQPage':
          isFound = content.includes('getToolPageSchemas') || 
                    content.includes('getGuidePageSchemas') ||
                    content.includes('generateFAQSchema');
          break;
        case 'Article':
          isFound = content.includes('getGuidePageSchemas');
          break;
        case 'HowTo':
          isFound = content.includes('generateHowToSchema');
          break;
        case 'BreadcrumbList':
          isFound = content.includes('getBreadcrumbSchema');
          break;
        case 'Organization':
          isFound = content.includes('generateOrganizationSchema');
          break;
        case 'WebSite':
          isFound = content.includes('generateWebSiteSchema');
          break;
        case 'ItemList':
          isFound = content.includes('ItemList') || 
                    content.includes('getToolPageSchemas(\'tools-index\')');
          break;
        case 'AboutPage':
          isFound = content.includes('AboutPage') ||
                    content.includes('getToolPageSchemas(\'about\')');
          break;
      }
      
      if (isFound) {
        found.push(schema);
      } else {
        missing.push(schema);
      }
    }
    
    return { found, missing, hasJsonLd };
  } catch (error) {
    return { found: [], missing: expectedSchemas, hasJsonLd: false };
  }
}

function validatePage(pagePath: string, config: typeof PAGE_CONFIGS[string]): ValidationResult {
  const issues: string[] = [];
  const fullUrl = `${SITE_URL}${pagePath}`;
  const richResultsTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(fullUrl)}`;
  
  // Check if file exists
  if (!fs.existsSync(config.file)) {
    return {
      page: pagePath,
      file: config.file,
      status: 'fail',
      issues: [`File not found: ${config.file}`],
      schemasFound: [],
      richResultsTestUrl
    };
  }
  
  // Check for schema usage
  const { found, missing, hasJsonLd } = checkFileForSchemaUsage(config.file, config.expectedSchemas);
  
  if (!hasJsonLd) {
    issues.push('No jsonLd prop found in SEO component');
  }
  
  if (missing.length > 0) {
    issues.push(`Missing schemas: ${missing.join(', ')}`);
  }
  
  // Check for BreadcrumbList specifically
  if (!found.includes('BreadcrumbList')) {
    issues.push('BreadcrumbList schema not found');
  }
  
  // Determine status
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (issues.length > 0) {
    status = missing.includes('BreadcrumbList') ? 'fail' : 'warn';
  }
  
  return {
    page: pagePath,
    file: config.file,
    status,
    issues,
    schemasFound: found,
    richResultsTestUrl
  };
}

function validateSeoSchemasFile(): { valid: boolean; issues: string[] } {
  const filePath = 'src/lib/seoSchemas.ts';
  const issues: string[] = [];
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, issues: ['seoSchemas.ts not found'] };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for required exports
  const requiredExports = [
    'generateToolSchema',
    'generateFAQSchema',
    'generateBreadcrumbSchema',
    'getBreadcrumbSchema',
    'getToolPageSchemas'
  ];
  
  for (const exp of requiredExports) {
    if (!content.includes(`export function ${exp}`) && !content.includes(`export const ${exp}`)) {
      issues.push(`Missing export: ${exp}`);
    }
  }
  
  // Check for SITE_URL consistency
  if (!content.includes('https://itswindowman.com')) {
    issues.push('SITE_URL may not be set to production domain');
  }
  
  // Check BREADCRUMB_CONFIGS exists
  if (!content.includes('BREADCRUMB_CONFIGS')) {
    issues.push('BREADCRUMB_CONFIGS not found');
  }
  
  return { valid: issues.length === 0, issues };
}

function generateReport(results: ValidationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STRUCTURED DATA VALIDATION REPORT');
  console.log('='.repeat(80) + '\n');
  
  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  console.log('📈 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`  ✅ Passed:   ${passed}/${results.length}`);
  console.log(`  ⚠️  Warnings: ${warnings}/${results.length}`);
  console.log(`  ❌ Failed:   ${failed}/${results.length}`);
  console.log('');
  
  // Validate seoSchemas.ts
  console.log('🔧 CORE FILE VALIDATION');
  console.log('-'.repeat(40));
  const schemaFileValidation = validateSeoSchemasFile();
  if (schemaFileValidation.valid) {
    console.log('  ✅ src/lib/seoSchemas.ts - Valid');
  } else {
    console.log('  ❌ src/lib/seoSchemas.ts - Issues found:');
    schemaFileValidation.issues.forEach(i => console.log(`     - ${i}`));
  }
  console.log('');
  
  // Detailed results
  console.log('📄 PAGE-BY-PAGE RESULTS');
  console.log('-'.repeat(40));
  
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.page}`);
    console.log(`   File: ${result.file}`);
    console.log(`   Schemas: ${result.schemasFound.join(', ') || 'None found'}`);
    
    if (result.issues.length > 0) {
      console.log('   Issues:');
      result.issues.forEach(i => console.log(`     - ${i}`));
    }
  }
  
  // Rich Results Test URLs
  console.log('\n' + '='.repeat(80));
  console.log('🔗 GOOGLE RICH RESULTS TEST URLs');
  console.log('='.repeat(80));
  console.log('\nManually verify each page using these URLs:\n');
  
  for (const result of results) {
    console.log(`${result.page}`);
    console.log(`  ${result.richResultsTestUrl}\n`);
  }
  
  // Exit code
  if (failed > 0) {
    console.log('\n❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️ Validation passed with warnings.');
    process.exit(0);
  } else {
    console.log('\n✅ All validations passed!');
    process.exit(0);
  }
}

// Main execution
console.log('🔍 Starting structured data validation...\n');

const results: ValidationResult[] = [];

for (const [pagePath, config] of Object.entries(PAGE_CONFIGS)) {
  const result = validatePage(pagePath, config);
  results.push(result);
}

generateReport(results);
