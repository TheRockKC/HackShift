// HackShift Digital Agriculture Platform Type Definitions

export type UserRole = 'farmer' | 'buyer' | 'machinery_provider' | 'admin';
export type SupportedLanguage = 'en' | 'hi' | 'pa';

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  state?: string;
  district?: string;
  preferredLanguage?: SupportedLanguage;
  // Farmer specific fields
  farmLocation?: string;
  farmSizeAcres?: number;
  soilType?: string;
  irrigationSource?: string;
  mainCrops?: string[];
  annualIncomeCategory?: string;
  // Buyer specific fields
  businessName?: string;
  buyerType?: 'wholesaler' | 'retailer' | 'exporter' | 'processor' | 'fpo_buyer';
  cropsPurchased?: string[];
  requiredQuantityTons?: number;
  preferredQuality?: string;
  indicativePriceRange?: string;
}

export type SupportedCrop = 'tomato' | 'wheat' | 'rice';

export interface TopPrediction {
  class_name: string;
  score: number;
}

export interface DiseaseTreatmentGuide {
  disease_name?: string;
  condition?: string;
  severity?: string;
  preliminary_guidance?: string;
  symptoms?: string;
  organic_options?: string[];
  chemical_options?: string[];
  cultural_preventive_measures?: string[];
  cultural_practices?: string[];
  disclaimer?: string;
  source?: string;
}

export interface DiseaseDiagnosisResult {
  id: number;
  farm_id?: number | null;
  crop: SupportedCrop;
  predicted_class: string;
  confidence: number | string;
  top_predictions: TopPrediction[];
  treatment: DiseaseTreatmentGuide;
  needs_expert_review: boolean;
  guidance_available: boolean;
  image_reference?: string;
  score_interpretation: string;
  disclaimer: string;
  created_at: string;
}

export interface DiseaseDetectionHistoryItem {
  id: number;
  farm_id?: number | null;
  image_reference?: string;
  predicted_class: string;
  confidence: number | string;
  needs_expert_review: boolean;
  guidance_available: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: 'scheme' | 'camp' | 'booking' | 'offer' | 'disease' | 'irrigation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionTab?: string;
}

export interface MandiPriceItem {
  id: string;
  crop: string;
  variety: string;
  mandi: string;
  district: string;
  state: string;
  minPricePerQuintal: number;
  maxPricePerQuintal: number;
  modalPricePerQuintal: number;
  date: string;
  source: string;
}
