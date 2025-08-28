export interface Company {
  id: string;
  name: string;
  ticker?: string;
  sector: string;
  country: string;
  description?: string;
  website?: string;
  market_cap?: number;
  employees?: number;
  founded_year?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  company_id: string;
  location: GeoLocation;
  coordinates: [number, number];
  metadata: AssetMetadata;
  risk_scores: RiskScores;
  last_updated: Date;
}

export enum AssetType {
  MANUFACTURING = 'manufacturing',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  RETAIL = 'retail',
  DATA_CENTER = 'data_center',
  RENEWABLE_ENERGY = 'renewable_energy',
  EXTRACTION = 'extraction',
  OTHER = 'other',
}

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  address?: string;
  postal_code?: string;
}

export interface AssetMetadata {
  size_sqm?: number;
  energy_consumption_kwh?: number;
  water_consumption_m3?: number;
  waste_generation_tons?: number;
  certification_standards?: string[];
  last_audit_date?: Date;
}

export interface RiskScores {
  overall: number;
  climate: number;
  biodiversity: number;
  deforestation: number;
  water_stress: number;
  social: number;
  governance: number;
  last_calculated: Date;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  companies: PortfolioCompany[];
  total_value: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
  risk_summary: RiskSummary;
}

export interface PortfolioCompany {
  company_id: string;
  company: Company;
  weight: number;
  value: number;
  shares?: number;
  entry_date: Date;
}

export interface RiskSummary {
  overall_score: number;
  risk_distribution: Record<string, number>;
  top_risks: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  type: string;
  score: number;
  description: string;
  affected_companies: string[];
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: string;
  type: DatasetType;
  format: string;
  size_bytes: number;
  records_count: number;
  last_updated: Date;
  metadata: DatasetMetadata;
  status: DatasetStatus;
}

export enum DatasetType {
  FOREST_IQ = 'forest_iq',
  SPATIAL_FINANCE = 'spatial_finance',
  COMPANY_DATA = 'company_data',
  ESG_RATINGS = 'esg_ratings',
  CLIMATE_DATA = 'climate_data',
  BIODIVERSITY = 'biodiversity',
  OTHER = 'other',
}

export interface DatasetMetadata {
  schema?: Record<string, any>;
  sample_data?: any[];
  coverage?: {
    geographical?: string[];
    temporal?: {
      start: string;
      end: string;
    };
    companies?: number;
  };
  quality_metrics?: {
    completeness: number;
    accuracy: number;
    freshness: number;
  };
}

export enum DatasetStatus {
  ACTIVE = 'active',
  PROCESSING = 'processing',
  ERROR = 'error',
  ARCHIVED = 'archived',
}

export interface DataState {
  companies: Company[];
  assets: Asset[];
  portfolios: Portfolio[];
  datasets: Dataset[];
  selectedCompanies: string[];
  selectedPortfolio: string | null;
  filters: DataFilters;
  isLoading: boolean;
  error: string | null;
}

export interface DataFilters {
  sectors?: string[];
  countries?: string[];
  risk_threshold?: number;
  asset_types?: AssetType[];
  date_range?: {
    start: string;
    end: string;
  };
}
