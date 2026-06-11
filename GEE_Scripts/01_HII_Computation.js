// ============================================================
// SCRIPT 1: Heat Island Intensity (HII) — 2016 and 2024 [FINAL]
// Project: Dhaka Urban Surface Thermal Inequity Atlas
// Author: Santonu Majumder | Dept. of Urban & Regional Planning | KUET
// ============================================================
// FINAL FIX: Cool reference NDVI now computed from Landsat SR bands
// (SR_B5 = NIR, SR_B4 = Red) instead of Sentinel-2.
// This works reliably for any year including 2016.
// ============================================================

// ---- PART A: LOAD WARD ASSET ----

var wards = ee.FeatureCollection('users/Santono_Majumder/dhaka_wards_final');
Map.centerObject(wards, 11);
print('Step A — Total wards loaded (must be 93):', wards.size());

// ---- PART B: STUDY AREA AND REFERENCE RING ----

var studyArea     = wards.geometry();
var outerBuffer   = studyArea.buffer(15000);  // 15 km ring around the city
var referenceRing = outerBuffer.difference(studyArea); // ring outside the city

print('Step B — Study area and reference ring defined.');

// ---- PART C: HII COMPUTATION FUNCTION ----
// Uses Landsat SR bands for NDVI — no Sentinel-2 dependency at all

function computeHII(year, collectionID) {

  // March to May = pre-monsoon peak heat, fewer clouds
  var startDate = year + '-03-01';
  var endDate   = year + '-05-31';

  // Filter Landsat to Dhaka, March-May, under 25% cloud cover
  var landsatImages = ee.ImageCollection(collectionID)
    .filterBounds(studyArea)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 25));

  print('Landsat images for ' + year + ' (expect 2-8):', landsatImages.size());

  // Median composite removes cloud edges and noise
  var medianComposite = landsatImages.median();

  // ---- SURFACE TEMPERATURE TO CELSIUS ----
  // Official USGS Landsat C2L2 formula: Celsius = (DN × 0.00341802) + (-124.15)
  var lstCelsius = medianComposite.select('ST_B10')
                                  .multiply(0.00341802)
                                  .add(-124.15)
                                  .rename('LST_celsius');

  // ---- NDVI FROM LANDSAT SR BANDS (THE KEY FIX) ----
  // Using the same Landsat image for NDVI — no Sentinel-2 needed
  // SR_B5 = Near-Infrared band (Landsat 8 and 9)
  // SR_B4 = Red band (Landsat 8 and 9)
  // Landsat C2L2 SR scale factor formula: True Reflectance = (DN × 0.0000275) + (-0.2)
  // Scale factors must be applied BEFORE computing NDVI ratio

  var nir  = medianComposite.select('SR_B5').multiply(0.0000275).add(-0.2);
  var red  = medianComposite.select('SR_B4').multiply(0.0000275).add(-0.2);

  // NDVI = (NIR - Red) / (NIR + Red), clipped to reference ring area
  var ndvi = nir.subtract(red).divide(nir.add(red)).clip(referenceRing);

  // ---- COOL REFERENCE TEMPERATURE ----
  // Pixels with NDVI > 0.40 in the reference ring = dense vegetation = naturally cool
  var coolPixels = lstCelsius.updateMask(ndvi.gt(0.40)).clip(referenceRing);

  // Mean temperature of all cool vegetation pixels = the cool baseline
  var coolMeanResult = coolPixels.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: referenceRing,
    scale: 30,
    maxPixels: 1e10,
    bestEffort: true
  });

  var coolMeanTemp = ee.Number(coolMeanResult.get('LST_celsius'));
  // Expected: 28°C to 40°C for Bangladesh in March-May
  print('Cool reference temperature for ' + year + ' (°C, expect 28-40°C):', coolMeanTemp);

  // ---- HEAT ISLAND INTENSITY ----
  // HII = surface temperature minus cool reference baseline
  // Positive = hotter than reference (expected in city)
  var hii = lstCelsius.subtract(coolMeanTemp).clip(studyArea).rename('HII');

  return hii;
}

// ---- PART D: COMPUTE HII FOR BOTH YEARS ----

print('--- Computing 2016 HII using Landsat 8 ---');
var hii_2016 = computeHII('2016', 'LANDSAT/LC08/C02/T1_L2');

print('--- Computing 2024 HII using Landsat 9 ---');
var hii_2024 = computeHII('2024', 'LANDSAT/LC09/C02/T1_L2');
// Landsat 9 fallback if needed: var hii_2024 = computeHII('2024', 'LANDSAT/LC08/C02/T1_L2');

// ---- PART E: DISPLAY ON MAP ----

var hiiPalette = {
  min: -1,
  max: 7,
  palette: ['#313695','#4575b4','#74add1','#abd9e9','#e0f3f8',
            '#ffffbf','#fee090','#fdae61','#f46d43','#d73027','#a50026']
};

// 2016 layer off by default — toggle in Layers panel (top-right of map)
Map.addLayer(hii_2016, hiiPalette, 'HII 2016 (Landsat 8)', false);
// 2024 layer on by default
Map.addLayer(hii_2024, hiiPalette, 'HII 2024 (Landsat 9)', true);
// Ward boundaries in black
Map.addLayer(wards, {color: 'black'}, 'Ward Boundaries', true, 0.6);

// ---- PART F: PRINT MEAN HII RESULTS ----

var meanHII_2016 = hii_2016.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e10,
  bestEffort: true
});

var meanHII_2024 = hii_2024.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e10,
  bestEffort: true
});

print('==========================================');
print('RESULTS — BOTH MUST BE POSITIVE NUMBERS:');
print('Mean HII 2016 (°C above cool reference):', meanHII_2016);
print('Mean HII 2024 (°C above cool reference):', meanHII_2024);
print('');
print('SUCCESS CHECKLIST:');
print('  Both numbers are positive = city is hotter than reference ✓');
print('  Expected range: 2.0 to 6.0 degrees Celsius');
print('  2024 slightly higher than 2016 = warming trend ✓');
print('  Map shows RED/ORANGE in city centre ✓');
print('  Map shows BLUE for parks and rivers ✓');
print('==========================================');