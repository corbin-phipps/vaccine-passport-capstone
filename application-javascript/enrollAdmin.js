'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const walletPath = path.join(__dirname, 'wallet');
const mspOrg1 = 'Org1MSP';
const appAdmin = "admin";
const appAdminSecret = "adminpw";

async function main() {
    try {
        const wallet = await buildWallet(Wallets, walletPath);
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

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
            mspId: mspOrg1,
            type: 'X.509',
        };
        await wallet.put(appAdmin, x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to enroll admin user : ${error}`);
    }
}

main();