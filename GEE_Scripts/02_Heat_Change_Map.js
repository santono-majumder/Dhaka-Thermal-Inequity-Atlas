// ============================================================
// SCRIPT 2: Heat Change Map (2024 minus 2016) + Raster Exports [FINAL]
// Project: Dhaka Urban Surface Thermal Inequity Atlas
// Author: Santonu Majumder | Dept. of Urban & Regional Planning | KUET
// ============================================================
// FINAL FIX: Landsat SR NDVI for reference zone (same fix as Script 1)
// DRIVE NOTE: GEE creates 'Project2_Outputs' automatically — no manual setup needed.
// ============================================================

// ---- SETUP ----

var wards         = ee.FeatureCollection('users/Santono_Majumder/dhaka_wards_final');
var studyArea     = wards.geometry();
var outerBuffer   = studyArea.buffer(15000);
var referenceRing = outerBuffer.difference(studyArea);

Map.centerObject(wards, 11);
print('Wards loaded (must be 93):', wards.size());

// ---- HII FUNCTION (same Landsat-NDVI fix as Script 1) ----

function computeHII(year, collectionID) {
  var startDate = year + '-03-01';
  var endDate   = year + '-05-31';

  var landsatImages = ee.ImageCollection(collectionID)
    .filterBounds(studyArea)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 25));

  print('Images for ' + year + ':', landsatImages.size());

  var medianComposite = landsatImages.median();

  // Surface temperature to Celsius
  var lstCelsius = medianComposite.select('ST_B10')
                                  .multiply(0.00341802)
                                  .add(-124.15)
                                  .rename('LST_celsius');

  // NDVI from Landsat SR bands — no Sentinel-2 needed
  var nir  = medianComposite.select('SR_B5').multiply(0.0000275).add(-0.2);
  var red  = medianComposite.select('SR_B4').multiply(0.0000275).add(-0.2);
  var ndvi = nir.subtract(red).divide(nir.add(red)).clip(referenceRing);

  // Cool reference mean temperature
  var coolMean = ee.Number(
    lstCelsius.updateMask(ndvi.gt(0.40)).clip(referenceRing)
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: referenceRing,
      scale: 30,
      maxPixels: 1e10,
      bestEffort: true
    }).get('LST_celsius')
  );
  print('Reference temperature ' + year + ' (°C):', coolMean);

  return lstCelsius.subtract(coolMean).clip(studyArea).rename('HII');
}

// ---- COMPUTE HII FOR BOTH YEARS ----

print('--- Computing 2016 HII ---');
var hii_2016 = computeHII('2016', 'LANDSAT/LC08/C02/T1_L2');

print('--- Computing 2024 HII ---');
var hii_2024 = computeHII('2024', 'LANDSAT/LC09/C02/T1_L2');

// ---- HEAT CHANGE MAP ----

// Heat Change = 2024 HII minus 2016 HII
// Positive = got HOTTER, Negative = got COOLER, Zero = no change
var heatChange = hii_2024.subtract(hii_2016).clip(studyArea).rename('heat_change');

var avgChange = heatChange.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e10,
  bestEffort: true
});
print('Average heat change 2016 to 2024 (°C, positive = overall warming):', avgChange);

// ---- DISPLAY ON MAP ----

var hiiPalette    = {min:-1, max:7, palette:['#313695','#74add1','#ffffbf','#f46d43','#a50026']};
var changePalette = {min:-3, max:3, palette:['#2166ac','#92c5de','#f7f7f7','#f4a582','#b2182b']};

Map.addLayer(hii_2016,   hiiPalette,    'HII 2016',  false);
Map.addLayer(hii_2024,   hiiPalette,    'HII 2024',  false);
Map.addLayer(heatChange, changePalette, 'Heat Change (Red=Hotter, Blue=Cooler)', true);
Map.addLayer(wards, {color:'black'}, 'Ward Boundaries', true, 0.6);

// ---- EXPORT TO GOOGLE DRIVE ----
// GEE creates 'Project2_Outputs' automatically — do NOT create it manually.
// After running: Tasks panel → click RUN next to each of the two tasks.

Export.image.toDrive({
  image: hii_2024,
  description: 'HII_2024',
  folder: 'Project2_Outputs',
  fileNamePrefix: 'HII_2024',
  region: studyArea,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e10
});

Export.image.toDrive({
  image: heatChange,
  description: 'heat_change_2016_2024',
  folder: 'Project2_Outputs',
  fileNamePrefix: 'heat_change_2016_2024',
  region: studyArea,
  scale: 30,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e10
});

print('==========================================');
print('TWO EXPORT TASKS QUEUED.');
print('ACTION: Tasks panel → click blue RUN next to EACH task.');
print('WAIT: 10 to 30 minutes until both show DONE (green).');
print('THEN: drive.google.com → Project2_Outputs → download both .tif files.');
print('==========================================');