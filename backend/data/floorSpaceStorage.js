/**
 * Persist floors and spaces to JSON files so they survive server restarts.
 * Without this, floors and spaces live only in memory (kenyaProductionData) and are lost on restart.
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const floorsPath = path.join(dataDir, 'floors.json');
const spacesPath = path.join(dataDir, 'spaces.json');

const { FLOORS: seedFloors, SPACES: seedSpaces } = require('./kenyaProductionData');

let floorsList = null;
let spacesList = null;

function loadFloors() {
  if (floorsList) return floorsList;
  if (fs.existsSync(floorsPath)) {
    try {
      const raw = fs.readFileSync(floorsPath, 'utf8');
      floorsList = JSON.parse(raw);
      if (Array.isArray(floorsList)) return floorsList;
    } catch (e) {
      console.warn('floorSpaceStorage: could not load floors.json, using seed', e.message);
    }
  }
  floorsList = JSON.parse(JSON.stringify(seedFloors));
  return floorsList;
}

function loadSpaces() {
  if (spacesList) return spacesList;
  if (fs.existsSync(spacesPath)) {
    try {
      const raw = fs.readFileSync(spacesPath, 'utf8');
      spacesList = JSON.parse(raw);
      if (Array.isArray(spacesList)) return spacesList;
    } catch (e) {
      console.warn('floorSpaceStorage: could not load spaces.json, using seed', e.message);
    }
  }
  spacesList = JSON.parse(JSON.stringify(seedSpaces));
  return spacesList;
}

function getFloors() {
  return loadFloors();
}

function getSpaces() {
  return loadSpaces();
}

function saveFloors() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(floorsPath, JSON.stringify(floorsList || loadFloors(), null, 2), 'utf8');
  } catch (e) {
    console.error('floorSpaceStorage: failed to save floors.json', e.message);
  }
}

function saveSpaces() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(spacesPath, JSON.stringify(spacesList || loadSpaces(), null, 2), 'utf8');
  } catch (e) {
    console.error('floorSpaceStorage: failed to save spaces.json', e.message);
  }
}

// Initialize on first use so we have a single mutable array
loadFloors();
loadSpaces();

module.exports = {
  getFloors,
  getSpaces,
  saveFloors,
  saveSpaces
};
