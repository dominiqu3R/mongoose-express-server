const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// import the collection models
const GroceryItem = require('./models/GroceryItem');
const Employee = require('./models/Employee');
// create a mapping object based on the models
const modelMapping = {
    GroceryInventory: GroceryItem,
    Employees: Employee
};

const connections = {};
const models = {};

const getConnection = async (dbName) => {
    console.log(`getConnection called with ${dbName}`);

    if (!connections[dbName]) {
        connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName, autoIndex: false });
        // Await the 'open' event to ensure the connection is established
        await new Promise((resolve, reject) => {
            connections[dbName].once('open', resolve);
            connections[dbName].once('error', reject);
        });
        console.log(`Connected to database ${dbName}`);
    } else {
        console.log('Reusing existing connection for db', dbName);
    }
    return connections[dbName];
};

const getModel = async (dbName, collectionName) => {
    console.log("getModel called with:", { dbName, collectionName });
    const modelKey = `${dbName}-${collectionName}`;

    if (!models[modelKey]) {
        const connection = await getConnection(dbName);
        const Model = modelMapping[collectionName];

        if (!Model) {
            // Use a dynamic schema if no model is found
            const dynamicSchema = new mongoose.Schema({}, { strict: false, autoIndex: false });
            models[modelKey] = connection.model(
                collectionName,
                dynamicSchema,
                collectionName
            );
            console.log(`Created dynamic model for collection: ${collectionName}`);
        } else {
            models[modelKey] = connection.model(
                Model.modelName,
                Model.schema,
                collectionName  // Use exact collection name from request
            );
            console.log("Created new model for collection:", collectionName);
        }
    }

    return models[modelKey];
};

app.get('/find/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const Model = await getModel(database, collection);
        const documents = await Model.find({});
        console.log(`query executed, document count is: ${documents.length}`);
        res.status(200).json(documents);
    }
    catch (err) {
        console.error('Error in GET route', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE route to delete a specific collection in a database
app.delete('/delete-collection/:database/:collection', async (req, res) => {
    try {
        const { database, collection } = req.params;
        const connection = await getConnection(database); // Establish or retrieve the connection

        // Check if the collection exists
        const collections = await connection.db.listCollections({ name: collection }).toArray();
        const collectionExists = collections.length > 0;

        if (!collectionExists) {
            return res.status(404).json({ error: `Collection '${collection}' does not exist in database '${database}'.` });
        }

        // Drop the collection
        await connection.db.dropCollection(collection);
        console.log(`Collection '${collection}' deleted from database '${database}'.`);

        // Remove all models associated with this collection
        const modelKey = `${database}-${collection}`;
        delete models[modelKey];

        res.status(200).json({ message: `Collection '${collection}' has been successfully deleted from database '${database}'.` });
    } catch (err) {
        console.error('Error deleting collection:', err);
        res.status(500).json({ error: 'An error occurred while deleting the collection.' });
    }
});


async function startServer() {
    try {
        app.listen(port, () => {
            console.log(`server is listening on ${port}`);
        })
    }
    catch (error) {
        console.error('error starting the server');
        process.exit(1);
    }
}

startServer();