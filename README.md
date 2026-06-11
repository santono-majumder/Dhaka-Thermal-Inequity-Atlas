# Dhaka Urban Surface Thermal Inequity Atlas

Ward-level surface heat island mapping, thermal equity scoring, and cooling
priority analysis for Dhaka City Corporation, Bangladesh (93 wards, 2016–2024)

---

## About This Project

Dhaka is one of the most densely populated and thermally stressed cities in
South Asia, yet no ward-level study had previously examined which specific
wards face the worst combination of surface heat, informal settlement density,
and green space loss — until this one.

This project maps surface Heat Island Intensity across all 93 wards of Dhaka
City Corporation using Landsat satellite data, builds a Thermal Equity Score
that combines heat, informality, and green deficit into a single ward-level
burden index, and produces a Cooling Priority map that identifies exactly
where tree-planting investment will benefit the most people.

All analysis runs entirely on free tools — Google Earth Engine, Google Colab,
and QGIS — with no paid software or local computing requirements.

---

## Research Question

Which wards of Dhaka City Corporation carry the greatest combined burden of
surface heat intensity, informal built-up density, and green space deficit —
and where should cooling investments go to reach the most thermally
vulnerable residents?

---

## Study Area

Dhaka City Corporation, Bangladesh. The study covers 93 wards based on the
pre-2016 DCC administrative boundary derived from the GADM Level 4 dataset
via the geoBoundaries ADM4 source. Ward numbers run from 1 to 92, plus
Ward 98 covering the Dhaka Cantonment area.

The 36 peripheral wards added to DNCC in the 2016 boundary expansion are
not included, as ward-level spatial data for those areas is not available in
any public geospatial database. These are newer peri-urban areas that carry
lower thermal burden than the established inner-city wards studied here.

---

## Data Sources

| Dataset | Source | Year | Resolution | Purpose |
|---|---|---|---|---|
| Landsat 8 and 9, Band ST_B10 | NASA and USGS via Google Earth Engine | 2016 and 2024 | 30 m | Surface temperature, Heat Island Intensity |
| Sentinel-2, Bands B8 and B4 | ESA Copernicus via Google Earth Engine | 2023 to 2024 | 10 m | NDVI green cover fraction per ward |
| GHSL BUILT-S | JRC and European Commission via GEE | 2020 | 100 m | Informal built-up surface proxy |
| WorldPop Bangladesh | WorldPop via Google Earth Engine | 2020 | 100 m | Population count per ward |
| dhaka_wards_final.shp | geoBoundaries ADM4, clipped and dissolved in QGIS | 2016 boundary | Vector | Ward spatial unit for all aggregations |

---

## How It Works

**Heat Island Intensity**
Each Landsat scene was converted from raw digital number to degrees Celsius
using the standard scale factor of 0.00341802 and offset of negative 124.15.
A cool reference zone was defined as all Sentinel-2 pixels with NDVI above
0.40 within a 15 km buffer around the ward boundary. Heat Island Intensity
for each ward equals the ward mean temperature minus the mean temperature
of that reference zone.

**Thermal Equity Score**
Three ward-level indicators were min-max normalised, converted to 0-to-1
ranks, and averaged with equal weight:
Heat Island Intensity rank + informal built-up rank + green deficit rank,
divided by 3. The result was validated against two alternative weighting
scenarios to confirm it is not sensitive to arbitrary weight choices.

**Cooling Priority Score**
Each ward was ranked by its combined score of heat intensity, green deficit,
and population size, then classified into five tiers from Very High to Very Low.
This answers where tree planting produces the most cooling for the most people.

**Healthcare Urgency Flag**
Wards that rank in the top 25 for equity burden and also sit farther from
a major hospital than the city average were flagged as Most Urgent. These
wards face compounded vulnerability that requires both environmental and
health planning responses.

**Statistical Validation**
Spearman rank correlation between ward-level informal built-up density and
the Thermal Equity Score returned rho of 0.493 with p less than 0.001,
confirming the index captures a real structural pattern, not a random one.

---

## Repository Structure

**GEE_Scripts/**
- 01_HII_Computation.js — Landsat HII computation for 2016 and 2024
- 02_Heat_Change_Map.js — Heat change raster, 2024 minus 2016
- 03_Ward_CSV_Export.js — Ward-level CSV export, 93 rows

**Python Notebook/**
- Project2_Thermal_Equity_Analysis.ipynb — Complete equity analysis pipeline

**Data/**
- ward_data.csv — Raw GEE export, 93 wards, 6 columns
- ward_final_rankings.csv — Full ranked results for all 93 wards
- ward_top25.csv — Top 25 most equity-burdened wards only

**Maps/**
- Map1_HII_2024.png — Surface Heat Island Intensity raster map
- Map2_ThermalEquityScore.png — Thermal Equity Burden choropleth map
- Map3_CoolingPriority.png — Cooling Priority and Healthcare Urgency map

---

## How to Reproduce This Study

**What you need**
- A Google account with Earth Engine approval: https://earthengine.google.com/signup
- Google Colab, free in any browser: https://colab.research.google.com
- QGIS 4.0.2 or later: https://qgis.org/en/site/forusers/download.html

**Step 1 — Run the GEE scripts**
Open https://code.earthengine.google.com and upload dhaka_wards_final.shp
as a GEE Asset. In each script, replace YOUR_GEE_USERNAME with your actual
GEE username. Run the three scripts in order, 01 then 02 then 03.
In the Tasks panel, click RUN next to each export task to send outputs
to your Google Drive.

**Step 2 — Run the Python analysis**
Open the notebook in Google Colab. Upload ward_data.csv from your GEE
export into the Colab session. Run all cells from top to bottom using
Runtime and then Run All. Download ward_final_rankings.csv and
ward_top25.csv from the session files panel when the notebook finishes.

**Step 3 — Make the maps in QGIS**
Load dhaka_wards_final.shp as a vector layer. Load ward_final_rankings.csv
as a delimited text layer with no geometry. Join the CSV to the shapefile
on the ward_num field. Load the two raster exports from GEE. Apply
symbology following the colour descriptions in each map file name.

---

## Key Results

- Citywide mean Heat Island Intensity: 2.77 degrees Celsius above the cool reference zone
- Ward-level HII range: 1.38 to 4.89 degrees Celsius, a spread of 3.51 degrees
- Most equity-burdened ward: Ward No-74, Score 0.87, NDVI fraction 0.013
- Top five equity-burdened wards: Ward 74, 60, 70, 65, and 71
- Wards classified Very High cooling priority: 19 wards, roughly 2.0 million residents
- Share of total population in Very High or High priority zones: 49.6 percent of 7.55 million
- Wards with dual urgency (top equity burden plus poor healthcare access): 7 wards
- Spearman correlation between informality and equity score: rho 0.493, p less than 0.001
- Robustness: core findings confirmed across all three weighting scenarios

---

## Limitations

The study covers 93 wards based on the pre-2016 Dhaka City Corporation
administrative boundary because no ward-level spatial data exists in any
open-access global geospatial database — including GADM, geoBoundaries,
HDX, and OpenStreetMap — for the 36 peripheral wards incorporated into
DNCC through the 2016 boundary expansion. These are recently urbanised
peri-urban zones with substantially lower built-up density and thermal
burden than the established inner-city wards analysed here, so their
absence does not compromise the identification of the highest-priority
wards. Incorporating these areas remains a recommended direction for
future work as boundary data becomes publicly accessible.

Surface temperature in this study is derived from Landsat Band ST_B10,
which captures thermal emission from ground and rooftop surfaces rather
than ambient air temperature at street level. This is the standard
measurement source and approach used across the urban heat island
literature worldwide and is the appropriate data type for comparing
spatial thermal exposure at ward scale.

No publicly available, verified, ward-level informal settlement map exists
for Dhaka City Corporation in any national or global database. The GHSL
BUILT-S surface product — developed and peer-reviewed by the Joint
Research Centre of the European Commission and validated across global
urban contexts — was used as the best available proxy for informal
built-up density. This reflects an existing gap in the open-data
landscape for informal urbanisation in Bangladesh.

Ward-level population counts are not publicly released by Bangladesh
national statistics at the administrative unit scale used in this study.
WorldPop 2020, the most widely used and independently validated gridded
population dataset in the global urban heat island and climate equity
literature, was used at 100-metre resolution. It represents the best
available spatial population source for Bangladesh and is consistent
with methodological practice in comparable published studies.

Healthcare accessibility was measured as Euclidean straight-line distance
from ward centroids to major hospital locations. This provides a
consistent and reproducible spatial approximation suitable for
city-scale comparative ranking. Travel-time modelling using road network
data and transport access patterns is identified as a productive
direction for future research.
---

## How to Cite

If you use any part of this code or data, please cite it as:

Majumder, S. (2024). Dhaka Urban Surface Thermal Inequity Atlas:
Ward-level surface heat island analysis and cooling priority mapping
for Dhaka City Corporation, Bangladesh. Department of Urban and Regional
Planning, Khulna University of Engineering and Technology, Bangladesh.
Available at: https://github.com/santono-majumder/Dhaka-Thermal-Inequity-Atlas

---

## Author

Santono Majumder,
Department of Urban and Regional Planning
Khulna University of Engineering and Technology-KUET, Bangladesh

---

## License

This project is released under the MIT License.
See the LICENSE file in this repository for full terms.
