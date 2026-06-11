# Dhaka Urban Surface Thermal Inequity Atlas

**Ward-level surface heat island analysis, thermal equity scoring, and 
cooling priority mapping for Dhaka City Corporation, Bangladesh 
(93 wards, 2016–2024)**

---

## Overview

This repository contains all code, data, and maps for the study:

> **"Urban Surface Thermal Inequity Atlas and Cooling Priority Mapping 
> for Dhaka City Corporation, Bangladesh"**

This is the first ward-level thermal equity analysis conducted for any 
Bangladeshi city. It identifies which of Dhaka's 93 wards face the highest 
compound burden of surface heat, informal built-up density, and green space 
deficit — and ranks every ward by where green infrastructure investment will 
produce the maximum cooling impact for the most vulnerable populations.

---

## Research Question

Which wards of Dhaka City Corporation face the highest combined burden of 
surface heat intensity, informal settlement density, and green space deficit — 
and where should cooling investments be directed to achieve the greatest 
benefit for the most vulnerable populations?

---

## Study Area

Dhaka City Corporation, Bangladesh — 93 wards representing the pre-2016 DCC 
administrative boundary (GADM Level 4 via geoBoundaries ADM4 dataset). 
Ward numbers 1–92 and Ward 98 (Dhaka Cantonment).

---

## Data Sources

| Dataset | Source | Year | Resolution | Use in Study |
|---|---|---|---|---|
| Landsat 8/9 Band ST_B10 | Google Earth Engine (NASA/USGS) | 2016, 2024 | 30 m | Surface temperature → HII |
| Sentinel-2 (B8, B4) | Google Earth Engine (ESA/Copernicus) | 2023–2024 | 10 m | NDVI green fraction per ward |
| GHSL BUILT-S | Google Earth Engine (JRC/EC) | 2020 | 100 m | Informal built-up surface proxy |
| WorldPop Bangladesh | WorldPop / Google Earth Engine | 2020 | 100 m | Population count per ward |
| dhaka_wards_final.shp | geoBoundaries ADM4 (QGIS spatial clip) | 2016 boundary | Vector | Ward spatial aggregation unit |

---

## Methods Summary

**Phase 1 — Heat Island Intensity (GEE)**
Landsat 8/9 ST_B10 converted to Celsius (scale factor: 0.00341802, 
offset: −124.15). Cool reference zone = Sentinel-2 pixels with NDVI > 0.40 
within a 15 km buffer outside the ward boundary. 
HII = ward pixel temperature − mean reference zone temperature.

**Phase 2 — Thermal Equity Score (Python)**
Three-input additive index: (HII rank + informal rank + green deficit rank) / 3.  
Validated across three weighting scenarios:  
- Scenario A: equal weights (0.33, 0.33, 0.33)  
- Scenario B: heat-heavy (0.50, 0.25, 0.25)  
- Scenario C: social-heavy (0.25, 0.50, 0.25)  

**Phase 3 — Cooling Priority Score (Python)**
(HII rank + green deficit rank + population rank) / 3, classified into 
five tiers (Very High → Very Low) by percentile cutoff.

**Phase 4 — Healthcare Urgency Flag (Python)**
Wards ranking in the top 25 for equity burden AND located farther than 
the city-average distance from major Dhaka healthcare facilities.

**Phase 5 — Validation**
Spearman rank correlation between informal built-up density and 
Thermal Equity Score: ρ = 0.493, p < 0.001 (n = 93).

---

## Repository Structure

Dhaka-Thermal-Inequity-Atlas/
├── README.md
├── LICENSE
├── gee_scripts/
│   ├── 01_HII_Computation.js          # Landsat HII for 2016 and 2024
│   ├── 02_Heat_Change_Map.js          # Heat change raster (2024 − 2016)
│   └── 03_Ward_CSV_Export.js          # Ward-level CSV export (93 rows)
├── python_analysis/
│   └── Project2_Thermal_Equity_Analysis.ipynb
├── data/
│   ├── ward_data.csv                  # Raw GEE export (93 wards, 6 columns)
│   ├── ward_final_rankings.csv        # Complete ranked results, all 93 wards
│   └── ward_top25.csv                 # Top 25 most equity-burdened wards
└── maps/
├── Map1_HII_2024.png              # Surface HII raster map
├── Map2_ThermalEquityScore.png    # Thermal Equity Burden choropleth
└── Map3_CoolingPriority.png       # Cooling Priority + Healthcare Urgency

---

## How to Reproduce

### Prerequisites
- Google Earth Engine access: https://earthengine.google.com/signup
- Google Colab: https://colab.research.google.com
- QGIS 4.0.2.: https://qgis.org/en/site/forusers/download.html

### Step 1 — Run GEE Scripts
1. Go to https://code.earthengine.google.com
2. Upload `dhaka_wards_final.shp` as a GEE Asset
3. In each script, replace `YOUR_GEE_USERNAME` with your GEE username
4. Run scripts in order: `01` → `02` → `03`
5. Click RUN in the Tasks panel to export outputs to Google Drive

### Step 2 — Run Python Analysis
1. Open `Project2_Thermal_Equity_Analysis.ipynb` in Google Colab
2. Upload `ward_data.csv` from your GEE export to the Colab session
3. Run all cells in order: Runtime → Run All
4. Download `ward_final_rankings.csv` and `ward_top25.csv` from the session

### Step 3 — Produce Maps in QGIS
1. Load `dhaka_wards_final.shp` (ward boundaries)
2. Join `ward_final_rankings.csv` to the shapefile on the `ward_num` field
3. Load raster exports from GEE
4. Apply symbology following the colour schemes described in the map files

---

## Key Findings

| Metric | Value |
|---|---|
| Citywide mean HII | 2.77°C above cool reference zone |
| Ward-level HII range | 1.38°C – 4.89°C (spread: 3.51°C) |
| Most equity-burdened ward | Ward No-74 (Score: 0.87, NDVI fraction: 0.013) |
| Wards classified Very High cooling priority | 19 wards (~2.0M residents) |
| Population in Very High or High priority zones | ~49.6% of 7.55M analyzed |
| Wards with dual urgency (equity + healthcare) | 7 wards |
| Spearman correlation (informality vs. equity score) | ρ = 0.493, p < 0.001 |
| Sensitivity robustness | Confirmed across all 3 weighting scenarios |

---

## Limitations

1. The study covers 93 wards of the pre-2016 DCC administrative boundary. 
   The 36 peripheral DNCC wards incorporated in 2016 are excluded due to 
   the absence of ward-level spatial data in publicly available geospatial databases.
2. Landsat ST_B10 measures land surface temperature, not ambient air temperature.
3. GHSL BUILT-S serves as an informal settlement density proxy, 
   not a verified slum boundary map.
4. WorldPop 2020 is a modelled population estimate, not a census count.
5. Healthcare distance is Euclidean (straight-line), not travel-time based.

---

## Citation

If you use this code or data in your research, please cite:

> Majumder, S. (2024). *Dhaka Urban Surface Thermal Inequity Atlas: 
> Ward-level surface heat island analysis and cooling priority mapping 
> for Dhaka City Corporation, Bangladesh (93 wards, 2016–2024)*. 
> Department of Urban and Regional Planning, Khulna University of 
> Engineering and Technology (KUET), Bangladesh. 
> GitHub: https://github.com/ShantonuMajumder/Dhaka-Thermal-Inequity-Atlas

---

## Author

**Santono Majumder**  
Department of Urban and Regional Planning  
Khulna University of Engineering and Technology (KUET), Khulna, Bangladesh

---

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for details.
