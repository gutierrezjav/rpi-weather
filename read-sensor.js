"use strict";
const sensor = require("node-dht-sensor");
const { MongoClient } = require("mongodb");
const conf = require("./config.json");

const READ_INTERVAL = 300; //seconds
let intervalID;

const uri = `mongodb+srv://${conf.db.username}:${conf.db.password}@${conf.db.host}/?retryWrites=true&w=majority`;
const mongo = new MongoClient(uri);

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

        // Make the appropriate DB calls
        // await listDatabases(client);

    } catch (e) {
        console.error(e);
    }


}

// async function listDatabases(client) {
//     const databasesList = await client.db().admin().listDatabases();

//     console.log("Databases:");
//     databasesList.databases.forEach(db => console.log(` - ${db.name}`));
// };

async function writeToDb(client, temp, humidity) {
    const database = client.db(conf.db.database);
    const collection = database.collection("feb-2023-temp");
    const doc = { temperature: temp, humidity: humidity / 100, datetime: new Date() };
    const result = await collection.insertOne(doc);
    console.log(
        `A document was inserted with the _id: ${result.insertedId}`,
    );
}


async function cleanup() {
    clearInterval(intervalID);
    await mongo.close();
    return 0;
}

function readSensor() {
    sensor.read(22, 4, function (err, temperature, humidity) {
        if (!err) {
            console.log(`temp: ${temperature.toFixed(1)}°C, humidity: ${humidity.toFixed(1)}%`);
            temperature = Math.round(temperature * 100) / 100;
            humidity = Math.round(humidity * 100) / 100;
            writeToDb(mongo, temperature, humidity);
        }
    });
}
