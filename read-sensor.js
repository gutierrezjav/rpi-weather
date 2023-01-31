"use strict";
var sensor = require("node-dht-sensor");

var intervalID = setInterval(() => {
  sensor.read(22, 4, function(err, temperature, humidity) {
    if (!err) {
      console.log(`temp: ${temperature.toFixed(1)}°C, humidity: ${humidity.toFixed(1)}%`);
    }
  });
}, 10000);

function stopInterval(){
  clearInterval(intervalID);
  return 0;
}

//function to run when user closes using ctrl+c
process.on('SIGINT', stopInterval); 

