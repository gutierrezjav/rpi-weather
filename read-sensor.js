"use strict";
const sensor = require("node-dht-sensor");

const READ_INTERVAL = 30; //seconds


function stopInterval() {
    clearInterval(intervalID);
    return 0;
}

function readSensor() {
    sensor.read(22, 4, function (err, temperature, humidity) {
        if (!err) {
            console.log(`temp: ${temperature.toFixed(1)}°C, humidity: ${humidity.toFixed(1)}%`);
        }
    });
}

//function to run when user closes using ctrl+c
process.on('SIGINT', stopInterval);


console.log(`Reading temperature and humidity every ${READ_INTERVAL} seconds.`)
const intervalID = setInterval(readSensor, READ_INTERVAL * 1000);
readSensor();

