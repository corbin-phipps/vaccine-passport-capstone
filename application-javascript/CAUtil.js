'use strict';

const adminUserId = 'app-admin';
const walletPath = './wallet';

const path = require('path');
const fs = require('fs');
const util = require('util');
const { s3upload } = require('./AppUtil.js');

const configPath = '../server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

const readFile = util.promisify(fs.readFile);

// Builds a certificate authority client to be used for managing identities.
// Returns the CA client object
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
	// Create a new CA client for interacting with the CA.
	const caInfo = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

// Registers and enrolls the given userId with the certificate authority
exports.registerAndEnrollUser = async (caClient, wallet, orgMspId, userId, affiliation) => {
	try {
		// Check to see if we've already enrolled the user
		const userIdentity = await wallet.get(userId);
		if (userIdentity) {
			console.log(`An identity for the user ${userId} already exists in the wallet`);
			return;
		}

		// Must use an admin to register a new user
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			console.log('An identity for the admin user does not exist in the wallet');
			console.log('Enroll the admin user before retrying');
			return;
		}

		// build a user object for authenticating with the CA
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

		// Register the user, enroll the user, and import the new identity into the wallet.
		// if affiliation is specified by client, the affiliation value must be configured in CA
		const secret = await caClient.register({
			affiliation: affiliation,
			enrollmentID: userId,
			role: 'client',
		}, adminUser);
		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: secret,
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes()
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(userId, x509Identity);
		console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
	} catch (error) {
		console.error(`Failed to register user : ${error}`);
	}
};

// Enrolls a vaccine administrator with the given userId
exports.enrollVaxAdmin = async (caClient, wallet, orgMspId, userId, userSecret) => {
	try {
		// Check to see if we've already enrolled the user
		const userIdentity = await wallet.get(userId);
		if (userIdentity) {
			console.log(`An identity for the user ${userId} already exists in the wallet`);
			return;
		}

		// Must use an admin to register a new user
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			console.log('An identity for the admin user does not exist in the wallet');
			console.log('Enroll the admin user before retrying');
			return;
		}

		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: userSecret,
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes()
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(userId, x509Identity);
		console.log(`Successfully enrolled vaccine administrator ${userId} and imported it into the wallet`);
	} catch (error) {
		console.error(`Failed to register user : ${error}`);
	}
};

// Helper function to read the identity of the given userId.
// Returns the parameters needed to read from the S3 bucket
exports.readIdentity = async (userId) => {
	let fileData;
	const identityFileName = userId + '.id';
	let params = "";
	await readFile(path.join('../application-javascript', walletPath, identityFileName), 'utf8')
	.then((data) => {
		fileData = data;
		params = {
			Bucket: config.s3BucketName,
			Key: identityFileName,
			Body: fileData
		};
	})
	return params;
};

// Helper function to upload the identity to the S3 bucket
exports.uploadIdentity = async (params) => {
	await s3upload(params)
	.catch(e => {
		console.log('S3 upload error: ' + e);
	});
};