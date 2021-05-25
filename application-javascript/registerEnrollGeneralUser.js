'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const walletPath = path.join(__dirname, 'wallet');
const mspOrg1 = 'Org1MSP';
const appAdmin = "admin";
const genUserID = "generalUser";

// Requires a userID for the vaccine administrator as a command line argument
async function main() {
    try {
        const ccp = buildCCPOrg1();

        // Check if user already exists in the system
        const wallet = await buildWallet(Wallets, walletPath);
        const userIdentity = await wallet.get(genUserID);
        if (userIdentity != undefined) {
            console.error("Identity for the general user \"" + genUserID + "\" already exists");
        }

        // Check if CA admin is enrolled already
        const adminIdentity = await wallet.get(appAdmin);
        if (adminIdentity == undefined) {
            console.error("No identity found for admin user \"" + appAdmin +  "\". Run the enrollAdmin.js application before retrying");
        }

        // Connect to the gateway as the admin
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: appAdmin,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Get CA client to interact with the CA server
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

        // Register and enroll the new user
        await registerAndEnrollUser(caClient, wallet, mspOrg1, genUserID, '');
    } catch (error) {
        console.error("Failed to register and enroll the general user \"" + genUserID + "\".");
        console.error(error);
    }
} 

main();