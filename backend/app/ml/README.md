# AnnData ML Asset Directory

This directory stores trained computer vision models, class index mappings, and treatment guidelines for the Crop Disease Detection service.

## Directory Structure

```
app/ml/
├── models/
│   ├── best_tomato_model.keras         # Tomato classification model (or best_tomato_finetuned.keras)
│   ├── wheat_mobilenetv2_finetuned.keras # Wheat classification model (MobileNetV2)
│   └── rice_mobilenetv2_best.keras     # Rice classification model (MobileNetV2)
├── labels/
│   ├── class_names.json                # Tomato class name mapping
│   ├── wheat_class_names.json          # Wheat class name mapping
│   └── rice_class_names.json           # Rice class name mapping
└── data/
    └── crop_treatment_guide.json       # Crop pathology and preliminary treatment recommendations
```

> **Note:** The `disease_service` supports looking for files in both the structured subfolders (`models/`, `labels/`, `data/`) and the root `app/ml/` directory.
