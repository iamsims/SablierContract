pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDSimple is ERC20 {
    uint8 private _decimal = 2; // cents decimals
    uint256 private _minMintableStablecoin = 1000; // US$ 10.00
    address private _adminAddress;

    /**
     * @dev Throws if the sender is not the contract admin
     */
    modifier admin() {
        require(msg.sender == _adminAddress, "Only the admin can do that");
        _;
    }

    /**
     * @notice Returns the stream with all its properties
     * @dev Throws if any param is missing
     * @param name is the token name
     * @param symbol is the symbol that represents the token
     * @param _initialSupply is initial amount to be minted
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _initialSupply
    ) ERC20(name, symbol) {
        // Constructor on deploy contract: "Simple Dollar","USDS",100000
        // Mint 100 tokens to msg.sender = 100 * 10**uint(decimals())
        // Mint 100.000.000 tokens to msg.sender = 100000000 * 10**uint(decimals())
        // Similar to how
        // 1 dollar = 100 cents
        // 1 token = 1 * (10 ** decimals)
        // 100 * 10**uint(decimals()) == 100 units and 100000000000000000000 min units
        // 100000000 * 10**uint(decimals()) == 100.000.000 units and 100000000000000000000 min units
        _adminAddress = msg.sender;
        _mint(msg.sender, _initialSupply * 10**uint256(decimals()));
    }

    // Override the decimals to 2 decimals to look like a stable coin
    function decimals() public view virtual override returns (uint8) {
        return _decimal;
    }

    // Returns the minimum mintable
    function minMintableStablecoin() public view virtual returns (uint256) {
        return _minMintableStablecoin;
    }

    /**
     * @notice Amount might be a dollar unit like 1 means 100 which means US$ 1.00
     * @dev Throws if the amount is not the minimum
     * @param amount is the amount to be minted
     */
    function mint(uint256 amount) external payable admin {
        require(
            amount >= _minMintableStablecoin,
            "Need to mint at least the minimum"
        );
        _mint(_adminAddress, amount * 10**uint8(decimals()));
    }
}
