const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const util = require('util');
const path = require('path');
const fs = require('fs');

let network = require('../application-javascript/app.js');

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());

const appAdmin = "app-admin";

app.get('/readPassport', async (req, res) => {
    let networkObj = await network.connectToNetwork(appAdmin);
    req.body = JSON.stringify(req.body);
    let user = req.body;
    let response = await network.readPassport(networkObj, user);
    let parsedResponse = await JSON.parse(response);
    res.send(parsedResponse);
});

app.post('/createPassport', async (req, res) => {
    let networkObj = await network.connectToNetwork(appAdmin);
    req.body = JSON.stringify(req.body);
    let passportFields = [req.body];
    let response = await network.createPassport(networkObj, passportFields);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});

app.listen(process.env.PORT || 8081);