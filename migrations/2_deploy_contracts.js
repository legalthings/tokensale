var Token = artifacts.require("./LTOToken.sol");
var TokenSale = artifacts.require("./LTOTokenSale.sol");
var config = require("../config.json");
var tokenConfig = config.token;
var tokenSaleConfig = config.tokenSale;

function convertDecimals(number) {
  return web3.toBigNumber(10).pow(tokenConfig.decimals).mul(number);
}

function getReceiverAddr(defaultAddr) {
  if(tokenSaleConfig.receiverAddr) {
    return tokenSaleConfig.receiverAddr;
  }
  return defaultAddr;
}


module.exports = function(deployer, network, accounts) {

  var defaultAddr = accounts[0];
  var receiverAddr = getReceiverAddr(defaultAddr);
  const bridgeSupply = convertDecimals(tokenConfig.bridgeSupply);
  var totalSaleAmount = convertDecimals(tokenSaleConfig.totalSaleAmount);
  var totalSupply = convertDecimals(tokenConfig.totalSupply);
  var startTime = web3.toBigNumber(tokenSaleConfig.startTime);
  var userWithdrawalDelaySec = web3.toBigNumber(tokenSaleConfig.userWithdrawalDelaySec);
  var clearDelaySec = web3.toBigNumber(tokenSaleConfig.clearDelaySec);
  var keepAmount = totalSupply.sub(totalSaleAmount);
  var tokenInstance = null;
  var toknSaleInstance = null;

  return deployer.deploy(Token,
    totalSupply,
    tokenConfig.name,
    tokenConfig.symbol,
    tokenConfig.decimals,
    tokenConfig.bridgeAddr,
    bridgeSupply)
    .then(function () {
      return deployer.deploy(TokenSale, receiverAddr, Token.address, totalSaleAmount, startTime);
    })
    .then(() => {
      return Token.deployed();
    })
    .then(instance => {
      tokenInstance = instance;
      return TokenSale.deployed()
    })
    .then(instance => {
      toknSaleInstance = instance;
      return tokenInstance.transfer(toknSaleInstance.address, totalSaleAmount);
    })
    .then(tx => {
      return toknSaleInstance.startSale(tokenSaleConfig.rate, tokenSaleConfig.duration, userWithdrawalDelaySec, clearDelaySec);
    })
    .then(tx => {
      if(defaultAddr != receiverAddr) {
        return tokenInstance.transfer(receiverAddr, keepAmount);
      }
    });
};