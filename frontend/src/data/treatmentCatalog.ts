// annData Agricultural Pathology Treatment & Pesticide Database
// Certified formulations matching ICAR and State Agricultural University recommendations

export interface DetailedTreatmentInfo {
  diseaseName: string;
  hindiName: string;
  pathogen: string;
  severity: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe';
  symptoms: string;
  primaryRecommendation: string;
  chemicalPesticides: {
    tradeName: string;
    activeIngredient: string;
    dosage: string;
    sprayInterval: string;
  }[];
  organicRemedies: {
    treatment: string;
    dosage: string;
    method: string;
  }[];
  culturalPractices: string[];
}

export const TREATMENT_CATALOG: Record<string, DetailedTreatmentInfo> = {
  // ==========================================
  // TOMATO DISEASES (10 Classes)
  // ==========================================
  'Tomato___Bacterial_spot': {
    diseaseName: 'Tomato Bacterial Spot',
    hindiName: 'टमाटर का जीवाणु धब्बा रोग',
    pathogen: 'Xanthomonas campestris pv. vesicatoria',
    severity: 'High',
    symptoms:
      'Small, water-soaked brown to black lesions with yellow halos on leaves, stems, and fruits. Lesions may cause leaf drop and sunscald on exposed fruit.',
    primaryRecommendation:
      'Avoid working in wet fields to prevent bacteria spread. Immediately spray copper bactericide combined with antibiotic formulation, and switch to drip irrigation.',
    chemicalPesticides: [
      {
        tradeName: 'Blitox / Blue Copper + Streptocycline',
        activeIngredient: 'Copper Oxychloride 50% WP + Streptomycin Sulfate + Tetracycline (90:10)',
        dosage: '2.5 g/L Copper Oxychloride + 1 g per 10 L water Streptocycline',
        sprayInterval: 'Apply at 10-12 day intervals at first sign of spots',
      },
      {
        tradeName: 'Kocide 2000',
        activeIngredient: 'Copper Hydroxide 53.8% DF',
        dosage: '1.5 g per Liter of water',
        sprayInterval: 'Every 7-10 days during warm, humid weather',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Pseudomonas fluorescens bio-spray',
        dosage: '5 g per Liter or 1 kg per acre',
        method: 'Foliar spray in late afternoon to establish beneficial bacterial barrier',
      },
      {
        treatment: 'Hot Water Seed Treatment',
        dosage: 'Water at 50°C (122°F) for 25 minutes',
        method: 'Treat seed before nursery sowing to eliminate seed-borne inoculum',
      },
    ],
    culturalPractices: [
      'Strictly avoid overhead sprinkler irrigation; use root-zone drip lines.',
      'Rogue out and burn severely infected seedlings in the nursery.',
      'Rotate with non-solanaceous crops (maize, pulses, wheat) for 2-3 years.',
    ],
  },

  'Tomato___Early_blight': {
    diseaseName: 'Tomato Early Blight',
    hindiName: 'टमाटर का अगेती झुलसा रोग',
    pathogen: 'Alternaria solani',
    severity: 'Moderate',
    symptoms:
      'Concentric ring spots ("target board" pattern) beginning on older lower leaves, surrounded by a distinct yellow chlorotic zone. Causes premature leaf defoliation.',
    primaryRecommendation:
      'Prune and safely destroy lower leaves touching wet soil. Apply contact or systemic fungicide before lesions reach middle canopy, and maintain mulch barrier.',
    chemicalPesticides: [
      {
        tradeName: 'Dithane M-45 / Indofil M-45',
        activeIngredient: 'Mancozeb 75% WP',
        dosage: '2.5 g per Liter of water (500 g per acre in 200 L water)',
        sprayInterval: 'Spray at 10-day intervals upon noticing lower leaf lesions',
      },
      {
        tradeName: 'Amistar Top',
        activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'High curative efficacy; spray twice at 14-day intervals',
      },
      {
        tradeName: 'Kavach',
        activeIngredient: 'Chlorothalonil 75% WP',
        dosage: '2.0 g per Liter of water',
        sprayInterval: 'Preventive broad-spectrum protectant',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Trichoderma viride Bio-Fungicide',
        dosage: '5 g/L foliar spray + 2.5 kg/acre in compost',
        method: 'Spray foliage and enrich root-zone compost to suppress soil-borne fungal spores',
      },
      {
        treatment: 'Pure Cold-Pressed Neem Oil (1500 ppm)',
        dosage: '5 ml/L with 1 ml liquid soap emulsifier',
        method: 'Spray weekly on both upper and lower leaf surfaces',
      },
    ],
    culturalPractices: [
      'Prune lower foliage up to 25 cm from ground to stop soil-splash infection.',
      'Apply straw or plastic mulch beneath plants to prevent rain splash.',
      'Stake plants securely to improve air ventilation and speed up leaf drying.',
    ],
  },

  'Tomato___Late_blight': {
    diseaseName: 'Tomato Late Blight',
    hindiName: 'टमाटर का पछेती झुलसा रोग',
    pathogen: 'Phytophthora infestans',
    severity: 'Severe',
    symptoms:
      'Large, irregular dark water-soaked lesions that rapidly turn blackish-brown with white fungal downy mildew growth on leaf undersides in cool, foggy, humid conditions.',
    primaryRecommendation:
      'Extremely destructive and fast-spreading emergency! Immediately spray systemic anti-oomycete fungicide. Discontinue all overhead watering and isolate the field.',
    chemicalPesticides: [
      {
        tradeName: 'Ridomil Gold MZ',
        activeIngredient: 'Metalaxyl-M 4% + Mancozeb 64% WP',
        dosage: '2.5 g per Liter of water',
        sprayInterval: 'Spray immediately upon detection; repeat in 10-12 days',
      },
      {
        tradeName: 'Curzate M-8',
        activeIngredient: 'Cymoxanil 8% + Mancozeb 64% WP',
        dosage: '2.0 g per Liter of water',
        sprayInterval: 'Rapid penetrant action; spray twice at 8-day intervals',
      },
      {
        tradeName: 'Acrobat',
        activeIngredient: 'Dimethomorph 50% WP',
        dosage: '1.0 g per Liter of water',
        sprayInterval: 'Anti-sporulant translaminar fungicide',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Freshly Prepared Bordeaux Mixture (1%)',
        dosage: '1 kg Copper Sulfate + 1 kg Slaked Lime in 100 L water',
        method: 'Thorough preventive canopy spray prior to rain or fog events',
      },
      {
        treatment: 'Bacillus subtilis Bio-Protective Spray',
        dosage: '4 g per Liter of water',
        method: 'Apply as early preventive spray before disease outbreak occurs',
      },
    ],
    culturalPractices: [
      'Destroy and burn completely infected vines; never add them to compost.',
      'Ensure wide spacing between rows to enhance air flow and leaf drying.',
      'Do not cultivate tomatoes adjacent to potato fields sharing late blight.',
    ],
  },

  'Tomato___Leaf_Mold': {
    diseaseName: 'Tomato Leaf Mold',
    hindiName: 'टमाटर का लीफ मोल्ड (फफूंद)',
    pathogen: 'Passalora fulva (Cladosporium fulvum)',
    severity: 'Moderate',
    symptoms:
      'Pale green or yellowish spots with diffuse margins on upper leaf surfaces, accompanied by olive-green to grayish velvety mold on the corresponding lower surfaces.',
    primaryRecommendation:
      'Improve canopy ventilation and manage relative humidity. Spray protective fungicide and prune dense central suckers.',
    chemicalPesticides: [
      {
        tradeName: 'Score 250 EC',
        activeIngredient: 'Difenoconazole 25% EC',
        dosage: '0.8 to 1.0 ml per Liter of water',
        sprayInterval: 'Apply at 10-14 day intervals',
      },
      {
        tradeName: 'Contaf Plus',
        activeIngredient: 'Hexaconazole 5% SC',
        dosage: '2.0 ml per Liter of water',
        sprayInterval: 'Curative triazole fungicide for active mold control',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Potassium Bicarbonate Eco-Fungicide',
        dosage: '3 g per Liter + 0.5 ml vegetable oil',
        method: 'Foliar spray to alter leaf pH and inhibit fungal spore germination',
      },
      {
        treatment: 'Sulfur Dusting / Wettable Sulfur',
        dosage: '2.5 g per Liter of water',
        method: 'Spray in early morning, avoiding temperatures above 32°C',
      },
    ],
    culturalPractices: [
      'Increase air circulation by pruning dense lateral shoots.',
      'Keep relative greenhouse/polyhouse humidity below 80%.',
      'Water strictly at soil level in early mornings to prevent overnight dampness.',
    ],
  },

  'Tomato___Septoria_leaf_spot': {
    diseaseName: 'Septoria Leaf Spot',
    hindiName: 'टमाटर का सेप्टोरिया पत्ता धब्बा',
    pathogen: 'Septoria lycopersici',
    severity: 'Moderate',
    symptoms:
      'Numerous small, circular spots (1.5-3 mm) with dark brown margins and sunken grayish-white centers dotted with tiny black fruiting bodies (pycnidia).',
    primaryRecommendation:
      'Remove diseased lower leaves, apply copper or mancozeb protectant, and avoid walking through wet foliage.',
    chemicalPesticides: [
      {
        tradeName: 'Indofil Z-78 / Dithane M-45',
        activeIngredient: 'Mancozeb 75% WP or Zineb 75% WP',
        dosage: '2.5 g per Liter of water',
        sprayInterval: 'Apply at 7-10 day intervals during wet periods',
      },
      {
        tradeName: 'Blitox 50 WP',
        activeIngredient: 'Copper Oxychloride 50% WP',
        dosage: '2.5 to 3.0 g per Liter of water',
        sprayInterval: 'Thorough coverage of both upper and lower foliage',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Neem Seed Kernel Extract (NSKE 5%)',
        dosage: '50 g crushed neem seed powder steeped in 1 L water',
        method: 'Filter and spray weekly to suppress fungal sporulation',
      },
      {
        treatment: 'Trichoderma viride Bio-Agent',
        dosage: '5 g per Liter of water',
        method: 'Apply as evening foliar wash on spotted leaves',
      },
    ],
    culturalPractices: [
      'Carefully clip off and bag infected lower foliage before it drops to soil.',
      'Eradicate horsenettle and nightshade weeds which harbor Septoria.',
      'Rotate crops for at least 2 seasons away from tomatoes and peppers.',
    ],
  },

  'Tomato___Spider_mites Two-spotted_spider_mite': {
    diseaseName: 'Two-Spotted Spider Mite Infestation',
    hindiName: 'टमाटर की लाल मकड़ी (माइट)',
    pathogen: 'Tetranychus urticae (Arachnid Pest)',
    severity: 'High',
    symptoms:
      'Fine white, yellow, or bronze stippling speckles on leaf blades. Under heavy attack, delicate silky webbing covers leaf undersides and shoot tips; foliage turns yellow and crisps up.',
    primaryRecommendation:
      'Apply specific miticide/acaricide directed at leaf undersides. Wash canopy with high-pressure water spray to break webbing and suppress mite populations.',
    chemicalPesticides: [
      {
        tradeName: 'Oberon',
        activeIngredient: 'Spiromesifen 22.9% SC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Targets all mite developmental stages including eggs; repeat in 14 days',
      },
      {
        tradeName: 'Omite',
        activeIngredient: 'Propargite 57% EC',
        dosage: '2.0 ml per Liter of water',
        sprayInterval: 'Direct contact miticide with rapid knockdown action',
      },
      {
        tradeName: 'Vertimec',
        activeIngredient: 'Abamectin 1.9% EC',
        dosage: '0.5 to 0.75 ml per Liter of water',
        sprayInterval: 'Translaminar acaricide absorbed into leaf tissue',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Neem Oil Extract (3000 ppm)',
        dosage: '5 ml per Liter + 1 ml detergent',
        method: 'Direct spray at high pressure onto the undersides of leaves',
      },
      {
        treatment: 'Release of Predatory Mites',
        dosage: 'Phytoseiulus persimilis or Neoseiulus californicus',
        method: 'Natural biological predators that feed voraciously on pest spider mites',
      },
    ],
    culturalPractices: [
      'Avoid excessive chemical nitrogen fertilizer, which makes leaves rich in amino acids favored by mites.',
      'Hose down plants with clean water sprays in early morning to destroy mite webs.',
      'Control roadside dust which kills natural mite predators.',
    ],
  },

  'Tomato___Target_Spot': {
    diseaseName: 'Tomato Target Spot',
    hindiName: 'टमाटर का टारगेट स्पॉट',
    pathogen: 'Corynespora cassiicola',
    severity: 'Moderate',
    symptoms:
      'Pinpoint brown lesions expanding into circular spots with dark brown concentric rings, larger than Septoria lesions and without yellow chlorotic halo.',
    primaryRecommendation:
      'Improve plant spacing, avoid prolonged leaf moisture, and apply broad-spectrum systemic fungicide.',
    chemicalPesticides: [
      {
        tradeName: 'Custodia',
        activeIngredient: 'Azoxystrobin 11% + Tebuconazole 18.3% SC',
        dosage: '1.5 ml per Liter of water',
        sprayInterval: 'Apply at 12-day intervals',
      },
      {
        tradeName: 'Bravo / Kavach',
        activeIngredient: 'Chlorothalonil 75% WP',
        dosage: '2.0 g per Liter of water',
        sprayInterval: 'Preventive protective cover spray',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Liquid Copper Soap Spray',
        dosage: '2.5 ml per Liter of water',
        method: 'Spray evenly over foliage at onset of first spots',
      },
      {
        treatment: 'Trichoderma harzianum soil and foliar drench',
        dosage: '5 g/L',
        method: 'Apply in evening hours to protect leaf tissue',
      },
    ],
    culturalPractices: [
      'Maintain potassium levels to harden plant cell walls.',
      'Collect and remove crop debris immediately after harvest.',
      'Prune overlapping inner shoots to allow full sunlight exposure.',
    ],
  },

  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    diseaseName: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    hindiName: 'टमाटर का पीला पत्ता मरोड़ विषाणु',
    pathogen: 'Begomovirus (Transmitted by Whitefly Bemisia tabaci)',
    severity: 'Severe',
    symptoms:
      'Severe upward curling and cupping of leaflets, intense chlorosis (yellowing) between veins, stunted bushy plant growth, and massive flower drop with zero fruit set.',
    primaryRecommendation:
      'There is no cure for viral infection. Immediately rogue and destroy infected plants. Spray systemic insecticides to control the whitefly vector and install yellow sticky traps.',
    chemicalPesticides: [
      {
        tradeName: 'Confidor / Victor',
        activeIngredient: 'Imidacloprid 17.8% SL',
        dosage: '0.5 ml per Liter of water (100 ml per acre in 200 L)',
        sprayInterval: 'Controls whitefly vector populations; spray at 14-day intervals',
      },
      {
        tradeName: 'Actara',
        activeIngredient: 'Thiamethoxam 25% WG',
        dosage: '0.3 to 0.5 g per Liter of water',
        sprayInterval: 'Systemic neonicotinoid vector management',
      },
      {
        tradeName: 'Pegasus',
        activeIngredient: 'Diafenthiuron 50% WP',
        dosage: '1.25 g per Liter of water',
        sprayInterval: 'Controls nymph and adult whiteflies effectively',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Yellow Sticky Traps',
        dosage: '15 to 20 traps per acre at canopy height',
        method: 'Mass trap adult whiteflies to prevent virus transmission',
      },
      {
        treatment: 'Pure Neem Seed Extract (10,000 ppm)',
        dosage: '3 ml per Liter of water',
        method: 'Repels whiteflies and disrupts egg laying on leaf undersides',
      },
    ],
    culturalPractices: [
      'Install 40-50 mesh insect-proof netting over seedling nursery beds.',
      'Uproot and burn diseased plants into a sealed bag to stop whitefly feeding.',
      'Plant border barrier crops like maize, sorghum, or pearl millet (3-4 rows) around tomato fields.',
    ],
  },

  'Tomato___Tomato_mosaic_virus': {
    diseaseName: 'Tomato Mosaic Virus (ToMV)',
    hindiName: 'टमाटर का मोज़ेक विषाणु',
    pathogen: 'Tobamovirus (Mechanically Transmitted)',
    severity: 'High',
    symptoms:
      'Mottled light and dark green mosaic patterns on leaves, leaf distortion, "shoestring" fern-like thinning of foliage, and internal browning inside tomato fruits.',
    primaryRecommendation:
      'Mechanical transmission risk is high. Strictly disinfect hands and pruning tools with milk solution. Remove and incinerate infected plants. No chemical cure exists.',
    chemicalPesticides: [
      {
        tradeName: 'Trisodium Phosphate (TSP) Disinfectant',
        activeIngredient: 'TSP 10% solution or Non-Fat Dry Milk (20%)',
        dosage: 'Dip pruning knives, shears, and hands frequently',
        sprayInterval: 'Sanitation wash during all pruning and harvesting operations',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Skimmed Milk Spray',
        dosage: '100 g skim milk powder per Liter of water',
        method: 'Spray on healthy plants prior to field operations to neutralize mechanical virus particles',
      },
      {
        treatment: 'Boiled Compost Tea',
        dosage: 'Foliar application',
        method: 'Strengthens systemic plant immunity and vigor',
      },
    ],
    culturalPractices: [
      'Prohibit smoking, chewing, or handling tobacco near tomato plants.',
      'Always wash hands with soap or 20% dry milk solution before touching seedlings.',
      'Purchase certified virus-free seeds and plant resistant rootstocks.',
    ],
  },

  'Tomato___healthy': {
    diseaseName: 'Healthy Tomato Foliage',
    hindiName: 'स्वस्थ टमाटर की पत्ती',
    pathogen: 'None (Optimal Plant Health)',
    severity: 'None',
    symptoms:
      'Vibrant green color, firm leaf texture, no necrotic lesions, absence of chlorosis or curling, and clean uniform leaf margins.',
    primaryRecommendation:
      'Continue routine agronomic scouting, maintain balanced N-P-K nutrient schedule, and apply preventive organic neem spray every 15 days.',
    chemicalPesticides: [],
    organicRemedies: [
      {
        treatment: 'Preventive Neem Oil Spray (1500 ppm)',
        dosage: '3 ml per Liter of water every 15 days',
        method: 'Maintains protective natural barrier against sucking pests and spores',
      },
      {
        treatment: 'Balanced NPK (19:19:19) Foliar Nutrition',
        dosage: '4 g per Liter of water',
        method: 'Spray every 2 weeks during vegetative and flowering stages',
      },
    ],
    culturalPractices: [
      'Maintain regular drip irrigation without causing waterlogging.',
      'Scout field early in the morning twice a week for early pest detection.',
      'Ensure balanced potassium and calcium nutrition to prevent blossom end rot.',
    ],
  },

  // ==========================================
  // WHEAT DISEASES (8 Classes)
  // ==========================================
  'wheat_yellow_rust': {
    diseaseName: 'Wheat Yellow / Stripe Rust',
    hindiName: 'गेहूं का पीला रतुआ (हल्दी रोग)',
    pathogen: 'Puccinia striiformis f. sp. tritici',
    severity: 'Severe',
    symptoms:
      'Bright yellow to orange pustules (uredinia) arranged in distinct linear stripes along the leaf veins, resembling turmeric powder when rubbed on fingers. Causes severe grain shriveling.',
    primaryRecommendation:
      'Emergency agronomic priority! Spray systemic triazole fungicide at first notice of yellow pustules. Delaying treatment by a week can destroy 40-60% of crop yield.',
    chemicalPesticides: [
      {
        tradeName: 'Tilt 250 EC',
        activeIngredient: 'Propiconazole 25% EC',
        dosage: '1.0 ml per Liter of water (200 ml per acre in 200 L water)',
        sprayInterval: 'Spray immediately upon detection; repeat once after 15 days if cool weather persists',
      },
      {
        tradeName: 'Nativo 75 WG',
        activeIngredient: 'Tebuconazole 50% + Trifloxystrobin 25% WG',
        dosage: '0.6 g per Liter of water (120 g per acre in 200 L water)',
        sprayInterval: 'Dual-action systemic protectant and curative',
      },
      {
        tradeName: 'Folicur',
        activeIngredient: 'Tebuconazole 25.9% EC',
        dosage: '1.25 ml per Liter of water',
        sprayInterval: 'Rapid systemic xylem translocation to arrest pustule expansion',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Trichoderma harzianum Foliar Bio-Shield',
        dosage: '5 g per Liter of water',
        method: 'Spray at initial localized patch appearance',
      },
      {
        treatment: 'Neem Extract + Cow Urine Slurry',
        dosage: '5% fermented solution',
        method: 'Traditional bio-enhancer sprayed in early morning',
      },
    ],
    culturalPractices: [
      'Scout North-Western Plains fields weekly from December through February.',
      'Sow recommended rust-resistant varieties like DBW-187, DBW-303, HD-3226, or PBW-725.',
      'Avoid excessive nitrogen fertilizer which causes soft, rust-susceptible leaf tissue.',
    ],
  },

  'wheat_brown_rust': {
    diseaseName: 'Wheat Brown / Leaf Rust',
    hindiName: 'गेहूं का भूरा रतुआ रोग',
    pathogen: 'Puccinia triticina (Puccinia recondita)',
    severity: 'High',
    symptoms:
      'Small, round to oval reddish-brown to orange pustules scattered randomly across the upper leaf blade (not in distinct lines like yellow rust). Leaves mature prematurely and dry up.',
    primaryRecommendation:
      'Spray systemic triazole fungicide as soon as scattered brown pustules appear on flag leaves to protect grain filling.',
    chemicalPesticides: [
      {
        tradeName: 'Tilt 25 EC / Bumper',
        activeIngredient: 'Propiconazole 25% EC',
        dosage: '1.0 ml per Liter of water (200 ml per acre)',
        sprayInterval: 'Apply upon first appearance of pustules on upper leaves',
      },
      {
        tradeName: 'Dithane M-45',
        activeIngredient: 'Mancozeb 75% WP',
        dosage: '2.5 g per Liter of water (500 g per acre)',
        sprayInterval: 'Effective preventive contact spray',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Pseudomonas fluorescens Bio-Agent',
        dosage: '5 g per Liter of water',
        method: 'Spray early in the morning during humid conditions',
      },
      {
        treatment: 'Bio-Fungicide Trichoderma viride',
        dosage: '5 g per Liter of water',
        method: 'Foliar application to compete with rust urediniospores',
      },
    ],
    culturalPractices: [
      'Plant before November 15 to escape high temperature-rust development in late spring.',
      'Apply balanced N-P-K (120:60:40 kg/ha); avoid excess nitrogen top-dressing.',
      'Grow certified rust-resistant wheat cultivars.',
    ],
  },

  'wheat_black_rust': {
    diseaseName: 'Wheat Black / Stem Rust',
    hindiName: 'गेहूं का काला / तना रतुआ रोग',
    pathogen: 'Puccinia graminis f. sp. tritici',
    severity: 'Severe',
    symptoms:
      'Large, elongated reddish-brown to black pustules rupturing the epidermis of stems, leaf sheaths, and heads. Severe lodging and complete crop loss can occur.',
    primaryRecommendation:
      'Immediate chemical intervention required. Apply systemic triazole fungicide to protect stems against lodging and catastrophic yield failure.',
    chemicalPesticides: [
      {
        tradeName: 'Tilt / Result',
        activeIngredient: 'Propiconazole 25% EC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Immediate application at first stem pustule',
      },
      {
        tradeName: 'Tebuconazole 25.9% EC',
        activeIngredient: 'Tebuconazole 25.9% EC',
        dosage: '1.25 ml per Liter of water',
        sprayInterval: 'Repeat after 14 days if warm weather continues',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Trichoderma harzianum Seed Treatment & Spray',
        dosage: '4 g/kg seed + 5 g/L spray',
        method: 'Biological seed coating and early canopy spray',
      },
    ],
    culturalPractices: [
      'Eradicate wild barberry bushes (alternate host of stem rust) near field borders.',
      'Sow early-maturing resistant wheat cultivars.',
      'Harvest early if late-season infection threatens stem strength.',
    ],
  },

  'wheat_blast': {
    diseaseName: 'Wheat Blast',
    hindiName: 'गेहूं का ब्लास्ट रोग',
    pathogen: 'Magnaporthe oryzae (Triticum pathotype)',
    severity: 'Severe',
    symptoms:
      'Bleached, straw-colored spikelets and heads while the lower stem remains green. Complete spikelet sterility occurs above the point of infection on the rachis.',
    primaryRecommendation:
      'High quarantine alert! Notify local agriculture department immediately. Spray preventive systemic strobilurin or triazole fungicide at heading stage.',
    chemicalPesticides: [
      {
        tradeName: 'Nativo 75 WG',
        activeIngredient: 'Tebuconazole 50% + Trifloxystrobin 25% WG',
        dosage: '0.6 g per Liter of water',
        sprayInterval: 'Apply at boot to heading stage as preventive protection',
      },
      {
        tradeName: 'Baan / Beam',
        activeIngredient: 'Tricyclazole 75% WP',
        dosage: '0.6 g per Liter of water',
        sprayInterval: 'Effective blast-specific systemic fungicide',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Certified Hot Water Seed Disinfection',
        dosage: '52°C for 15 minutes',
        method: 'Destroys seed-borne blast fungal mycelium before planting',
      },
      {
        treatment: 'Pseudomonas fluorescens Seed Treatment',
        dosage: '10 g per kg seed',
        method: 'Colonizes seed coat and suppresses spore germination',
      },
    ],
    culturalPractices: [
      'Strictly use certified, inspected disease-free seed lots.',
      'Avoid overhead irrigation during flowering and heading stages.',
      'Burn or deeply plow under wheat and grass stubble after harvest.',
    ],
  },

  'wheat_fusarium_head_blight': {
    diseaseName: 'Fusarium Head Blight (Scab)',
    hindiName: 'गेहूं का फ्यूजेरियम हेड ब्लाइट (स्कैब)',
    pathogen: 'Fusarium graminearum',
    severity: 'High',
    symptoms:
      'Premature bleaching of spikelets on the head with salmon-pink or orange spore masses on the glumes. Grains become shriveled, chalky white, or pinkish (tombstone kernels) and contain mycotoxins.',
    primaryRecommendation:
      'Apply triazole fungicide at 50% flowering (anthesis). Do not consume or feed heavily infected grain to livestock due to dangerous DON (vomitoxin) contamination.',
    chemicalPesticides: [
      {
        tradeName: 'Prosaro 421 SC',
        activeIngredient: 'Prothioconazole 19% + Tebuconazole 19% SC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Target head canopy at 50% anthesis (flowering)',
      },
      {
        tradeName: 'Carbendazim 50% WP',
        activeIngredient: 'Carbendazim 50% WP',
        dosage: '1.5 g per Liter of water',
        sprayInterval: 'Spray at ear emergence stage',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Bacillus subtilis (Serenade)',
        dosage: '4 g per Liter of water',
        method: 'Apply directly onto wheat heads during flowering',
      },
    ],
    culturalPractices: [
      'Avoid rotating wheat directly after maize/corn, which is the primary overwintering host of Fusarium.',
      'Deeply plow and bury crop residues to accelerate microbial decomposition.',
      'Clean harvested grain using gravity tables to remove lightweight infected kernels.',
    ],
  },

  'wheat_powdery_mildew': {
    diseaseName: 'Wheat Powdery Mildew',
    hindiName: 'गेहूं का चूर्णिल आसिता (सफेद फफूंद)',
    pathogen: 'Blumeria graminis f. sp. tritici',
    severity: 'Moderate',
    symptoms:
      'Fluffy white to gray powdery fungal patches on the upper surface of leaves, sheaths, and stems. Later, tiny black specks (cleistothecia) form inside the gray patches.',
    primaryRecommendation:
      'Apply wettable sulfur or triazole fungicide if mildew spreads to the upper two leaves during stem elongation.',
    chemicalPesticides: [
      {
        tradeName: 'Sulfex 80 WP',
        activeIngredient: 'Wettable Sulfur 80% WP',
        dosage: '2.5 to 3.0 g per Liter of water (750 g per acre in 250 L)',
        sprayInterval: 'Economical, highly effective contact fungicide',
      },
      {
        tradeName: 'Contaf 5 EC',
        activeIngredient: 'Hexaconazole 5% EC',
        dosage: '1.5 ml per Liter of water',
        sprayInterval: 'Systemic curative spray; repeat after 14 days if needed',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Diluted Fresh Cow Milk / Whey Spray',
        dosage: '100 ml per Liter of water (10% solution)',
        method: 'Produces free radicals under sunlight that dismantle fungal mildew hyphae',
      },
      {
        treatment: 'Potassium Bicarbonate',
        dosage: '3 g per Liter of water',
        method: 'Alkaline spray that desiccates powdery mildew spores',
      },
    ],
    culturalPractices: [
      'Avoid high seeding rates; ensure adequate spacing to reduce canopy humidity.',
      'Avoid excessive nitrogen fertilization which produces lush, soft foliage.',
      'Sow resistant wheat cultivars.',
    ],
  },

  'wheat_smut': {
    diseaseName: 'Wheat Loose Smut',
    hindiName: 'गेहूं का खुला कंडुआ रोग',
    pathogen: 'Ustilago tritici',
    severity: 'High',
    symptoms:
      'Every spikelet in the wheat head is converted into a mass of powdery black sooty fungal chlamydospores enclosed in a delicate membrane that breaks open, leaving a bare rachis.',
    primaryRecommendation:
      'Loose smut is seed-borne! Treat seed with systemic carboxin fungicide before sowing. In standing crop, carefully pull out black smutted heads into a plastic bag and burn them.',
    chemicalPesticides: [
      {
        tradeName: 'Vitavax Power',
        activeIngredient: 'Carboxin 37.5% + Thiram 37.5% WS',
        dosage: '2.5 to 3.0 g per kg of wheat seed',
        sprayInterval: 'Seed dressing prior to sowing (100% control of internal seed infection)',
      },
      {
        tradeName: 'Raxil Easy',
        activeIngredient: 'Tebuconazole 6% FS',
        dosage: '0.33 ml per kg of wheat seed',
        sprayInterval: 'Advanced flowable systemic seed dressing',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Solar Heat Seed Treatment (Luthra Method)',
        dosage: 'Water soak + Bright summer sun drying',
        method: 'Soak wheat seeds in water for 4 hours (8 AM - 12 PM) on a hot May/June day, then spread thin on tarpaulin in direct sun for 4 hours. Destroys internal mycelium naturally.',
      },
      {
        treatment: 'Trichoderma viride Seed Coating',
        dosage: '4 g per kg seed',
        method: 'Mix with 10 ml jaggery water per kg seed as bio-protectant',
      },
    ],
    culturalPractices: [
      'Collect smutted heads in a plastic bag before wind disperses spores, then burn them away from the field.',
      'Never save seed from a field showing loose smut symptoms.',
      'Procure certified seeds from government seed corporations (NSC / HSDC / PUNSEED).',
    ],
  },

  'healthy_wheat': {
    diseaseName: 'Healthy Wheat Crop',
    hindiName: 'स्वस्थ गेहूं की फसल',
    pathogen: 'None (Optimal Crop Condition)',
    severity: 'None',
    symptoms:
      'Vibrant deep green foliage, upright sturdy tillers, clean leaf sheaths, absence of yellow or brown pustules, and well-formed spikes.',
    primaryRecommendation:
      'Maintain standard agronomic care. Ensure crucial irrigations at Crown Root Initiation (CRI at 21 days) and Flowering stage. Apply zinc sulfate if deficient.',
    chemicalPesticides: [],
    organicRemedies: [
      {
        treatment: 'Zinc Sulfate (ZnSO4 21%) Foliar Spray',
        dosage: '5 g Zinc Sulfate + 2.5 g Slaked Lime per Liter of water',
        method: 'Boosts wheat tillering, photosynthesis, and grain protein content',
      },
      {
        treatment: 'Bio-Fertilizer Azotobacter + PSB Spray',
        dosage: '250 ml per acre in 150 L water',
        method: 'Promotes natural nitrogen fixation and phosphorus solubilization',
      },
    ],
    culturalPractices: [
      'Scout field borders weekly during December to March for early rust spots.',
      'Irrigate during low-wind evening hours to prevent lodging.',
      'Maintain balanced weed management with timely hoeing or approved herbicides.',
    ],
  },

  // ==========================================
  // RICE / PADDY DISEASES (6 Classes)
  // ==========================================
  'Bacterial Leaf Blight': {
    diseaseName: 'Rice Bacterial Leaf Blight (BLB)',
    hindiName: 'धान का जीवाणु पत्ती झुलसा रोग',
    pathogen: 'Xanthomonas oryzae pv. oryzae',
    severity: 'Severe',
    symptoms:
      'Water-soaked lesions on leaf margins turning grayish-yellow with characteristic wavy/undulating edges. Droplets of bacterial ooze crust on leaves; severe "kresek" wilt causes tiller death.',
    primaryRecommendation:
      'Drain excess standing water from the field for 3-4 days. Withhold all nitrogen fertilizer until new leaves emerge clean. Spray copper bactericide with streptocycline.',
    chemicalPesticides: [
      {
        tradeName: 'Blitox 50 WP + Streptocycline',
        activeIngredient: 'Copper Oxychloride 50% WP + Streptomycin Sulfate + Tetracycline',
        dosage: '2.5 g Copper Oxychloride + 1.5 g Streptocycline per 10 L water',
        sprayInterval: 'Spray immediately; repeat after 10-12 days if disease persists',
      },
      {
        tradeName: 'Bactronol / Plantomycin',
        activeIngredient: 'Plantomycin 9% + Copper Sulfate',
        dosage: '1.0 g per Liter of water',
        sprayInterval: 'Systemic bactericide for vascular wilt suppression',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Pseudomonas fluorescens (Bio-Bactericide)',
        dosage: '5 g per Liter of water (or 1 kg per acre in sand mix)',
        method: 'Foliar spray in late afternoon and apply to root zone to colonize vascular tissue',
      },
      {
        treatment: 'Fresh Cow Dung Extract Spray',
        dosage: '2 kg fresh cow dung soaked in 10 L water, filtered through muslin cloth',
        method: 'Ancient validated spray rich in beneficial antagonistic bacteria',
      },
    ],
    culturalPractices: [
      'Drain standing field water for 3 to 4 days to dry out the bacterial micro-climate.',
      'Strictly avoid top-dressing with urea/nitrogen during disease spread.',
      'Do not clip leaf tips of rice seedlings during nursery transplanting.',
    ],
  },

  'Brown Spot': {
    diseaseName: 'Rice Brown Spot (Helminthosporium)',
    hindiName: 'धान का भूरा धब्बा रोग',
    pathogen: 'Bipolaris oryzae (Helminthosporium oryzae)',
    severity: 'Moderate',
    symptoms:
      'Small, oval to circular dark brown spots with a lighter gray center resembling sesame seeds. Associated with poor, nutrient-deficient or water-stressed soils (Bengal famine pathogen).',
    primaryRecommendation:
      'Check soil fertility: apply potassium (potash) and zinc. Apply contact or systemic fungicide to protect flag leaves and grain quality.',
    chemicalPesticides: [
      {
        tradeName: 'Saaf / Companion',
        activeIngredient: 'Carbendazim 12% + Mancozeb 63% WP',
        dosage: '2.0 g per Liter of water (400 g per acre in 200 L)',
        sprayInterval: 'Excellent dual contact + systemic protection; repeat in 12 days',
      },
      {
        tradeName: 'Hinosan',
        activeIngredient: 'Edifenphos 50% EC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Organophosphate fungicide highly specific for brown spot',
      },
      {
        tradeName: 'Indofil M-45',
        activeIngredient: 'Mancozeb 75% WP',
        dosage: '2.5 g per Liter of water',
        sprayInterval: 'Broad-spectrum protective foliar spray',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Trichoderma viride Seed Treatment',
        dosage: '5 g per kg seed + 5 g/L foliar spray',
        method: 'Coats seeds to prevent seed-borne seedling blight and leaf spots',
      },
      {
        treatment: 'Neem Cake Soil Application',
        dosage: '100 kg per acre mixed into main field soil',
        method: 'Enriches soil nutrients and releases natural nematicidal & antifungal compounds',
      },
    ],
    culturalPractices: [
      'Apply Muriate of Potash (MOP) @ 25 kg/acre to strengthen cell walls against fungal penetration.',
      'Maintain consistent water depth; avoid alternating severe drying and re-flooding.',
      'Treat paddy seeds before nursery sowing using hot water (52°C for 10 min) or bio-agents.',
    ],
  },

  'Leaf Blast': {
    diseaseName: 'Rice Blast (Leaf & Neck Blast)',
    hindiName: 'धान का ब्लास्ट / झुलसा रोग',
    pathogen: 'Magnaporthe oryzae (Pyricularia oryzae)',
    severity: 'Severe',
    symptoms:
      'Spindle-shaped or diamond-shaped lesions with pointed ends, gray/whitish center, and reddish-brown borders. In neck blast, the panicle neck turns blackish-brown and snaps off ("broken neck").',
    primaryRecommendation:
      'Major rice emergency! Spray blast-specific systemic tricyclazole fungicide immediately. Avoid excessive urea and maintain standing water in the paddy basin.',
    chemicalPesticides: [
      {
        tradeName: 'Beam 75 WP / Baan',
        activeIngredient: 'Tricyclazole 75% WP',
        dosage: '0.6 g per Liter of water (120 g per acre in 200 L)',
        sprayInterval: 'Gold standard blast fungicide; spray at tillering and repeat at panicle emergence',
      },
      {
        tradeName: 'Fuji-One',
        activeIngredient: 'Isoprothiolane 40% EC',
        dosage: '1.5 to 2.0 ml per Liter of water',
        sprayInterval: 'Curative and systemic action for both leaf and neck blast',
      },
      {
        tradeName: 'Amistar Top',
        activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Protects both canopy foliage and panicle neck',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Pseudomonas fluorescens Foliar Bio-Shield',
        dosage: '5 g per Liter of water (or 1 kg per acre in water)',
        method: 'Spray in early evening at active tillering and boot leaf stages',
      },
      {
        treatment: 'Panchagavya Organic Spray (3%)',
        dosage: '30 ml per Liter of water',
        method: 'Traditional cow-derived biological foliar stimulant that enhances immunity',
      },
    ],
    culturalPractices: [
      'Split nitrogen application into 3 or 4 doses; never apply high single doses of urea.',
      'Maintain 3-5 cm standing water in paddy fields during critical stages.',
      'Burn or compost stubble of blast-infected fields to destroy overwintering conidia.',
    ],
  },

  'Leaf scald': {
    diseaseName: 'Rice Leaf Scald',
    hindiName: 'धान का पत्ती स्कैल्ड रोग',
    pathogen: 'Microdochium oryzae (Rhynchosporium oryzae)',
    severity: 'Moderate',
    symptoms:
      'Lesions begin at leaf tips or margins as oblong water-soaked blotches that expand into large zonate bands of light brown and dark brown concentric chevron stripes.',
    primaryRecommendation:
      'Apply systemic triazole fungicide, avoid dense planting, and balance nitrogen with adequate potassium fertilization.',
    chemicalPesticides: [
      {
        tradeName: 'Tilt 25 EC',
        activeIngredient: 'Propiconazole 25% EC',
        dosage: '1.0 ml per Liter of water',
        sprayInterval: 'Apply upon appearance of chevron lesions on upper leaves',
      },
      {
        tradeName: 'Bavistin',
        activeIngredient: 'Carbendazim 50% WP',
        dosage: '1.0 to 1.5 g per Liter of water',
        sprayInterval: 'Broad-spectrum systemic control',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Copper Hydroxide Bio-Compatible Spray',
        dosage: '2.0 g per Liter of water',
        method: 'Protective foliar application before rains',
      },
      {
        treatment: 'Trichoderma viride Bio-Control',
        dosage: '5 g per Liter of water',
        method: 'Seed treatment and foliar spray',
      },
    ],
    culturalPractices: [
      'Use certified seeds free from seed-borne scald pathogen.',
      'Widen planting spacing (20 × 15 cm) to reduce microclimate humidity.',
      'Avoid high nitrogen rates which exacerbate scald severity.',
    ],
  },

  'Sheath Blight': {
    diseaseName: 'Rice Sheath Blight',
    hindiName: 'धान का शीथ ब्लाइट (तने का झुलसा)',
    pathogen: 'Rhizoctonia solani',
    severity: 'Severe',
    symptoms:
      'Greenish-gray, oval or irregular water-soaked spots on leaf sheaths near the waterline, expanding into snake-skin pattern lesions with dark brown margins. Fungus crawls up to the flag leaf.',
    primaryRecommendation:
      'Direct fungicide spray at the base of the rice hills near the waterline. Avoid dense canopy and drain standing water to allow air penetration.',
    chemicalPesticides: [
      {
        tradeName: 'Sheathmar 3L / Validacin',
        activeIngredient: 'Validamycin 3% L',
        dosage: '2.0 to 2.5 ml per Liter of water (400-500 ml per acre in 200 L)',
        sprayInterval: 'Highly specific antibiotic fungicide for Rhizoctonia; direct at stem base',
      },
      {
        tradeName: 'Contaf Plus / Hexzole',
        activeIngredient: 'Hexaconazole 5% SC',
        dosage: '2.0 ml per Liter of water (400 ml per acre)',
        sprayInterval: 'Systemic curative triazole with strong stem penetration',
      },
      {
        tradeName: 'Pulsor',
        activeIngredient: 'Thifluzamide 24% SC',
        dosage: '0.75 ml per Liter of water (150 ml per acre)',
        sprayInterval: 'Long-lasting premium sheath blight control',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Trichoderma harzianum Stem Base Drench',
        dosage: '10 g per Liter directed into hill base',
        method: 'Antagonistic fungus parasitizes Rhizoctonia sclerotia at soil surface',
      },
      {
        treatment: 'Neem Oil (10,000 ppm) + Karanj Oil',
        dosage: '3 ml per Liter of water',
        method: 'Direct spray into lower canopy',
      },
    ],
    culturalPractices: [
      'Avoid high planting density; maintain 20 × 15 cm spacing between hills.',
      'Skim off and discard floating sclerotia (mustard-seed like bodies) during puddling.',
      'Control weeds on field bunds which act as alternate hosts for Rhizoctonia.',
    ],
  },

  'Healthy Rice Leaf': {
    diseaseName: 'Healthy Rice / Paddy Foliage',
    hindiName: 'स्वस्थ धान की पत्ती',
    pathogen: 'None (Optimal Plant Health)',
    severity: 'None',
    symptoms:
      'Smooth, vibrant green leaves with sharp erect posture, clean leaf sheaths, and complete absence of water-soaked spots, blast lesions, or bacterial blight stripes.',
    primaryRecommendation:
      'Continue recommended package of practices. Maintain 2-5 cm water layer during tillering. Apply potash and zinc for grain formation.',
    chemicalPesticides: [],
    organicRemedies: [
      {
        treatment: 'Zinc Sulfate (21%) + Urea Foliar Spray',
        dosage: '5 g Zinc Sulfate + 10 g Urea per Liter of water',
        method: 'Prevents "Khaira" disease and promotes dark green chlorophyll synthesis',
      },
      {
        treatment: 'Bio-Fertilizer Azospirillum + PSB',
        dosage: '2 kg per acre mixed in 50 kg farm yard manure',
        method: 'Enhances nitrogen fixation and root development',
      },
    ],
    culturalPractices: [
      'Scout lower leaf sheaths weekly for early sheath blight spots.',
      'Apply split nitrogen doses at basal, active tillering, and panicle initiation.',
      'Maintain intermittent irrigation (Alternate Wetting and Drying) to save water.',
    ],
  },
};

/**
 * Intelligent helper to resolve treatment details for any class name
 */
export function getTreatmentForClass(className: string): DetailedTreatmentInfo {
  // Direct match
  if (TREATMENT_CATALOG[className]) {
    return TREATMENT_CATALOG[className];
  }

  // Normalize case, whitespace, underscores
  const cleanTarget = className.toLowerCase().replace(/___/g, '_').replace(/[\s-]+/g, '_').trim();

  for (const [key, val] of Object.entries(TREATMENT_CATALOG)) {
    const cleanKey = key.toLowerCase().replace(/___/g, '_').replace(/[\s-]+/g, '_').trim();
    if (cleanKey === cleanTarget) {
      return val;
    }
  }

  // Substring match
  for (const [key, val] of Object.entries(TREATMENT_CATALOG)) {
    const cleanKey = key.toLowerCase().replace(/___/g, '_').replace(/[\s-]+/g, '_').trim();
    if (cleanTarget.includes(cleanKey) || cleanKey.includes(cleanTarget)) {
      return val;
    }
  }

  // Fallback for healthy
  if (className.toLowerCase().includes('healthy')) {
    return TREATMENT_CATALOG['Tomato___healthy'];
  }

  // Safe generic fallback
  return {
    diseaseName: className.replace(/___/g, ' - ').replace(/_/g, ' '),
    hindiName: 'पादप रोग पहचान',
    pathogen: 'Uncataloged Pathological Microorganism',
    severity: 'Moderate',
    symptoms: 'Foliage exhibits abnormal color, spot lesions, or tissue necrosis.',
    primaryRecommendation:
      'Isolate affected plants and avoid overhead watering. Consult a certified agronomist at your nearest Krishi Vigyan Kendra (KVK) for physical field inspection before chemical application.',
    chemicalPesticides: [
      {
        tradeName: 'Broad-Spectrum Protectant (Mancozeb)',
        activeIngredient: 'Mancozeb 75% WP',
        dosage: '2.0 to 2.5 g per Liter of water',
        sprayInterval: 'Use only after confirming fungal etiology with local extension officer',
      },
    ],
    organicRemedies: [
      {
        treatment: 'Pure Neem Oil (1500 ppm)',
        dosage: '5 ml per Liter of water',
        method: 'Safe preventive biological spray for general pathogen and pest suppression',
      },
      {
        treatment: 'Trichoderma viride Bio-Agent',
        dosage: '5 g per Liter of water',
        method: 'Protects foliage against fungal spore colonization',
      },
    ],
    culturalPractices: [
      'Prune and destroy severely infected plant tissue.',
      'Ensure proper drainage to prevent stagnant water.',
      'Sanitize all pruning knives and tools.',
    ],
  };
}
