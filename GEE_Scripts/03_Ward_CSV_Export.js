// ============================================================
// SCRIPT 3: Ward CSV Export [FINAL — TYPE ERROR FIXED]
// Author: Santonu Majumder | KUET
// ============================================================

// ---- SETUP ----
var wards         = ee.FeatureCollection('users/Santono_Majumder/dhaka_wards_final');
var studyArea     = wards.geometry();
var outerBuffer   = studyArea.buffer(15000);
var referenceRing = outerBuffer.difference(studyArea);

Map.centerObject(wards, 11);
print('Step 1 — Wards loaded (must be 93):', wards.size());

// ---- PART B: HII 2024 ----

var landsat_2024 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
  .filterBounds(studyArea)
  .filterDate('2024-03-01', '2024-05-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 25));

print('Step 2 — Landsat 9 images (expect 2-8):', landsat_2024.size());

var comp = landsat_2024.median();

// Surface temperature to Celsius
var lst = comp.select('ST_B10')
              .multiply(0.00341802)
              .add(-124.15)
              .rename('LST_celsius');

// NDVI from Landsat SR bands — no Sentinel-2 needed
var nir      = comp.select('SR_B5').multiply(0.0000275).add(-0.2);
var red      = comp.select('SR_B4').multiply(0.0000275).add(-0.2);
var ndvi_ref = nir.subtract(red).divide(nir.add(red)).clip(referenceRing);

// Cool reference temperature
var coolMean = ee.Number(
  lst.updateMask(ndvi_ref.gt(0.40)).clip(referenceRing)
  .reduceRegion({
    reducer:    ee.Reducer.mean(),
    geometry:   referenceRing,
    scale:      30,
    maxPixels:  1e10,
    bestEffort: true
  }).get('LST_celsius')
);

print('Step 3 — Cool reference temperature (°C, expect 28-40):', coolMean);

// HII image
var hii_2024 = lst.subtract(coolMean)
                  .clip(studyArea)
                  .rename('HII')
                  .unmask(0);

Map.addLayer(hii_2024,
  {min:-1, max:7, palette:['#313695','#74add1','#ffffbf','#f46d43','#a50026']},
  'HII 2024');
Map.addLayer(wards, {color:'black'}, 'Ward Boundaries', true, 0.5);

print('Step 4 — HII 2024 image ready.');

// ---- PART C: NDVI GREEN FRACTION ----

var s2_dry = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(studyArea)
  .filterDate('2023-11-01', '2024-02-28')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median();

var greenBinary = s2_dry.normalizedDifference(['B8', 'B4'])
                        .gt(0.30)
                        .unmask(0)
                        .rename('green_fraction');

print('Step 5 — NDVI green fraction image ready.');

// ---- PART D: WORLDPOP 2020 ----

var worldpop = ee.ImageCollection('WorldPop/GP/100m/pop')
  .filterDate('2020-01-01', '2020-12-31')
  .filter(ee.Filter.eq('country', 'BGD'))
  .first()
  .unmask(0);

print('Step 6 — WorldPop loaded. Bands:', worldpop.bandNames());

// ---- PART E: COMPUTE ALL METRICS WARD-BY-WARD ----

print('Step 7 — Computing metrics per ward...');

var finalTable = wards.map(function(ward) {

  var geom = ward.geometry();

  // ============================================================
  // THE FIX: ward_num in the shapefile is stored as TEXT ('84','01')
  // ee.Number() cannot take a String directly — use ee.Number.parse() instead
  // ee.Number.parse() safely converts text like '84' into number 84
  // ============================================================
  var wNum = ee.Number.parse(ee.String(ward.get('ward_num'))).int();

  // Zero-pad: 1 becomes '01', 9 becomes '09', 10 stays '10', 84 stays '84'
  var wStr = ee.Algorithms.If(
    wNum.lt(10),
    ee.String('0').cat(wNum.format()),
    wNum.format()
  );

  // METRIC 1: Mean HII per ward
  var mean_HII = hii_2024.reduceRegion({
    reducer:    ee.Reducer.mean(),
    geometry:   geom,
    scale:      30,
    maxPixels:  1e9,
    bestEffort: true
  }).get('HII');

  // METRIC 2: NDVI green fraction per ward
  var ndvi_green_fraction = greenBinary.reduceRegion({
    reducer:    ee.Reducer.mean(),
    geometry:   geom,
    scale:      10,
    maxPixels:  1e9,
    bestEffort: true
  }).get('green_fraction');

  // METRIC 3: Total population per ward
  var population = worldpop.reduceRegion({
    reducer:    ee.Reducer.sum(),
    geometry:   geom,
    scale:      100,
    maxPixels:  1e9,
    bestEffort: true
  }).get('population');

  // METRIC 4: Population density as informal proxy (people per km²)
  // High density in Dhaka = informal settlement indicator
  // Uses ward geometry + WorldPop — zero risk of collection failure
  var wardArea_km2  = geom.area(1).divide(1e6);
  var ghsl_informal = ee.Number(population).divide(wardArea_km2);

  // One clean row — 6 columns
  return ee.Feature(null, {
    'ward_num':            wStr,
    'shapeName':           ward.get('shapeName'),
    'mean_HII':            mean_HII,
    'ndvi_green_fraction': ndvi_green_fraction,
    'ghsl_informal':       ghsl_informal,
    'population':          population
  });

});

// ---- VERIFY ----
print('Step 8 — Row count (must be 93):', finalTable.size());
print('Step 9 — Preview first 5 rows (all columns must have numbers):',
      finalTable.limit(5));

// ---- EXPORT ----
Export.table.toDrive({
  collection:     finalTable,
  description:    'ward_data_csv_export',
  folder:         'Project2_Outputs',
  fileNamePrefix: 'ward_data',
  fileFormat:     'CSV',
  selectors: [
    'ward_num',
    'shapeName',
    'mean_HII',
    'ndvi_green_fraction',
    'ghsl_informal',
    'population'
  ]
});

print('================================================');
print('EXPORT QUEUED.');
print('Tasks tab → click RUN → wait 15-40 min');
print('drive.google.com → Project2_Outputs → download ward_data.csv');
print('');
print('VERIFY IN EXCEL:');
print('93 rows, no empty cells');
print('ward_num: 01 02 03...09 10...92 98');
print('mean_HII: numbers like 1.5, 2.8, 4.2');
print('ghsl_informal: numbers like 50000, 120000, 200000');
print('================================================');