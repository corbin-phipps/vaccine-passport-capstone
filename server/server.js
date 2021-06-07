const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient } = require('../application-javascript/CAUtil.js');
const { buildWallet, s3download } = require('../application-javascript/AppUtil.js');

const configPath = path.join(process.cwd(), './config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
const walletPath = '../application-javascript/wallet';

const ccpPath = path.join(process.cwd(), config.connection_profile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const appAdmin = config.appAdmin;

let network = require('../application-javascript/app.js');

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('../site-interface/build'));

app.listen(process.env.PORT || 8081);

// Serves the routes of the frontend build
app.get('/*', function (req, res) {
    res.sendFile(path.resolve(__dirname + '/../site-interface/build/index.html'));
});

// Handles the login route from the frontend. 
// Sends the identity type of the user trying to login as a response to the frontend
app.post('/login', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // username of the user trying to login

    const caClient = buildCAClient(FabricCAServices, ccp, config.caName);
    const wallet = await buildWallet(Wallets, walletPath);

    // Check if an identity for the app admin already exists in the S3 bucket
    let identityFileName = appAdmin + '.id';
    let params = {
        Bucket: config.s3BucketName,
        Key: identityFileName
    }
    s3download(params, walletPath)
    .catch(e => {
        console.log('User does not exist');
    });

    // Check if an identity for the user trying to login already exists in the S3 bucket
    identityFileName = authenticatedUser + '.id';
    params = {
        Bucket: config.s3BucketName,
        Key: identityFileName
    }
    s3download(params, walletPath)
    .catch(e => {
        console.log('User does not exist');
    });

    // Creates a certificate authority identity service to retrieve identity types
    const adminIdentity = await wallet.get(appAdmin);
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, appAdmin);
    const identityService = caClient.newIdentityService();

    let retrieveIdentity = "";
    try {
        // Retrieve the type of identity of the user trying to login (either 'client' or 'admin')
        retrieveIdentity = await identityService.getOne(authenticatedUser, adminUser);
        res.send(retrieveIdentity.result.type);
    } catch (error) {
        console.error("No identity found for user \"" + authenticatedUser + "\"");
        res.send("No identity found for user \"" + authenticatedUser + "\"");
    }
});

// Handles the read passport route from the frontend.
// Sends either the full vaccine passport fields or a true/false vaccination status depending on identity type
app.post('/readPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser;         // username of the logged-in user
    let authenticatedUserType = req.body.authenticatedUserType; // identity type of the logged-in user ('client' or 'admin')
    let user = req.body.targetUser;                             // username of the user whose vaccine passport is being searched for

    let networkObj = await network.connectToNetwork(authenticatedUser);                     

    // Send full vaccine passport if logged-in user is an admin or the same user they're searching for.
    // Otherwise, send true if passport exists or false if it does not
    let response = await network.readPassport(networkObj, user);
    if (authenticatedUser === user || authenticatedUserType === "admin") {
        if (response.error) {
            res.send(response.error);
        } else {
            res.send(response);
        }
    } else {
        response = JSON.stringify(response);
        console.log("Response: " + response);
        if (response.startsWith("{\"status\":500")) { // vaccine passport does not exists
            res.send(false);
        } else {
            res.send(true);
        }   
    }   
});

// Handles the create passport route from the frontend.
// Sends the response of the create passport function as a response to the frontend
app.post('/createPassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // username of logged-in user (should be vaccine administrator)
    let userID = req.body.userID;                       // username of person to create passport for
    let owner = req.body.owner;                         // full name of person to create passport for
    let vaccineBrand = req.body.vaccineBrand;           // vaccine brand received
    let vaccineSite = req.body.vaccineSite;             // vaccination site where vaccine was received
    let vaccineDate = req.body.vaccineDate;             // date when first dose was received
    let passportFields = [userID, owner, vaccineBrand, vaccineSite, vaccineDate];

    let networkObj = await network.connectToNetwork(authenticatedUser);
    let response = await network.createPassport(networkObj, passportFields);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});

// Handles the update passport route from the frontend.
// Sends the response of the update passport function as a response to the frontend
app.post('/updatePassport', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // username of logged-in user (should be vaccine administrator)
    let userID = req.body.userID;                       // username of the person to update passport for
    let vaccineSite2 = req.body.vaccineSite2;           // vaccination site where second dose was received
    let vaccineDate2 = req.body.vaccineDate2;           // date when second dose was received
    let passportFields = [userID, vaccineSite2, vaccineDate2];

    let networkObj = await network.connectToNetwork(authenticatedUser);
    let response = await network.updatePassport(networkObj, passportFields);
    console.log("Response: " + response);
    if (response.error) {
        res.send(response.error);
    } else {
        res.send(response);
    }
});
