'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient } = require('./CAUtil.js');
const { buildWallet } = require('./AppUtil.js');
const AWS = require('aws-sdk');

const configPath = '../server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

const ccpPath = '../server/' + config.connection_profile;
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const walletPath = path.join(__dirname, 'wallet');
const mspOrg = config.orgMSPID;
const appAdmin = config.appAdmin;
const appAdminSecret = config.appAdminSecret;

const s3 = new AWS.S3({
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretAccessKey,
    Bucket: config.s3BucketName
});

async function s3upload(params) {
    let promise = new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: config.s3BucketName
        }, function () {
            s3.putObject(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    console.log('Successfully added file to S3 bucket');
                    resolve(data);
                }
            });
        });
    });

    return await promise;
}

async function main() {
    try {
        const wallet = await buildWallet(Wallets, walletPath);
        const caClient = buildCAClient(FabricCAServices, ccp, config.caName);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get(appAdmin);
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await caClient.enroll({ enrollmentID: appAdmin, enrollmentSecret: appAdminSecret });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspOrg,
            type: 'X.509',
        };
        await wallet.put(appAdmin, x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
        
        let fileData;
        const identityFileName = appAdmin + '.id';
        fs.readFile(path.join(walletPath, identityFileName), 'utf8', function (err, data) {
            if (err) {
                console.error(err);
            } else {
                fileData = data;
                const params = {
                    Bucket: config.s3BucketName,
                    Key: identityFileName,
                    Body: JSON.stringify(fileData)
                };
                s3upload(params)
                .catch(e => {
                    console.log('S3 upload error: ' + e);
                });
            }
        });

    } catch (error) {
        console.error(`Failed to enroll admin user : ${error}`);
    }
}

main();