/**
 * Static Florida county data for personalization.
 *
 * Contains building code, storm stats, and pricing info used by
 * the slide-over panel variants and AI Q&A system prompts.
 */

export interface CountyData {
  /** Average annual storm-related insurance claims */
  avgStormClaims: number;
  /** Average cost per window opening (materials + labor) */
  avgWindowCostPerOpening: number;
  /** Whether a building permit is required for window replacement */
  permitRequired: boolean;
  /** HVHZ = High Velocity Hurricane Zone (Miami-Dade, Broward) */
  buildingCodeLevel: 'HVHZ' | 'standard';
  /** Most recent notable storm event */
  lastMajorStorm: string;
  /** Typical homeowner insurance discount range for impact windows */
  insuranceDiscount: string;
}

export const FLORIDA_COUNTY_DATA: Record<string, CountyData> = {
  'Miami-Dade': {
    avgStormClaims: 1240,
    avgWindowCostPerOpening: 950,
    permitRequired: true,
    buildingCodeLevel: 'HVHZ',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '20-35%',
  },
  'Broward': {
    avgStormClaims: 980,
    avgWindowCostPerOpening: 925,
    permitRequired: true,
    buildingCodeLevel: 'HVHZ',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '20-30%',
  },
  'Palm Beach': {
    avgStormClaims: 847,
    avgWindowCostPerOpening: 875,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '15-25%',
  },
  'Martin': {
    avgStormClaims: 420,
    avgWindowCostPerOpening: 850,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '15-25%',
  },
  'St. Lucie': {
    avgStormClaims: 510,
    avgWindowCostPerOpening: 840,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '15-25%',
  },
  'Indian River': {
    avgStormClaims: 380,
    avgWindowCostPerOpening: 830,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '12-20%',
  },
  'Monroe': {
    avgStormClaims: 620,
    avgWindowCostPerOpening: 1050,
    permitRequired: true,
    buildingCodeLevel: 'HVHZ',
    lastMajorStorm: 'Hurricane Irma (2017)',
    insuranceDiscount: '20-30%',
  },
  'Lee': {
    avgStormClaims: 890,
    avgWindowCostPerOpening: 820,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '15-25%',
  },
  'Collier': {
    avgStormClaims: 650,
    avgWindowCostPerOpening: 870,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '15-25%',
  },
  'Charlotte': {
    avgStormClaims: 720,
    avgWindowCostPerOpening: 810,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '12-20%',
  },
  'Sarasota': {
    avgStormClaims: 540,
    avgWindowCostPerOpening: 830,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '12-20%',
  },
  'Manatee': {
    avgStormClaims: 410,
    avgWindowCostPerOpening: 820,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '12-20%',
  },
  'Hillsborough': {
    avgStormClaims: 480,
    avgWindowCostPerOpening: 810,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '10-18%',
  },
  'Pinellas': {
    avgStormClaims: 520,
    avgWindowCostPerOpening: 820,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '12-20%',
  },
  'Brevard': {
    avgStormClaims: 610,
    avgWindowCostPerOpening: 810,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '12-20%',
  },
  'Volusia': {
    avgStormClaims: 440,
    avgWindowCostPerOpening: 800,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Milton (2024)',
    insuranceDiscount: '10-18%',
  },
  'Duval': {
    avgStormClaims: 350,
    avgWindowCostPerOpening: 790,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Matthew (2016)',
    insuranceDiscount: '10-15%',
  },
  'Orange': {
    avgStormClaims: 380,
    avgWindowCostPerOpening: 800,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '10-18%',
  },
  'Seminole': {
    avgStormClaims: 310,
    avgWindowCostPerOpening: 800,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '10-15%',
  },
  'Osceola': {
    avgStormClaims: 290,
    avgWindowCostPerOpening: 790,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Irma (2017)',
    insuranceDiscount: '10-15%',
  },
  'Polk': {
    avgStormClaims: 340,
    avgWindowCostPerOpening: 780,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Ian (2022)',
    insuranceDiscount: '10-15%',
  },
  'Pasco': {
    avgStormClaims: 370,
    avgWindowCostPerOpening: 800,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Idalia (2023)',
    insuranceDiscount: '10-18%',
  },
  'Escambia': {
    avgStormClaims: 530,
    avgWindowCostPerOpening: 780,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Sally (2020)',
    insuranceDiscount: '12-20%',
  },
  'Bay': {
    avgStormClaims: 680,
    avgWindowCostPerOpening: 790,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Michael (2018)',
    insuranceDiscount: '15-25%',
  },
  'Santa Rosa': {
    avgStormClaims: 420,
    avgWindowCostPerOpening: 780,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Sally (2020)',
    insuranceDiscount: '12-20%',
  },
  'Okaloosa': {
    avgStormClaims: 350,
    avgWindowCostPerOpening: 790,
    permitRequired: true,
    buildingCodeLevel: 'standard',
    lastMajorStorm: 'Hurricane Sally (2020)',
    insuranceDiscount: '10-18%',
  },
};

/**
 * Common Florida ZIP-to-county mapping (major population centers).
 * Falls back to Zippopotam.us API for ZIPs not in this static table.
 */
export const ZIP_TO_COUNTY: Record<string, string> = {
  // Miami-Dade
  '33101': 'Miami-Dade', '33109': 'Miami-Dade', '33125': 'Miami-Dade',
  '33126': 'Miami-Dade', '33127': 'Miami-Dade', '33128': 'Miami-Dade',
  '33129': 'Miami-Dade', '33130': 'Miami-Dade', '33131': 'Miami-Dade',
  '33132': 'Miami-Dade', '33133': 'Miami-Dade', '33134': 'Miami-Dade',
  '33135': 'Miami-Dade', '33136': 'Miami-Dade', '33137': 'Miami-Dade',
  '33138': 'Miami-Dade', '33139': 'Miami-Dade', '33140': 'Miami-Dade',
  '33141': 'Miami-Dade', '33142': 'Miami-Dade', '33143': 'Miami-Dade',
  '33144': 'Miami-Dade', '33145': 'Miami-Dade', '33146': 'Miami-Dade',
  '33147': 'Miami-Dade', '33149': 'Miami-Dade', '33150': 'Miami-Dade',
  '33154': 'Miami-Dade', '33155': 'Miami-Dade', '33156': 'Miami-Dade',
  '33157': 'Miami-Dade', '33158': 'Miami-Dade', '33160': 'Miami-Dade',
  '33161': 'Miami-Dade', '33162': 'Miami-Dade', '33165': 'Miami-Dade',
  '33166': 'Miami-Dade', '33167': 'Miami-Dade', '33168': 'Miami-Dade',
  '33169': 'Miami-Dade', '33170': 'Miami-Dade', '33172': 'Miami-Dade',
  '33173': 'Miami-Dade', '33174': 'Miami-Dade', '33175': 'Miami-Dade',
  '33176': 'Miami-Dade', '33177': 'Miami-Dade', '33178': 'Miami-Dade',
  '33179': 'Miami-Dade', '33180': 'Miami-Dade', '33181': 'Miami-Dade',
  '33182': 'Miami-Dade', '33183': 'Miami-Dade', '33184': 'Miami-Dade',
  '33185': 'Miami-Dade', '33186': 'Miami-Dade', '33187': 'Miami-Dade',
  '33189': 'Miami-Dade', '33190': 'Miami-Dade', '33193': 'Miami-Dade',
  '33194': 'Miami-Dade', '33196': 'Miami-Dade', '33199': 'Miami-Dade',
  // Broward
  '33004': 'Broward', '33009': 'Broward', '33019': 'Broward',
  '33020': 'Broward', '33021': 'Broward', '33023': 'Broward',
  '33024': 'Broward', '33025': 'Broward', '33026': 'Broward',
  '33027': 'Broward', '33028': 'Broward', '33029': 'Broward',
  '33060': 'Broward', '33062': 'Broward', '33063': 'Broward',
  '33064': 'Broward', '33065': 'Broward', '33066': 'Broward',
  '33067': 'Broward', '33068': 'Broward', '33069': 'Broward',
  '33071': 'Broward', '33073': 'Broward', '33076': 'Broward',
  '33301': 'Broward', '33304': 'Broward', '33305': 'Broward',
  '33306': 'Broward', '33308': 'Broward', '33309': 'Broward',
  '33311': 'Broward', '33312': 'Broward', '33313': 'Broward',
  '33314': 'Broward', '33315': 'Broward', '33316': 'Broward',
  '33317': 'Broward', '33319': 'Broward', '33321': 'Broward',
  '33322': 'Broward', '33323': 'Broward', '33324': 'Broward',
  '33325': 'Broward', '33326': 'Broward', '33327': 'Broward',
  '33328': 'Broward', '33330': 'Broward', '33331': 'Broward',
  '33332': 'Broward', '33334': 'Broward', '33351': 'Broward',
  // Palm Beach
  '33401': 'Palm Beach', '33403': 'Palm Beach', '33404': 'Palm Beach',
  '33405': 'Palm Beach', '33406': 'Palm Beach', '33407': 'Palm Beach',
  '33408': 'Palm Beach', '33409': 'Palm Beach', '33410': 'Palm Beach',
  '33411': 'Palm Beach', '33412': 'Palm Beach', '33413': 'Palm Beach',
  '33414': 'Palm Beach', '33415': 'Palm Beach', '33417': 'Palm Beach',
  '33418': 'Palm Beach', '33426': 'Palm Beach', '33428': 'Palm Beach',
  '33431': 'Palm Beach', '33432': 'Palm Beach', '33433': 'Palm Beach',
  '33434': 'Palm Beach', '33435': 'Palm Beach', '33436': 'Palm Beach',
  '33437': 'Palm Beach', '33444': 'Palm Beach', '33445': 'Palm Beach',
  '33446': 'Palm Beach', '33449': 'Palm Beach', '33458': 'Palm Beach',
  '33460': 'Palm Beach', '33461': 'Palm Beach', '33462': 'Palm Beach',
  '33463': 'Palm Beach', '33467': 'Palm Beach', '33469': 'Palm Beach',
  '33470': 'Palm Beach', '33472': 'Palm Beach', '33473': 'Palm Beach',
  '33476': 'Palm Beach', '33477': 'Palm Beach', '33478': 'Palm Beach',
  '33480': 'Palm Beach', '33483': 'Palm Beach', '33484': 'Palm Beach',
  '33486': 'Palm Beach', '33487': 'Palm Beach', '33496': 'Palm Beach',
  '33498': 'Palm Beach',
  // Lee
  '33901': 'Lee', '33903': 'Lee', '33904': 'Lee', '33905': 'Lee',
  '33907': 'Lee', '33908': 'Lee', '33909': 'Lee', '33912': 'Lee',
  '33913': 'Lee', '33914': 'Lee', '33916': 'Lee', '33917': 'Lee',
  '33919': 'Lee', '33920': 'Lee', '33921': 'Lee', '33922': 'Lee',
  '33924': 'Lee', '33928': 'Lee', '33931': 'Lee', '33936': 'Lee',
  '33956': 'Lee', '33957': 'Lee', '33966': 'Lee', '33967': 'Lee',
  '33971': 'Lee', '33972': 'Lee', '33973': 'Lee', '33974': 'Lee',
  '33976': 'Lee', '33990': 'Lee', '33991': 'Lee', '33993': 'Lee',
  // Collier
  '34102': 'Collier', '34103': 'Collier', '34104': 'Collier',
  '34105': 'Collier', '34108': 'Collier', '34109': 'Collier',
  '34110': 'Collier', '34112': 'Collier', '34113': 'Collier',
  '34114': 'Collier', '34116': 'Collier', '34117': 'Collier',
  '34119': 'Collier', '34120': 'Collier', '34134': 'Collier',
  '34135': 'Collier', '34140': 'Collier', '34141': 'Collier',
  '34142': 'Collier', '34145': 'Collier',
  // Hillsborough
  '33510': 'Hillsborough', '33511': 'Hillsborough', '33527': 'Hillsborough',
  '33534': 'Hillsborough', '33547': 'Hillsborough', '33549': 'Hillsborough',
  '33556': 'Hillsborough', '33558': 'Hillsborough', '33559': 'Hillsborough',
  '33569': 'Hillsborough', '33570': 'Hillsborough', '33572': 'Hillsborough',
  '33573': 'Hillsborough', '33578': 'Hillsborough', '33579': 'Hillsborough',
  '33584': 'Hillsborough', '33592': 'Hillsborough', '33594': 'Hillsborough',
  '33596': 'Hillsborough', '33602': 'Hillsborough', '33603': 'Hillsborough',
  '33604': 'Hillsborough', '33605': 'Hillsborough', '33606': 'Hillsborough',
  '33607': 'Hillsborough', '33609': 'Hillsborough', '33610': 'Hillsborough',
  '33611': 'Hillsborough', '33612': 'Hillsborough', '33613': 'Hillsborough',
  '33614': 'Hillsborough', '33615': 'Hillsborough', '33616': 'Hillsborough',
  '33617': 'Hillsborough', '33618': 'Hillsborough', '33619': 'Hillsborough',
  '33624': 'Hillsborough', '33625': 'Hillsborough', '33626': 'Hillsborough',
  '33629': 'Hillsborough', '33634': 'Hillsborough', '33635': 'Hillsborough',
  '33637': 'Hillsborough', '33647': 'Hillsborough',
  // Pinellas
  '33701': 'Pinellas', '33702': 'Pinellas', '33703': 'Pinellas',
  '33704': 'Pinellas', '33705': 'Pinellas', '33706': 'Pinellas',
  '33707': 'Pinellas', '33708': 'Pinellas', '33709': 'Pinellas',
  '33710': 'Pinellas', '33711': 'Pinellas', '33712': 'Pinellas',
  '33713': 'Pinellas', '33714': 'Pinellas', '33715': 'Pinellas',
  '33716': 'Pinellas', '33755': 'Pinellas', '33756': 'Pinellas',
  '33759': 'Pinellas', '33760': 'Pinellas', '33761': 'Pinellas',
  '33762': 'Pinellas', '33763': 'Pinellas', '33764': 'Pinellas',
  '33765': 'Pinellas', '33767': 'Pinellas', '33770': 'Pinellas',
  '33771': 'Pinellas', '33772': 'Pinellas', '33773': 'Pinellas',
  '33774': 'Pinellas', '33776': 'Pinellas', '33777': 'Pinellas',
  '33778': 'Pinellas', '33781': 'Pinellas', '33782': 'Pinellas',
  '33785': 'Pinellas', '33786': 'Pinellas',
  // Brevard
  '32901': 'Brevard', '32903': 'Brevard', '32904': 'Brevard',
  '32905': 'Brevard', '32907': 'Brevard', '32908': 'Brevard',
  '32909': 'Brevard', '32920': 'Brevard', '32922': 'Brevard',
  '32925': 'Brevard', '32926': 'Brevard', '32927': 'Brevard',
  '32931': 'Brevard', '32934': 'Brevard', '32935': 'Brevard',
  '32937': 'Brevard', '32940': 'Brevard', '32949': 'Brevard',
  '32950': 'Brevard', '32951': 'Brevard', '32952': 'Brevard',
  '32953': 'Brevard', '32955': 'Brevard', '32976': 'Brevard',
  // Orange
  '32789': 'Orange', '32792': 'Orange', '32801': 'Orange',
  '32803': 'Orange', '32804': 'Orange', '32805': 'Orange',
  '32806': 'Orange', '32807': 'Orange', '32808': 'Orange',
  '32809': 'Orange', '32810': 'Orange', '32811': 'Orange',
  '32812': 'Orange', '32814': 'Orange', '32817': 'Orange',
  '32818': 'Orange', '32819': 'Orange', '32820': 'Orange',
  '32821': 'Orange', '32822': 'Orange', '32824': 'Orange',
  '32825': 'Orange', '32826': 'Orange', '32827': 'Orange',
  '32828': 'Orange', '32829': 'Orange', '32831': 'Orange',
  '32832': 'Orange', '32833': 'Orange', '32835': 'Orange',
  '32836': 'Orange', '32837': 'Orange', '32839': 'Orange',
  '34734': 'Orange', '34747': 'Orange', '34760': 'Orange',
  '34761': 'Orange', '34786': 'Orange', '34787': 'Orange',
  // Duval
  '32202': 'Duval', '32204': 'Duval', '32205': 'Duval',
  '32206': 'Duval', '32207': 'Duval', '32208': 'Duval',
  '32209': 'Duval', '32210': 'Duval', '32211': 'Duval',
  '32212': 'Duval', '32216': 'Duval', '32217': 'Duval',
  '32218': 'Duval', '32219': 'Duval', '32220': 'Duval',
  '32221': 'Duval', '32222': 'Duval', '32223': 'Duval',
  '32224': 'Duval', '32225': 'Duval', '32226': 'Duval',
  '32227': 'Duval', '32228': 'Duval', '32233': 'Duval',
  '32234': 'Duval', '32244': 'Duval', '32246': 'Duval',
  '32250': 'Duval', '32254': 'Duval', '32256': 'Duval',
  '32257': 'Duval', '32258': 'Duval', '32266': 'Duval',
  '32277': 'Duval',
};

/** Default fallback data for unknown counties */
export const DEFAULT_COUNTY_DATA: CountyData = {
  avgStormClaims: 400,
  avgWindowCostPerOpening: 800,
  permitRequired: true,
  buildingCodeLevel: 'standard',
  lastMajorStorm: 'Hurricane Milton (2024)',
  insuranceDiscount: '10-20%',
};

/**
 * Lookup county data by county name.
 * Returns default data for unknown counties.
 */
export function getCountyData(county: string): CountyData {
  return FLORIDA_COUNTY_DATA[county] ?? DEFAULT_COUNTY_DATA;
}

/**
 * Lookup county name from ZIP code (static table only).
 * Returns undefined if ZIP is not in the static table.
 */
export function getCountyFromZip(zip: string): string | undefined {
  const clean = zip.replace(/\D/g, '').slice(0, 5);
  return ZIP_TO_COUNTY[clean];
}
