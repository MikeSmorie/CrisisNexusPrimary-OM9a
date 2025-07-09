// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EmergencyResponseLogger
 * @dev Smart contract for immutable emergency response audit logging
 * @author DisasterMng-1-OM9 Team
 */
contract EmergencyResponseLogger is AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant LOGGER_ROLE = keccak256("LOGGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Event types for emergency response
    enum EventType {
        INCIDENT_CREATED,
        DECISION_APPROVED,
        RESOURCE_ALLOCATED,
        RESOLUTION_SUBMITTED,
        SYSTEM_ALERT,
        USER_ACTION
    }
    
    // Main log entry structure
    struct LogEntry {
        bytes32 eventHash;          // Hash of event data
        bytes32 userRoleHash;       // Hash of user role + ID
        bytes32 locationHash;       // Hash of geographic coordinates
        bytes32 metadataHash;       // Hash of additional metadata
        uint256 timestamp;          // Block timestamp
        EventType eventType;        // Type of emergency event
        bool verified;              // Manual verification status
        address logger;             // Address that logged the event
    }
    
    // Batch processing for gas optimization
    struct BatchInfo {
        bytes32 merkleRoot;         // Merkle root of batch
        uint256 logCount;           // Number of logs in batch
        uint256 timestamp;          // Batch creation timestamp
        bool finalized;             // Whether batch is finalized
    }
    
    // State variables
    mapping(bytes32 => LogEntry) public logs;
    mapping(bytes32 => BatchInfo) public batches;
    mapping(address => uint256) public loggerCounts;
    
    bytes32[] public logIds;
    bytes32[] public batchIds;
    
    uint256 public totalLogs;
    uint256 public totalBatches;
    uint256 public constant MAX_BATCH_SIZE = 1000;
    
    // Events
    event EmergencyEventLogged(
        bytes32 indexed eventId,
        bytes32 indexed eventHash,
        EventType indexed eventType,
        address logger,
        uint256 timestamp
    );
    
    event BatchCreated(
        bytes32 indexed batchId,
        bytes32 merkleRoot,
        uint256 logCount,
        uint256 timestamp
    );
    
    event EventVerified(
        bytes32 indexed eventId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event LoggerAdded(address indexed logger, address indexed admin);
    event LoggerRemoved(address indexed logger, address indexed admin);
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(LOGGER_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Log an emergency event to the blockchain
     * @param eventId Unique identifier for the event
     * @param eventHash Hash of the event data
     * @param userRoleHash Hash of user role and ID
     * @param locationHash Hash of geographic coordinates
     * @param metadataHash Hash of additional metadata
     * @param eventType Type of emergency event
     */
    function logEmergencyEvent(
        bytes32 eventId,
        bytes32 eventHash,
        bytes32 userRoleHash,
        bytes32 locationHash,
        bytes32 metadataHash,
        EventType eventType
    ) external onlyRole(LOGGER_ROLE) nonReentrant whenNotPaused {
        require(eventId != bytes32(0), "Event ID cannot be zero");
        require(eventHash != bytes32(0), "Event hash cannot be zero");
        require(logs[eventId].timestamp == 0, "Event already logged");
        
        logs[eventId] = LogEntry({
            eventHash: eventHash,
            userRoleHash: userRoleHash,
            locationHash: locationHash,
            metadataHash: metadataHash,
            timestamp: block.timestamp,
            eventType: eventType,
            verified: false,
            logger: msg.sender
        });
        
        logIds.push(eventId);
        loggerCounts[msg.sender]++;
        totalLogs++;
        
        emit EmergencyEventLogged(
            eventId,
            eventHash,
            eventType,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Create a batch of logs with merkle root for gas optimization
     * @param batchId Unique identifier for the batch
     * @param merkleRoot Merkle root of the batch
     * @param logCount Number of logs in the batch
     */
    function createBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 logCount
    ) external onlyRole(LOGGER_ROLE) nonReentrant whenNotPaused {
        require(batchId != bytes32(0), "Batch ID cannot be zero");
        require(merkleRoot != bytes32(0), "Merkle root cannot be zero");
        require(logCount > 0 && logCount <= MAX_BATCH_SIZE, "Invalid log count");
        require(batches[batchId].timestamp == 0, "Batch already exists");
        
        batches[batchId] = BatchInfo({
            merkleRoot: merkleRoot,
            logCount: logCount,
            timestamp: block.timestamp,
            finalized: true
        });
        
        batchIds.push(batchId);
        totalBatches++;
        
        emit BatchCreated(batchId, merkleRoot, logCount, block.timestamp);
    }
    
    /**
     * @dev Verify an event (manual verification by authorized verifier)
     * @param eventId The event ID to verify
     */
    function verifyEvent(bytes32 eventId) external onlyRole(VERIFIER_ROLE) {
        require(logs[eventId].timestamp > 0, "Event does not exist");
        require(!logs[eventId].verified, "Event already verified");
        
        logs[eventId].verified = true;
        
        emit EventVerified(eventId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if an event exists and return its details
     * @param eventId The event ID to check
     * @return exists Whether the event exists
     * @return logEntry The log entry details
     */
    function getEvent(bytes32 eventId) external view returns (bool exists, LogEntry memory logEntry) {
        exists = logs[eventId].timestamp > 0;
        if (exists) {
            logEntry = logs[eventId];
        }
    }
    
    /**
     * @dev Get batch information
     * @param batchId The batch ID to query
     * @return exists Whether the batch exists
     * @return batchInfo The batch information
     */
    function getBatch(bytes32 batchId) external view returns (bool exists, BatchInfo memory batchInfo) {
        exists = batches[batchId].timestamp > 0;
        if (exists) {
            batchInfo = batches[batchId];
        }
    }
    
    /**
     * @dev Verify event integrity using merkle proof
     * @param eventId The event ID to verify
     * @param batchId The batch ID containing the event
     * @param merkleProof Merkle proof for the event
     * @return valid Whether the proof is valid
     */
    function verifyMerkleProof(
        bytes32 eventId,
        bytes32 batchId,
        bytes32[] calldata merkleProof
    ) external view returns (bool valid) {
        require(logs[eventId].timestamp > 0, "Event does not exist");
        require(batches[batchId].timestamp > 0, "Batch does not exist");
        
        bytes32 computedHash = keccak256(abi.encode(logs[eventId]));
        bytes32 merkleRoot = batches[batchId].merkleRoot;
        
        return _verifyMerkleProof(merkleProof, merkleRoot, computedHash);
    }
    
    /**
     * @dev Internal merkle proof verification
     */
    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
    
    /**
     * @dev Get total number of logs
     */
    function getTotalLogs() external view returns (uint256) {
        return totalLogs;
    }
    
    /**
     * @dev Get total number of batches
     */
    function getTotalBatches() external view returns (uint256) {
        return totalBatches;
    }
    
    /**
     * @dev Get log count for a specific logger
     */
    function getLoggerCount(address logger) external view returns (uint256) {
        return loggerCounts[logger];
    }
    
    /**
     * @dev Get paginated log IDs
     * @param offset Starting index
     * @param limit Number of results to return
     */
    function getLogIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        require(offset < logIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > logIds.length) {
            end = logIds.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = logIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get paginated batch IDs
     * @param offset Starting index
     * @param limit Number of results to return
     */
    function getBatchIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        require(offset < batchIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > batchIds.length) {
            end = batchIds.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = batchIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Add a new logger (admin only)
     * @param logger Address to grant logger role
     */
    function addLogger(address logger) external onlyRole(ADMIN_ROLE) {
        require(logger != address(0), "Invalid logger address");
        _grantRole(LOGGER_ROLE, logger);
        emit LoggerAdded(logger, msg.sender);
    }
    
    /**
     * @dev Remove a logger (admin only)
     * @param logger Address to revoke logger role
     */
    function removeLogger(address logger) external onlyRole(ADMIN_ROLE) {
        _revokeRole(LOGGER_ROLE, logger);
        emit LoggerRemoved(logger, msg.sender);
    }
    
    /**
     * @dev Add a new verifier (admin only)
     * @param verifier Address to grant verifier role
     */
    function addVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        require(verifier != address(0), "Invalid verifier address");
        _grantRole(VERIFIER_ROLE, verifier);
    }
    
    /**
     * @dev Remove a verifier (admin only)
     * @param verifier Address to revoke verifier role
     */
    function removeVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, verifier);
    }
    
    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency function to update event hash (admin only, for corrections)
     * @param eventId The event ID to update
     * @param newEventHash The new event hash
     */
    function emergencyUpdateEventHash(
        bytes32 eventId,
        bytes32 newEventHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(logs[eventId].timestamp > 0, "Event does not exist");
        require(newEventHash != bytes32(0), "New hash cannot be zero");
        
        logs[eventId].eventHash = newEventHash;
        logs[eventId].verified = false; // Reset verification status
    }
}