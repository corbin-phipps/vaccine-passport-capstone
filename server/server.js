const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const util = require('util');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');

const appAdmin = "admin";

let network = require('../application-javascript/app.js');

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());

app.get('/login', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // technically not authenticated yet

    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);

    const adminIdentity = await wallet.get(appAdmin);
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, appAdmin);

    const identityService = caClient.newIdentityService();

    const retrieveIdentity = await identityService.getOne(authenticatedUser, adminUser);
    console.log("user identity type: ", retrieveIdentity.result.type);

    res.send(retrieveIdentity.result.type); // either 'client' or 'admin'
});

app.get('/readPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser;
    let networkObj = await network.connectToNetwork(authenticatedUser);

    let user = req.body.targetUser
    let response = await network.readPassport(networkObj, user);
    if (response.error) {
        res.send(false);
    } else {
        res.send(true);
    }
});

app.get('/readOwnPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser;
    let networkObj = await network.connectToNetwork(authenticatedUser);

    let user = req.body.targetUser
    
    if (authenticatedUser === user) {
        let response = await network.readPassport(networkObj, user);
        if (response.error) {
            res.send(response.error);
        } else {
            res.send(response);
        }
    } else {
        res.send("Logged in user is different from target user");
    }
});

app.post('/createPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // should be vaccine administrator
    let networkObj = await network.connectToNetwork(authenticatedUser);

    let userID = req.body.userID;
    let owner = req.body.owner;
    let vaccineBrand = req.body.vaccineBrand;
    let vaccineSite = req.body.vaccineSite;
    let vaccineDate = req.body.vaccineDate;
    let passportFields = [userID, owner, vaccineBrand, vaccineSite, vaccineDate];

    let response = await network.createPassport(networkObj, passportFields);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});

app.post('/updatePassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // should be vaccine administrator
    let networkObj = await network.connectToNetwork(authenticatedUser);

    let userID = req.body.userID;
    let vaccineSite2 = req.body.vaccineSite2;
    let vaccineDate2 = req.body.vaccineDate2;
    let passportFields = [userID, vaccineSite2, vaccineDate2];

    let response = await network.updatePassport(networkObj, passportFields);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});

app.listen(process.env.PORT || 8081);