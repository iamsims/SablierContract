require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.17",
      },
      {
        version: "0.8.13",
        settings: {},
      },
    ],
  },
};
