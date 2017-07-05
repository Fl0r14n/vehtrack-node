const L = require('./logger');
const http = require('http');
const concat = require('concat-stream');
const xml2json = require('xml2json');
const querystring = require('querystring');
const models = require('./models');

const MIN_POSITIONS_JOURNEY = 100;
const MAX_POSITIONS_JOURNEY = 150;
const MAX_LOGS_JOURNEY = 5;

const cities = {
  Timisoara: [45.760098, 21.238579],
  Arad: [46.166704, 21.316663],
  Oradea: [47.077137, 21.921791],
  Cluj: [46.78196, 23.600639],
  Iasi: [47.162641, 27.589706],
  Brasov: [45.660127, 25.611137],
  Constanta: [44.179496, 28.63993],
  Bucuresti: [44.427283, 26.092773],
  Craiova: [44.316234, 23.801681],
  Sibiu: [45.791946, 24.142059]
};
const cityNames = Object.keys(cities);
const levels = Object.keys(models.Log.LEVEL);

let randint = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateJourneysForDevice = async (device, startDate, stopDate) => {
  let journeys = [];
  const startCity = cityNames[randint(0, cityNames.length - 1)];
  let startPoint = cities[startCity];
  while (startDate < stopDate) {
    let stopCity = cityNames[randint(0, cityNames.length - 1)];
    let stopPoint = cities[stopCity];
    while (JSON.stringify(startPoint) === JSON.stringify(stopPoint)) {
      stopCity = cityNames[randint(0, cityNames.length - 1)];
      stopPoint = cities[stopCity];
    }
    let journey = await generateJourneyForDevice(device, startDate, startPoint, stopPoint);
    journeys.push(journey);
    startPoint = stopPoint;
    startDate = new Date((startDate - 0) + journey.duration + 3600000);
  }
  return journeys;
};

const generateJourneyForDevice = async (device, startDate, startPoint, stopPoint) => {
  let kml = await yourNavigationOrg(startPoint, stopPoint);
  const travelDistance = kml.Document.distance; // km
  const travelTime = kml.Document.traveltime; // sec
  L.info(`Device: ${device.serial} Distance: ${travelDistance}km Time: ${travelTime / 60 }h`);
  if (travelDistance > 0.5 && travelTime > 0) {
    let stopDate = new Date((startDate - 0) + travelTime * 230400000);
    const duration = travelTime * 1000; // ms
    const distance = travelDistance * 1000; // m
    const averageSpeed = distance / travelTime;
    const maximumSpeed = averageSpeed + 30; // +30km/h
    let journey = await models.Journey.create({
      device_id: device.id,
      startTimestamp: startDate,
      startLatitude: startPoint[0],
      startLongitude: startPoint[1],
      stopTimestamp: stopDate,
      stopLatitude: stopPoint[0],
      stopLongitude: stopPoint[1],
      duration: duration,
      distance: distance,
      averageSpeed: averageSpeed,
      maximumSpeed: maximumSpeed
    });
    generatePointsForJourney(device, journey, kml, startPoint, startDate, travelTime);
    generateLogsForJourney(device, journey);
    return journey;
  }
};

const generatePointsForJourney = (device, journey, kml, startPoint, startDate, travelTime) => {
  const getPointsFromKml = (kml) => {
    const buf = kml.Document.Folder.Placemark.LineString.coordinates;
    let points = [];
    for (let line of buf.split('\n')) {
      const point = line.split(',');
      points.push([Number(point[0]), Number(point[1])]);
    }
    return points;
  };
  const trimPoints = (points) => {
    const totalPoints = randint(MIN_POSITIONS_JOURNEY, MAX_POSITIONS_JOURNEY);
    if (points.length > totalPoints) {
      const removeStep = points.length / totalPoints;
      if (removeStep > 0) {
        for (let i = 0; i < points.length; i++) {
          if (i % removeStep > 0) {
            points.splice(i, 1);
          }
        }
      }
    }
    return points;
  };
  const calculateDistance = (srcPoint, dstPoint) => {
    return Math.sqrt(Math.pow((dstPoint[0] - srcPoint[0]) * 111.2, 2) + Math.pow((dstPoint[1] - srcPoint[1]) * 100.7, 2));
  };

  let points = getPointsFromKml(kml);
  const trimmedPoints = trimPoints(points);
  let timeStep = travelTime / trimmedPoints.length;
  let timestamp = startDate;
  let lastPoint = startPoint;
  let positions = [];
  for (let point of trimmedPoints) {
    const dst = calculateDistance(lastPoint, point);
    const speed = dst * 3600 / timeStep;
    positions.push({
      device_id: device.id,
      journey_id: journey.id,
      latitude: point[0],
      longitude: point[1],
      timestamp: timestamp,
      speed: speed
    });
    lastPoint = point;
    timestamp = new Date((timestamp - 0) + (timeStep * 1000));
  }
  models.Position.bulkCreate(positions);
};

const generateLogsForJourney = (device, journey) => {
  let logs = [];
  for (let i = 0; i < randint(0, MAX_LOGS_JOURNEY); i++) {
    const level = levels[randint(0, levels.length - 1)];
    const message = `Message: ${models.Log.LEVEL[level]}`;
    const timestamp = journey.startTimestamp;
    logs.push({
      device_id: device.id,
      journey_id: journey.id,
      level: level,
      message: message,
      timestamp: timestamp,
    });
    models.Log.bulkCreate(logs);
  }
};

const yourNavigationOrg = (start, stop) => {
  const buildUrl = (start, stop) => {
    if (start && stop) {
      return {
        hostname: 'http://www.yournavigation.org',
        path: '/api/dev/route.php',
        params: querystring.stringify({
          flat: start[0],
          flon: start[1],
          tlat: stop[0],
          tlon: stop[1],
          v: 'motorcar',
          fast: 1,
          layer: 'mapnik',
          instructions: 0
        })
      }
    }
  };
  const execute = (urlPath) => {
    return new Promise((resolve, reject) => {
      if (urlPath) {
        http.get(`${urlPath.hostname}${urlPath.path}?${urlPath.params}`, (res) => {
          res.pipe(concat((body) => {
            const obj = JSON.parse(xml2json.toJson(body.toString()));
            resolve(obj.kml);
          }));
        });
      } else {
        reject('yournavigation.org url does not exist');
      }
    });
  };
  return execute(buildUrl(start, stop));
};

exports.generateJourneysForDevice = generateJourneysForDevice;
