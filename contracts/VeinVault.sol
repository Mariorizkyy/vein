// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VeinVault {
    address constant LLM_PRECOMPILE = 0x0000000000000000000000000000000000000802;
    address constant RITUAL_WALLET  = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;

    enum Verdict { PENDING, CORRECT, PARTIALLY_CORRECT, INCORRECT, UNVERIFIABLE }

    struct Evaluation {
        uint8 score;
        Verdict verdict;
        bool hasError;
    }

    struct StorageRef {
        string platform;
        string path;
        string key_ref;
    }

    struct Capsule {
        uint256 id;
        address owner;
        string category;
        uint256 createdAt;
        uint256 unlockTimestamp;
        string encryptedPayloadHash;
        bool isRevealed;
        Evaluation evaluation;
    }

    uint256 private _capsuleIds;
    mapping(uint256 => Capsule) public capsules;
    mapping(address => uint256[]) public userCapsules;

    // Reputation: Proof of Conviction
    mapping(address => uint256) public userTotalScore;
    mapping(address => uint256) public userEvaluatedCapsules;

    event CapsuleCreated(uint256 indexed id, address indexed owner, uint256 unlockTimestamp);
    event CapsuleRevealed(uint256 indexed id, address indexed owner);
    event VerdictStored(uint256 indexed id, Verdict verdict, uint8 score);
    event InferenceError(uint256 indexed id, string errorMsg);

    function depositForFees(uint256 lockDuration) external payable {
        (bool ok,) = RITUAL_WALLET.call{value: msg.value}(
            abi.encodeWithSignature("deposit(uint256)", lockDuration)
        );
        require(ok, "Deposit failed");
    }

    function createCapsule(
        string memory category,
        uint256 unlockTimestamp,
        string memory encryptedPayloadHash
    ) external returns (uint256) {
        require(unlockTimestamp > block.timestamp, "Unlock time must be in the future");

        _capsuleIds++;
        uint256 newId = _capsuleIds;

        Evaluation memory emptyEval;

        capsules[newId] = Capsule({
            id: newId,
            owner: msg.sender,
            category: category,
            createdAt: block.timestamp,
            unlockTimestamp: unlockTimestamp,
            encryptedPayloadHash: encryptedPayloadHash,
            isRevealed: false,
            evaluation: emptyEval
        });

        userCapsules[msg.sender].push(newId);

        emit CapsuleCreated(newId, msg.sender, unlockTimestamp);
        return newId;
    }

    // Ritual Native AI Execution
    function triggerUnlockAndEvaluate(
        uint256 capsuleId,
        address executor,
        string calldata messagesJson,
        bytes[] calldata encryptedSecrets,
        bytes[] calldata secretSignatures,
        bytes calldata responseFormatData
    ) external {
        Capsule storage cap = capsules[capsuleId];
        require(msg.sender == cap.owner, "Only owner can reveal");
        require(block.timestamp >= cap.unlockTimestamp, "Capsule is time-locked");
        require(!cap.isRevealed, "Capsule already revealed");

        cap.isRevealed = true;
        
        // HACKATHON MVP: Bypass actual LLM precompile call to avoid testnet reverts due to missing GCS/Secrets.
        // We simulate a successful extraction of a Correct verdict with a high score.
        uint8 simulatedScore = 95;
        Verdict simulatedVerdict = Verdict.CORRECT;

        cap.evaluation = Evaluation({
            score: simulatedScore,
            verdict: simulatedVerdict,
            hasError: false
        });

        userTotalScore[cap.owner] += simulatedScore;
        userEvaluatedCapsules[cap.owner]++;

        emit CapsuleRevealed(capsuleId, cap.owner);
        emit VerdictStored(capsuleId, simulatedVerdict, simulatedScore);
    }

    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return userCapsules[user];
    }

    function getConvictionScore(address user) external view returns (uint256) {
        if (userEvaluatedCapsules[user] == 0) return 0;
        return userTotalScore[user] / userEvaluatedCapsules[user];
    }
}
