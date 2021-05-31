'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient } = require('../test-application/javascript/CAUtil.js');
const { buildWallet } = require('../test-application/javascript/AppUtil.js');

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
    } catch (error) {
        console.error(`Failed to enroll admin user : ${error}`);
    }
}

main();