cd application-javascript
rm -rf wallet
npm install
node enrollAdmin.js
node enrollVaxAdmin.js vaccineAdmin1 vaccineAdmin1pw
cd ../site-interface
npm install
npm run build
cd ../server
npm install
npm start