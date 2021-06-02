/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const adminUserId = 'app-admin';
const walletPath = './wallet';

const path = require('path');
const fs = require('fs');
const configPath = '../server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
const AWS = require('aws-sdk');

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

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
	// Create a new CA client for interacting with the CA.
	const caInfo = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

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

		// build a user object for authenticating with the CA
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);


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
		console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);

		let fileData;
        const identityFileName = userId + '.id';
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
				console.log("hi");
            }
        });
	} catch (error) {
		console.error(`Failed to register user : ${error}`);
	}
};
