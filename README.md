# Vaccine Passport Capstone

## How to Run

For the first time, clone the repo

`git clone https://gitlab.cs.washington.edu/cmp99/vaccine-passport-capstone.git`


Enter the code directory

`cd vaccine-passport-capstone`


In a terminal, navigate to the test network directory

`cd test-network`


To clear old network and start fresh, run this command

`./network.sh down`


Start up the network

`./network.sh up createChannel mychannel -ca`


Deploy chaincode

`./network.sh deployCC -ccn basic -ccp ../chaincode-javascript/ -ccl javascript`


In a separate terminal, navigate to the application code directory

`cd application-javascript`


Run the application

`node app.js`
