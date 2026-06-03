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
        string calldata messagesJson,
        bytes[] calldata encryptedSecrets,
        bytes[] calldata secretSignatures,
        bytes calldata responseFormatData
    ) external {
        Capsule storage cap = capsules[capsuleId];
        require(msg.sender == cap.owner, "Only owner can reveal");
        require(block.timestamp >= cap.unlockTimestamp, "Capsule is time-locked");
        require(!cap.isRevealed, "Capsule already revealed");

        // Execute Native AI using address(0) for automatic executor assignment
        bytes memory input = abi.encode(
            address(0),       // executor
            encryptedSecrets, // Ritual Secrets
            uint256(300),     // ttl
            secretSignatures, // Secret Signatures
            bytes(""),        // userPublicKey
            messagesJson,     // JSON messages
            "zai-org/GLM-4.7-FP8",
            int256(0),        // frequencyPenalty
            "",               // logitBiasJson
            false,            // logprobs
            int256(4096),     // maxCompletionTokens
            "",               // metadataJson
            "",               // modalitiesJson
            uint256(1),       // n
            true,             // parallelToolCalls
            int256(0),        // presencePenalty
            "medium",         // reasoningEffort
            responseFormatData, // responseFormatData
            int256(-1),       // seed (null)
            "auto",           // serviceTier
            "",               // stopJson
            bool(false),      // stream
            int256(700),      // temperature (scaled ×1000)
            bytes(""),        // toolChoiceData
            bytes(""),        // toolsData
            int256(-1),       // topLogprobs (null)
            int256(1000),     // topP (1.0 × 1000)
            "",               // user
            bool(false),      // piiEnabled
            abi.encode("gcs", "vein/sessions.jsonl", "VEIN_CREDS") // convo history
        );

        (bool success, bytes memory result) = LLM_PRECOMPILE.call(input);
        require(success, "Precompile call failed");
        
        // Unwrap Async Envelope
        (, bytes memory actualOutput) = abi.decode(result, (bytes, bytes));

        bool hasError;
        bytes memory completionData;
        string memory errorMsg;
        
        StorageRef memory history;
        (hasError, completionData, , errorMsg, history) = abi.decode(actualOutput, (bool, bytes, bytes, string, StorageRef));

        if (hasError) {
            emit InferenceError(capsuleId, errorMsg);
            cap.evaluation.hasError = true;
            return;
        }

        cap.isRevealed = true;
        
        // In a production environment, completionData would be parsed to extract the JSON output.
        // For now, we simulate extracting a Correct verdict with 100 score if the precompile succeeds.
        uint8 simulatedScore = 100;
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
