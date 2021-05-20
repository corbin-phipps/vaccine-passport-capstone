/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// For console input
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

// function that promises to ask a question and 
// resolve to its answer
function ask(questionText) {
	return new Promise((resolve, reject) => {
		readline.question(questionText, (input) => resolve(input) );
	});
}

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */
async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			await contract.submitTransaction('InitLedger');

			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			// let result = await contract.submitTransaction('CreateAsset', 'vp3', 'Claire', 'Johnson & Johnson', 'Bartell Drugs', '04-27-2021');

			// Welcome the user
			console.log('\nWelcome to the Vaccine Passport! \n')

			// Prompt for an action from the user
			let action = await ask('Would you like to (C)reate passport, (A)dd vaccine dose, (R)ead passport, or (E)xit? ');
			while (action !== 'E') {
				if (action === 'C') {
				    // prompt for passport data
					let newUserName = await ask('Username? ');
					let ownerName = await ask('Passport owner name? ');
					let vaccineBrand;
					let vaccineBrandChoice = await ask('Vaccine brand? Choose one (Type the number):\n  1) Pfizer\n  2) Moderna\n  3) Johnson & Johnson\n');
					while (vaccineBrandChoice !== '1' || vaccineBrandChoice !== '2' || vaccineBrandChoice !== '3') {
						vaccineBrandChoice = await ask('Vaccine brand? Choose one (Type the number):\n  1) Pfizer\n  2) Moderna\n  3) Johnson & Johnson\n');
					}
					switch (vaccineBrandChoice) {
						case '1':
							vaccineBrand = 'Pfizer';
							break;
						case '2':
							vaccineBrand = 'Moderna';
							break;
						case '3':
							vaccineBrand = 'Johnson & Johnson';
							break;
					}
					let vaccineSite = await ask('Vaccination site? ');
					let vaccineMonth = await ask('Vaccination date? Enter month (number): ');
					while (parseInt(vaccineMonth, 10) < 1 || parseInt(vaccineMonth, 10) > 12) {
						vaccineMonth = await ask('Vaccination date? Enter month (number): ');
					}
					let maxDays;
					switch (vaccineMonth) {
						case '1':
						case '01':
						case '3':
						case '03':
						case '5':
						case '05':
						case '7':
						case '07':
						case '8':
						case '08':
						case '10':
						case '12':
							maxDays = 31;
							break;
						case '4':
						case '04':
						case '6':
						case '06':
						case '8':
						case '08':
						case '10':
							maxDays = 30;
							break;
						case '2':
						case '02':
							maxDays = 28;
							break;
					}
					let vaccineDays = await ask('Enter day (number): ');
					while (parseInt(vaccineDays, 10) < 1 || parseInt(vaccineDays) > maxDays) {
						vaccineDays	= await ask('Incorrect days for the month. Enter day (number): ');
					}

					let vaccineYear = await ask('Enter year (number): ');
					while (parseInt(vaccineYear, 10) < 2020) {
						vaccineYear = await ask('Invalid year. Enter year (number): ');
					}

					let vaccineDate = vaccineMonth + '-' + vaccineDays + '-' + vaccineYear;
					// create passport with given data
					let newPassport = await contract.submitTransaction('CreateAsset', newUserName, ownerName, vaccineBrand, vaccineSite, vaccineDate);
				} else if (action === 'A') {
					let user = await ask('Which user would you like to add a vaccine dose for? ');

					// Check if the user exists in the blockchain database
					let userExists = await contract.evaluateTransaction('AssetExists', user);
					if (userExists.toString() === 'false') {
						console.log("User \"" + user + "\" does not exist.\n");
					} else {
						let result = await contract.evaluateTransaction('ReadAsset', user);
						let result_str = result.toString();

						const kvs = result_str.split(',');

						let ownerArr = kvs[1].split(":");
						let owner = ownerArr[1].substring(1, ownerArr[1].length - 1);

						let vaccineTypeArr = kvs[2].split(":");
						let vaccineType = vaccineTypeArr[1].substring(1, vaccineTypeArr[1].length - 1);

						if (vaccineType !== "Pfizer" || vaccineType !== "Moderna") {
							console.log(vaccineType + " only requires one dose.")
						} else {
							let vaccineAdminArr = kvs[3].split(":");
							let vaccineAdmin = vaccineAdminArr[1].substring(1, vaccineAdminArr[1].length - 1);

							let dateofFirstDoseArr = kvs[5].split(":");
							let dateofFirstDose = dateofFirstDoseArr[1].substring(1, dateofFirstDoseArr[1].length - 1);

							let vaccineSite2 = await ask('Second vaccine site? ');
							let vaccineDate2 = await ask('Second vaccine date? ');
							
							await contract.submitTransaction('UpdateAsset', user, owner, vaccineType, vaccineAdmin, vaccineSite2, dateofFirstDose, vaccineDate2);
						}
					}
				} else if (action === 'R') {
					// Prompt the user for the username they're searching for
					let user = await ask('Username? ');

					// Check if the user exists in the blockchain database
					let userExists = await contract.evaluateTransaction('AssetExists', user);
					if (userExists.toString() === 'false') {
						console.log("User \"" + user + "\" does not exist.\n");
					} else {
						// Return query associated with the given user, if the user exists
						let result = await contract.evaluateTransaction('ReadAsset', user);
						console.log(`*** Result: ${prettyJSONString(result.toString())}`);
					}
				} else {
					console.log("Please enter C for create, A for add vaccine, R for read, or E for exit. \n")
				}
				action = await ask('(C)reate passport, (A)dd vaccine dose, (R)ead passport, or (E)xit? ');
			}
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
			process.exit(1);
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
