# self-token

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
surya inheritance contracts/* contracts/*/* contracts/*/*/* | dot -Tpng > graph/SelfToken.png
```

## View Inheritance order

```
surya dependencies <contract_name> contracts/* contracts/*/* contracts/*/*/*
```
