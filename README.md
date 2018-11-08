# self-token

[![Build Status](https://img.shields.io/travis/selftoken-projects/self-token/master.svg?style=popout&maxAge=3600)](https://travis-ci.org/selftoken-projects/self-token)
[![Node version](https://img.shields.io/badge/node-10.8.10-blue.svg?style=popout&maxAge=3600)](https://nodejs.org/en/)
[![NPM version](https://img.shields.io/badge/npm-6.4.1-orange.svg?style=popout&maxAge=3600)](https://nodejs.org/en/)
[![Solidity version](https://img.shields.io/badge/Solidity-v0.4.25-ff69b4.svg?style=popout&maxAge=3600)](https://solidity.readthedocs.io/en/v0.4.25/installing-solidity.html)

## linting

We use Solium to lint solidity contracts.

```
npm install -g solium
solium -d contracts/
```

or

```
npm run lint:sol
```

## Generate smart contract inheritance order graph

![inheritance graph](/docs/SelfToken.png)

```
npm install -g surya
surya inheritance contracts/* contracts/*/* contracts/*/*/* | dot -Tpng > docs/SelfToken.png
```

## View Inheritance order

```
surya dependencies <contract_name> contracts/* contracts/*/* contracts/*/*/*
```
