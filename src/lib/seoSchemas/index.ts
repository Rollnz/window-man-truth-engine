/**
 * SEO Schema Generator - Modular Index
 * Re-exports all schema utilities for tree-shaking optimization
 * 
 * Import only what you need:
 * import { getBreadcrumbSchema } from '@/lib/seoSchemas';
 * 
 * This allows the bundler to tree-shake unused schema code per page.
 */

// Breadcrumb utilities
export { generateBreadcrumbSchema, getBreadcrumbSchema } from './breadcrumb';

// Organization & Service Business utilities
export { 
  generateServiceBusinessSchema,
  generateLocalBusinessSchema, 
  generateOrganizationSchema, 
  generateWebSiteSchema 
} from './localBusiness';

// Pillar page utilities
export { 
  generatePillarSchemaGraph, 
  getPillarHasPartReferences,
  PILLAR_SCHEMA_CONFIGS 
} from './pillar';

// Tool page utilities
export { 
  generateToolSchema, 
  generateFAQSchema, 
  generateHowToSchema,
  getStandardAuthorPublisher,
  getToolPageSchemas,
  TOOL_SCHEMAS 
} from './tool';

// Guide page utilities
export { getGuidePageSchemas, GUIDE_SCHEMAS } from './guide';

// Evidence/Case study utilities
export { 
  generateCreativeWorkSchema, 
  generateEvidenceLibrarySchemas,
  getAboutPageSchemas 
} from './evidence';
