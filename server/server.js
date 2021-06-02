const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient } = require('../application-javascript/CAUtil.js');
const { buildWallet } = require('../application-javascript/AppUtil.js');
const AWS = require('aws-sdk');

const configPath = path.join(process.cwd(), './config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
const walletPath = '../application-javascript/wallet';

const ccpPath = path.join(process.cwd(), config.connection_profile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const s3 = new AWS.S3({
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretAccessKey,
    Bucket: config.s3BucketName
});

const appAdmin = config.appAdmin;

let network = require('../application-javascript/app.js');

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());

app.use(express.static('../site-interface/build'));
app.get('/*', function (req, res) {
    res.sendFile(__dirname + '/../site-interface/build/index.html');
});

async function s3download(params) {
    let promise = new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: config.s3BucketName
        }, function () {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    fs.writeFile(path.join(walletPath, params.Key), data.Body, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Successfully downloaded file from S3 bucket');
                        }
                    });
                    resolve(data);
                }
            });
        });
    });

    return await promise;
}

app.listen(process.env.PORT || 8081);

app.post('/login', async (req, res) => {
    let authenticatedUser = req.body.authenticatedUser; // technically not authenticated yet
    console.log(authenticatedUser);

    const caClient = buildCAClient(FabricCAServices, ccp, config.caName);
    const wallet = await buildWallet(Wallets, walletPath);

    const identityFileName = appAdmin + '.id';
    const params = {
        Bucket: config.s3BucketName,
        Key: identityFileName
    }
    s3download(params);

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
    if (authenticatedUser === user || authenticatedUser.startsWith("vaccineAdmin")) {
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
