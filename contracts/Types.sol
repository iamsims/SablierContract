pragma solidity =0.5.17;

/**
 * @title Sablier Types
 * @author Sablier
 */
library Types {
    struct Stream {
        uint256 deposit;
        uint256 ratePerSecond;
        uint256 remainingBalance;
        uint256 startTime;
        uint256 stopTime;
        address recipient;
        address sender;
        address tokenAddress;
        bool isEntity;
    }

    struct TokenBalance {
        address tokenAddress; // address of the Token
        uint256 incomingBalance; // sum of all withdrawable tokens from incoming streams
    }
}
