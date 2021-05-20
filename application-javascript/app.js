// TODO: enroll admin in separate file

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

const ccp = buildCCPOrg1();

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


exports.connectToNetwork = async function (userName) {
	const gateway = new Gateway();
	
	try {
		const wallet = await buildWallet(Wallets, walletPath);
		const userExists = await wallet.exists(userName);
		if (!userExists) {
			let response = {};
			response.error = "need to register user first";
			return response;
		}

		await gateway.connect(ccp, {
			wallet,
			identity: userName,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(channelName);

		const contract = network.getContract(chaincodeName);

		let networkObj = {
			contract: contract,
			network: network,
			gateway: gateway
		};

		return networkObj;
	} catch (error) {
		let response = {};
		response.error = error;
		return response;
	} finally {

	}
};

exports.readPassport = async function (networkObj, user) {
	try {
		// Check if the user exists in the blockchain database
		let userExists = await contract.evaluateTransaction('AssetExists', user);

		// Return query associated with the given user, if the user exists
		let result = await contract.evaluateTransaction('ReadAsset', user);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);	

		return result;

	} catch (error) {
		console.error("User \"" + user + "\" does not exist.\n")
		return error;
	}
};

// TODO: Check if admin exists, register/enroll user
exports.createPassport = async function (networkObj, passportFields) {
	try {
		userID = JSON.parse(passportFields[0]);
		owner = JSON.parse(passportFields[1]);
		vaccineBrand = JSON.parse(passportFields[2]);
		vaccineSite = JSON.parse(passportFields[3]);
		vaccineDate = JSON.parse(passportFields[4]);

		userID = JSON.stringify(userID);
		owner = JSON.stringify(owner);
		vaccineBrand = JSON.stringify(vaccineBrand);
		vaccineSite = JSON.stringify(vaccineSite);
		vaccineDate = JSON.stringify(vaccineDate);
		
		let response = await contract.submitTransaction('CreateAsset', userID, owner, vaccineBrand, vaccineSite, null, vaccineDate, null);

		return response;
	} catch (error) {
		console.error("CreatePassport failed: " + error);
		return error;
	}
};







async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		

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
			

			// Build a network instance based on the channel where the smart contract is deployed
			

			// Get the contract from the network.
			

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
                    let vaccineBrand = await ask('Vaccine brand? ');
                    let vaccineSite = await ask('Vaccination site? ');
                    let vaccineDate = await ask('Vaccination date? ');

                    // create passport with given data
                    await contract.submitTransaction('CreateAsset', newUserName, ownerName, vaccineBrand, vaccineSite, '', vaccineDate, '');
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
