"use strict";
const https = require("node:https");
const sensor = require("node-dht-sensor");
const { MongoClient } = require("mongodb");
const conf = require("./config.json");

const READ_INTERVAL = 60*15; //in seconds
let intervalID;

const uri = `mongodb+srv://${conf.db.username}:${conf.db.password}@${conf.db.host}/?retryWrites=true&w=majority`;
const mongo = new MongoClient(uri);
let mongo_collection;

//function to run when user closes using ctrl+c
process.on('SIGINT', cleanup);

console.log("Configuring the DB connection")
initMongo(mongo).then(() => {

    console.log(`Reading temperature and humidity every ${READ_INTERVAL} seconds.`)
    intervalID = setInterval(readSensor, READ_INTERVAL * 1000);
    readSensor();

})



///// helper functions below

async function initMongo(client) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();


        const database = client.db(conf.db.database);
        mongo_collection = database.collection("2023-temp");

    } catch (e) {
        console.error(e);
    }


}

// async function listDatabases(client) {
//     const databasesList = await client.db().admin().listDatabases();

//     console.log("Databases:");
//     databasesList.databases.forEach(db => console.log(` - ${db.name}`));
// };

async function writeToDb(temp, humidity) {

    const doc = { temperature: temp, humidity: humidity / 100, datetime: new Date() };
    const result = await mongo_collection.insertOne(doc);
    console.log(
        `A document was inserted with the _id: ${result.insertedId}`,
    );
}

async function writeToIFTTT(temp, humidity) {
    const url = conf.iftt.url + `?value1=${temp}&value2=${humidity}`;
    https.get(url, (res) => {
        console.log("Info sent to IFTTT");
    });
}


async function cleanup() {
    console.log("Cleaning up...")
    clearInterval(intervalID);
    await mongo.close();
    return 0;
}

function readSensor() {
    sensor.read(22, 4, function (err, temperature, humidity) {
        if (!err) {
            temperature = Math.round(temperature * 100) / 100;
            humidity = Math.round(humidity * 100) / 100;
            console.log(`temp: ${temperature}°C, humidity: ${humidity}%`);
            writeToDb(temperature, humidity);
            writeToIFTTT(temperature, humidity);
        }
    });
}
