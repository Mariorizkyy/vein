// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ── Ritual Chain official addresses ──────────────────────────────────────────
// RitualWallet : 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948  (confirmed from docs)
// LLM Precompile: 0x0000000000000000000000000000000000000802
// AsyncDelivery : 0x5A16...39F6  (fill full address from explorer)

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function depositFor(address user, uint256 lockDuration) external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function lockUntil(address account) external view returns (uint256);
}

contract VeinVault {
    // ── Ritual official addresses ─────────────────────────────────────────────
    address constant LLM_PRECOMPILE  = 0x0000000000000000000000000000000000000802;
    address constant RITUAL_WALLET   = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address constant ASYNC_DELIVERY  = 0x5a1694a1f4538C7816dff5f62Ee8cC87c39f39F6; // from docs

    // ── Fee constants (confirmed from Elyra live data) ────────────────────────
    // Inference fee observed: 0.35 RITUAL per LLM call
    // Minimum deposit must cover at least 1 inference call
    uint256 public constant INFERENCE_FEE   = 0.35 ether;
    uint256 public constant MIN_DEPOSIT     = 0.35 ether; // 1 evaluation
    uint256 public constant RECOMMENDED_DEPOSIT = 1.05 ether; // 3 evaluations buffer

    enum Verdict { PENDING, CORRECT, PARTIALLY_CORRECT, INCORRECT, UNVERIFIABLE }

    struct Evaluation {
        uint8   score;
        Verdict verdict;
        bool    hasError;
    }

    struct StorageRef {
        string platform;
        string path;
        string key_ref;
    }

    struct Capsule {
        uint256    id;
        address    owner;
        string     category;
        uint256    createdAt;
        uint256    unlockTimestamp; // in milliseconds (Ritual Testnet quirk)
        string     content;
        bool       isRevealed;
        Evaluation evaluation;
    }

    uint256 private _capsuleIds;
    mapping(uint256 => Capsule)    public capsules;
    mapping(address => uint256[])  public userCapsules;
    mapping(uint256 => address)    public pendingEvaluations; // jobId → owner

    mapping(address => uint256) public userTotalScore;
    mapping(address => uint256) public userEvaluatedCapsules;

    event CapsuleCreated(uint256 indexed id, address indexed owner, uint256 unlockTimestamp);
    event CapsuleRevealed(uint256 indexed id, address indexed owner);
    event VerdictStored(uint256 indexed id, Verdict verdict, uint8 score);
    event InferenceError(uint256 indexed id, string errorMsg);
    event FeesDeposited(address indexed user, uint256 amount, uint256 newBalance);

    // ─── 1. Fund RitualWallet for inference fees ─────────────────────────────
    // Must be called BEFORE triggerUnlockAndEvaluate
    // Minimum: 0.35 RITUAL per evaluation
    // Recommended: 1.05 RITUAL for 3 evaluations buffer
    //
    // IMPORTANT (from Ritual docs):
    //   - Two-phase async precompiles check the EOA's RitualWallet balance, NOT the contract's
    //   - If user interacts through this contract, the EOA must have sufficient balance
    //   - Must fund and lock BEFORE submitting async calls
    //   - Fee is locked at submission time until job settles
    function depositForFees(uint256 lockDurationBlocks) external payable {
        require(msg.value >= MIN_DEPOSIT,
            "Minimum 0.35 RITUAL required (1 inference fee)");

        // Deposit to RitualWallet on behalf of msg.sender (the EOA)
        // lockDurationBlocks: how many blocks to lock (e.g. 100 blocks ≈ a few minutes)
        IRitualWallet(RITUAL_WALLET).depositFor{value: msg.value}(
            msg.sender,
            lockDurationBlocks
        );

        emit FeesDeposited(
            msg.sender,
            msg.value,
            IRitualWallet(RITUAL_WALLET).balanceOf(msg.sender)
        );
    }

    // Convenience: check if EOA has enough balance for N evaluations
    function getRitualWalletBalance(address user) external view returns (uint256) {
        return IRitualWallet(RITUAL_WALLET).balanceOf(user);
    }

    function hasEnoughForEvaluation(address user) external view returns (bool) {
        return IRitualWallet(RITUAL_WALLET).balanceOf(user) >= INFERENCE_FEE;
    }

    // ─── 2. Create a time-locked capsule ─────────────────────────────────────
    function createCapsule(
        string memory category,
        uint256 unlockTimestamp,
        string memory content
    ) external returns (uint256) {
        // Ritual Testnet: block.timestamp is in milliseconds
        require(unlockTimestamp > block.timestamp,
            "Unlock time must be in the future");
        require(bytes(content).length > 0, "Content cannot be empty");

        _capsuleIds++;
        uint256 newId = _capsuleIds;

        Evaluation memory emptyEval;

        capsules[newId] = Capsule({
            id:              newId,
            owner:           msg.sender,
            category:        category,
            createdAt:       block.timestamp,
            unlockTimestamp: unlockTimestamp,
            content:         content,
            isRevealed:      false,
            evaluation:      emptyEval
        });

        userCapsules[msg.sender].push(newId);
        emit CapsuleCreated(newId, msg.sender, unlockTimestamp);
        return newId;
    }

    // ─── 3. Trigger AI evaluation via Ritual LLM Precompile ──────────────────
    // PRE-CONDITION: msg.sender must have >= 0.35 RITUAL in RitualWallet
    // Call depositForFees() first if not already funded
    function triggerUnlockAndEvaluate(
        uint256 capsuleId,
        string calldata messagesJson,
        bytes[] calldata encryptedSecrets,
        bytes[] calldata secretSignatures,
        bytes calldata responseFormatData
    ) external {
        Capsule storage cap = capsules[capsuleId];
        require(msg.sender == cap.owner,    "Only owner can reveal");
        require(block.timestamp >= cap.unlockTimestamp, "Capsule is time-locked");
        require(!cap.isRevealed,            "Already revealed");

        // Warn if EOA balance is insufficient (will revert at precompile level otherwise)
        require(
            IRitualWallet(RITUAL_WALLET).balanceOf(msg.sender) >= INFERENCE_FEE,
            "Insufficient RitualWallet balance. Call depositForFees(100) with 0.35 RITUAL first"
        );

        bytes memory input = abi.encode(
            address(0),
            encryptedSecrets,
            uint256(300),
            secretSignatures,
            bytes(""),
            messagesJson,
            "zai-org/GLM-4.7-FP8",
            int256(0),
            "",
            false,
            int256(512),
            "",
            "",
            uint256(1),
            true,
            int256(0),
            "medium",
            responseFormatData,
            int256(-1),
            "auto",
            "",
            bool(false),
            int256(300), // temperature 0.3 — deterministic JSON
            bytes(""),
            bytes(""),
            int256(-1),
            int256(1000),
            "",
            bool(false),
            abi.encode("gcs", "vein/sessions.jsonl", "VEIN_CREDS")
        );

        (bool success, bytes memory result) = LLM_PRECOMPILE.call(input);
        require(success, "LLM precompile call failed");

        (, bytes memory actualOutput) = abi.decode(result, (bytes, bytes));

        bool hasError;
        bytes memory completionData;
        string memory errorMsg;
        StorageRef memory history;
        (hasError, completionData, , errorMsg, history) = abi.decode(
            actualOutput,
            (bool, bytes, bytes, string, StorageRef)
        );

        if (hasError) {
            emit InferenceError(capsuleId, errorMsg);
            cap.evaluation.hasError = true;
            return;
        }

        cap.isRevealed = true;

        string memory raw = abi.decode(completionData, (string));
        bytes memory b = bytes(raw);

        (uint8 parsedScore, Verdict parsedVerdict) = _parseAIResponse(b);

        cap.evaluation = Evaluation({
            score:    parsedScore,
            verdict:  parsedVerdict,
            hasError: false
        });

        userTotalScore[cap.owner]       += parsedScore;
        userEvaluatedCapsules[cap.owner]++;

        emit CapsuleRevealed(capsuleId, cap.owner);
        emit VerdictStored(capsuleId, parsedVerdict, parsedScore);
    }

    // ─── AI response parser ───────────────────────────────────────────────────
    // Expected: {"score":85,"verdict":"CORRECT"}
    function _parseAIResponse(bytes memory b)
        internal pure returns (uint8 score, Verdict verdict)
    {
        if (_contains(b, '"verdict":"CORRECT"') ||
            _contains(b, '"verdict": "CORRECT"')) {
            verdict = Verdict.CORRECT;
        } else if (_contains(b, '"verdict":"PARTIALLY_CORRECT"') ||
                   _contains(b, '"verdict": "PARTIALLY_CORRECT"')) {
            verdict = Verdict.PARTIALLY_CORRECT;
        } else if (_contains(b, '"verdict":"INCORRECT"') ||
                   _contains(b, '"verdict": "INCORRECT"')) {
            verdict = Verdict.INCORRECT;
        } else {
            verdict = Verdict.UNVERIFIABLE;
        }
        score = _extractScore(b);
    }

    function _extractScore(bytes memory b) internal pure returns (uint8) {
        bytes[2] memory keys = [bytes('"score":'), bytes('"score": ')];
        uint startIdx = type(uint).max;

        for (uint k = 0; k < 2; k++) {
            bytes memory key = keys[k];
            for (uint i = 0; i + key.length <= b.length; i++) {
                bool isMatch = true;
                for (uint j = 0; j < key.length; j++) {
                    if (b[i+j] != key[j]) { isMatch = false; break; }
                }
                if (isMatch) { startIdx = i + key.length; break; }
            }
            if (startIdx != type(uint).max) break;
        }

        if (startIdx == type(uint).max) return 50;

        uint256 result = 0;
        bool found = false;
        for (uint i = startIdx; i < b.length && i < startIdx + 3; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
                found = true;
            } else if (found) break;
        }

        if (!found) return 50;
        if (result > 100) result = 100;
        return uint8(result);
    }

    function _contains(bytes memory src, string memory target)
        internal pure returns (bool)
    {
        bytes memory t = bytes(target);
        if (src.length < t.length) return false;
        for (uint i = 0; i <= src.length - t.length; i++) {
            bool isMatch = true;
            for (uint j = 0; j < t.length; j++) {
                if (src[i+j] != t[j]) { isMatch = false; break; }
            }
            if (isMatch) return true;
        }
        return false;
    }

    // ─── Views ────────────────────────────────────────────────────────────────
    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return userCapsules[user];
    }

    // Average score across all evaluated capsules
    function getConvictionScore(address user) external view returns (uint256) {
        if (userEvaluatedCapsules[user] == 0) return 0;
        return userTotalScore[user] / userEvaluatedCapsules[user];
    }
}
