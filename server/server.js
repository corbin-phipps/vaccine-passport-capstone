const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const walletPath = ('../application-javascript/wallet');

const appAdmin = "admin";

let network = require('../application-javascript/app.js');

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

app.listen(process.env.PORT || 8081);

app.post('/login', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // technically not authenticated yet
    console.log(authenticatedUser);

    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);

    const adminIdentity = await wallet.get(appAdmin);
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, appAdmin);

    const identityService = caClient.newIdentityService();

    let retrieveIdentity = "";
    try {
        retrieveIdentity = await identityService.getOne(authenticatedUser, adminUser);
        console.log("user identity type: ", retrieveIdentity.result.type);
        res.send(retrieveIdentity.result.type); // either 'client' or 'admin'
    } catch (error) {
        console.error("No identity found for user \"" + authenticatedUser + "\"");
        res.send("No identity found for user \"" + authenticatedUser + "\"");
    }
});

app.post('/readPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser;
    let networkObj = await network.connectToNetwork(authenticatedUser);

    let user = req.body.targetUser

    let response = await network.readPassport(networkObj, user);
    if (authenticatedUser === user) {
        if (response.error) {
            res.send(response.error);
        } else {
            res.send(response);
        }
    } else {
        response = JSON.stringify(response);
        console.log("Response: " + response);
        if (response.startsWith("{\"message\":\"error")) {
            res.send(false);
        } else {
            res.send(true);
        }   
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
    console.log("Response: " + response);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});
