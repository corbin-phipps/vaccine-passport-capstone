# Vaccine Passport Capstone

## How to Run

For the first time, clone the repo

`git clone https://gitlab.cs.washington.edu/cmp99/vaccine-passport-capstone.git`


In a terminal, enter the code directory

`cd vaccine-passport-capstone`


For the first time only, run the setup script to install some dependencies, enroll the admin users, and register/enroll the general user

`./setup.sh`


For each time that you want to run the program, run the start script to build the frontend and start the server

`./start.sh`


Visit the site in your browser

`http://localhost:8081`


## About the App

In the initial logged-out state, you are interacting with the system from the perspective of `generalUser`.

When logged-in, you will be either a `client` or an `admin`:
* `client` users can search for other people's vaccine passports. If searching for their own, they will see the entire passport. If searching for someone else, they will see either "'user' has been vaccinated", or "no passport found for user: 'user'"
* `admin` users can search for people's vaccine passports and see all of the fields, as well as create a new passport or update someone's existing passport


## Noteable code files and directories

The backend application code can be found in `application-javascript`, specifically in `app.js`. `AppUtil.js` and `CAUtil.js` are helper files. `enrollAdmin.js`, `enrollVaxAdmin.js`, and `registerEnrollGeneralUser.js` are ran only once in the `setup.sh` script.

The chaincode (smart contract) can be found in `chaincode-javascript/lib/assetTransfer.js`.

The backend server code can be found in `server`, specifically `server.js`. The connection profile that handles the connection to the blockchain network in IBM Cloud is in `uwmcmsp_profile.json`, and the other configuration information is in `config.json`.

Lastly, the frontend code can be found in `site-interface/src`. The main app code is in `App.js`, the routes are listed in `Routes.js` and defined by their page containers in `containers`, where the logic for the four routes are found in `Login.js`, `Read.js`, `Create.js`, and `Update.js`.