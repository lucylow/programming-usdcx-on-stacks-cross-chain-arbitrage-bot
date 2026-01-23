// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArbitrageVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Constants
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    uint256 public constant MIN_PROFIT_USDC = 500000; // 0.5 USDC in 6 decimals
    uint256 public constant MAX_DEPOSIT = 1_000_000_000_000; // 1M USDC max deposit per transaction
    uint256 public constant TIMELOCK_DELAY = 1 days; // 24 hours timelock for critical operations
    
    // State variables
    address public bridgeProcessor;
    address public botOperator;
    uint256 public totalProfit;
    uint256 public totalTrades;
    
    // Timelock variables
    address public pendingBridgeProcessor;
    address public pendingBotOperator;
    uint256 public timelockStartTime;
    
    // Events
    event ArbitrageExecuted(
        uint256 indexed tradeId,
        address indexed executor,
        uint256 profit,
        uint256 timestamp
    );
    
    event FundsDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed withdrawer,
        uint256 amount,
        uint256 timestamp
    );
    
    event BridgeInitiated(
        bytes32 indexed bridgeTxId,
        uint256 amount,
        string stacksAddress,
        uint256 timestamp
    );
    
    event SlippageExceeded(
        uint256 expectedAmount,
        uint256 actualAmount,
        uint256 timestamp
    );
    
    event BridgeProcessorUpdateProposed(
        address indexed newProcessor,
        uint256 timelockEnd
    );
    
    event BotOperatorUpdateProposed(
        address indexed newOperator,
        uint256 timelockEnd
    );
    
    event EmergencyWithdrawal(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyBridgeProcessor() {
        require(msg.sender == bridgeProcessor, "Not bridge processor");
        _;
    }
    
    modifier onlyBotOperator() {
        require(msg.sender == botOperator, "Not bot operator");
        _;
    }
    
    constructor(address _bridgeProcessor, address _botOperator) {
        bridgeProcessor = _bridgeProcessor;
        botOperator = _botOperator;
    }
    
    // Deposit USDC to vault
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be positive");
        require(amount <= MAX_DEPOSIT, "Deposit exceeds maximum");
        require(msg.sender != address(0), "Invalid sender");
        
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        
        emit FundsDeposited(msg.sender, amount, block.timestamp);
    }
    
    // Execute arbitrage (called by bridge processor)
    function executeArbitrage(
        address dexRouter,
        bytes calldata swapData,
        uint256 expectedProfit,
        uint256 minAmountOut
    ) external nonReentrant onlyBridgeProcessor whenNotPaused returns (uint256) {
        require(expectedProfit >= MIN_PROFIT_USDC, "Profit too low");
        require(dexRouter != address(0), "Invalid DEX router");
        require(minAmountOut > 0, "Invalid min amount out");
        
        // Get current balance
        uint256 balanceBefore = IERC20(USDC).balanceOf(address(this));
        require(balanceBefore > 0, "Insufficient balance");
        
        // Execute swap
        (bool success, ) = dexRouter.call(swapData);
        require(success, "Swap failed");
        
        // Calculate actual result
        uint256 balanceAfter = IERC20(USDC).balanceOf(address(this));
        uint256 actualAmountOut = balanceAfter - balanceBefore;
        
        // Slippage protection
        require(actualAmountOut >= minAmountOut, "Slippage exceeded");
        
        // Calculate profit (should be positive if arbitrage succeeded)
        uint256 profit = actualAmountOut > balanceBefore ? actualAmountOut - balanceBefore : 0;
        require(profit >= expectedProfit, "Profit less than expected");
        
        // Update statistics
        totalProfit += profit;
        totalTrades++;
        
        emit ArbitrageExecuted(totalTrades, msg.sender, profit, block.timestamp);
        
        return profit;
    }
    
    // Bridge funds to Stacks
    function bridgeToStacks(
        uint256 amount,
        string calldata stacksAddress
    ) external onlyBotOperator returns (bytes32) {
        require(amount > 0, "Amount must be positive");
        require(bytes(stacksAddress).length > 0, "Invalid Stacks address");
        
        // Approve bridge contract
        IERC20(USDC).approve(bridgeProcessor, amount);
        
        // Generate bridge transaction ID
        bytes32 bridgeTxId = keccak256(abi.encodePacked(
            amount, 
            stacksAddress, 
            block.timestamp,
            totalTrades
        ));
        
        emit BridgeInitiated(bridgeTxId, amount, stacksAddress, block.timestamp);
        
        return bridgeTxId;
    }
    
    // Withdraw profits
    function withdrawProfits(uint256 amount) external onlyBotOperator nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be positive");
        require(amount <= IERC20(USDC).balanceOf(address(this)), "Insufficient balance");
        
        IERC20(USDC).safeTransfer(botOperator, amount);
        
        emit FundsWithdrawn(botOperator, amount, block.timestamp);
    }
    
    // Emergency withdrawal (owner only, bypasses pause)
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        
        IERC20(USDC).safeTransfer(owner(), amount);
        
        emit EmergencyWithdrawal(owner(), amount, block.timestamp);
    }
    
    // Propose bridge processor update (requires timelock)
    function proposeBridgeProcessorUpdate(address newProcessor) external onlyOwner {
        require(newProcessor != address(0), "Invalid address");
        pendingBridgeProcessor = newProcessor;
        timelockStartTime = block.timestamp;
        
        emit BridgeProcessorUpdateProposed(newProcessor, block.timestamp + TIMELOCK_DELAY);
    }
    
    // Execute bridge processor update after timelock
    function executeBridgeProcessorUpdate() external onlyOwner {
        require(pendingBridgeProcessor != address(0), "No pending update");
        require(block.timestamp >= timelockStartTime + TIMELOCK_DELAY, "Timelock active");
        
        bridgeProcessor = pendingBridgeProcessor;
        pendingBridgeProcessor = address(0);
        timelockStartTime = 0;
    }
    
    // Propose bot operator update (requires timelock)
    function proposeBotOperatorUpdate(address newOperator) external onlyOwner {
        require(newOperator != address(0), "Invalid address");
        pendingBotOperator = newOperator;
        timelockStartTime = block.timestamp;
        
        emit BotOperatorUpdateProposed(newOperator, block.timestamp + TIMELOCK_DELAY);
    }
    
    // Execute bot operator update after timelock
    function executeBotOperatorUpdate() external onlyOwner {
        require(pendingBotOperator != address(0), "No pending update");
        require(block.timestamp >= timelockStartTime + TIMELOCK_DELAY, "Timelock active");
        
        botOperator = pendingBotOperator;
        pendingBotOperator = address(0);
        timelockStartTime = 0;
    }
    
    // Pause contract (owner only)
    function pause() external onlyOwner {
        _pause();
    }
    
    // Unpause contract (owner only)
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Get vault statistics
    function getVaultStats() external view returns (
        uint256 balance,
        uint256 totalProfitAmount,
        uint256 totalTradesCount
    ) {
        balance = IERC20(USDC).balanceOf(address(this));
        totalProfitAmount = totalProfit;
        totalTradesCount = totalTrades;
    }
}
