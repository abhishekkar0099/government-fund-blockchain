// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract GovernmentFund {

    address public admin;

    enum ProjectStatus {
        PLANNED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    struct Project {
        uint256 id;
        string projectId;
        string name;
        uint256 allocatedAmount;
        uint256 releasedAmount;
        uint256 spentAmount;
        ProjectStatus status;
        bool active;
    }

    struct Transaction {
        uint256 projectId;
        string transactionType;
        uint256 amount;
        address performedBy;
        uint256 timestamp;

        // Patent-oriented evidence fields
        string expenseId;
        bytes32 evidenceHash;
    }

    uint256 private nextProjectId = 1;

    mapping(uint256 => Project) public projects;

    mapping(uint256 => Transaction[]) private projectTransactions;

    mapping(address => bool) public officers;

    // Prevent the same expense from being recorded twice
    mapping(bytes32 => bool) public recordedExpenses;

    // ============================================
    // EVENTS
    // ============================================

    event ProjectCreated(
        uint256 indexed blockchainProjectId,
        string projectId,
        string name,
        address createdBy
    );

    event FundAllocated(
        uint256 indexed blockchainProjectId,
        uint256 amount,
        address allocatedBy
    );

    event FundReleased(
        uint256 indexed blockchainProjectId,
        uint256 amount,
        address releasedBy
    );

    event ExpenseRecorded(
        uint256 indexed blockchainProjectId,
        string expenseId,
        uint256 amount,
        bytes32 evidenceHash,
        address recordedBy
    );

    event OfficerAdded(
        address indexed officer
    );

    event OfficerRemoved(
        address indexed officer
    );

    event ProjectCompleted(
        uint256 indexed blockchainProjectId,
        address completedBy
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    modifier onlyAdminOrOfficer() {
        require(
            msg.sender == admin || officers[msg.sender],
            "Not authorized"
        );
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        admin = msg.sender;
    }

    // ============================================
    // OFFICER MANAGEMENT
    // ============================================

    function addOfficer(
        address _officer
    ) public onlyAdmin {

        require(
            _officer != address(0),
            "Invalid officer address"
        );

        officers[_officer] = true;

        emit OfficerAdded(_officer);
    }

    function removeOfficer(
        address _officer
    ) public onlyAdmin {

        officers[_officer] = false;

        emit OfficerRemoved(_officer);
    }

    // ============================================
    // CREATE PROJECT
    // ============================================

    function createProject(
        string memory _projectId,
        string memory _name
    )
        public
        onlyAdmin
        returns (uint256)
    {
        uint256 id = nextProjectId;

        projects[id] = Project({
            id: id,
            projectId: _projectId,
            name: _name,
            allocatedAmount: 0,
            releasedAmount: 0,
            spentAmount: 0,
            status: ProjectStatus.PLANNED,
            active: true
        });

        nextProjectId++;

        emit ProjectCreated(
            id,
            _projectId,
            _name,
            msg.sender
        );

        return id;
    }

    // ============================================
    // ALLOCATE FUND
    // ============================================

    function allocateFund(
        uint256 _projectId,
        uint256 _amount
    )
        public
        onlyAdmin
    {
        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            _amount > 0,
            "Amount must be greater than zero"
        );

        projects[_projectId].allocatedAmount += _amount;

        projectTransactions[_projectId].push(
            Transaction({
                projectId: _projectId,
                transactionType: "FUND_ALLOCATION",
                amount: _amount,
                performedBy: msg.sender,
                timestamp: block.timestamp,
                expenseId: "",
                evidenceHash: bytes32(0)
            })
        );

        emit FundAllocated(
            _projectId,
            _amount,
            msg.sender
        );
    }

    // ============================================
    // RELEASE FUND
    // ============================================

    function releaseFund(
        uint256 _projectId,
        uint256 _amount
    )
        public
        onlyAdmin
    {
        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            _amount > 0,
            "Amount must be greater than zero"
        );

        require(
            projects[_projectId].releasedAmount + _amount
                <= projects[_projectId].allocatedAmount,
            "Release exceeds allocation"
        );

        projects[_projectId].releasedAmount += _amount;

        projects[_projectId].status =
            ProjectStatus.IN_PROGRESS;

        projectTransactions[_projectId].push(
            Transaction({
                projectId: _projectId,
                transactionType: "FUND_RELEASE",
                amount: _amount,
                performedBy: msg.sender,
                timestamp: block.timestamp,
                expenseId: "",
                evidenceHash: bytes32(0)
            })
        );

        emit FundReleased(
            _projectId,
            _amount,
            msg.sender
        );
    }

    // ============================================
    // RECORD EXPENSE WITH EVIDENCE
    // ============================================

    function recordExpense(
        uint256 _projectId,
        string memory _expenseId,
        uint256 _amount,
        bytes32 _evidenceHash
    )
        public
        onlyAdminOrOfficer
    {
        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            _amount > 0,
            "Amount must be greater than zero"
        );

        require(
            bytes(_expenseId).length > 0,
            "Expense ID required"
        );

        require(
            projects[_projectId].spentAmount + _amount
                <= projects[_projectId].releasedAmount,
            "Expense exceeds released funds"
        );

        // Unique key for preventing duplicate blockchain expense records
        bytes32 expenseKey = keccak256(
            abi.encodePacked(
                _projectId,
                _expenseId
            )
        );

        require(
            !recordedExpenses[expenseKey],
            "Expense already recorded"
        );

        recordedExpenses[expenseKey] = true;

        projects[_projectId].spentAmount += _amount;

        projectTransactions[_projectId].push(
            Transaction({
                projectId: _projectId,
                transactionType: "EXPENSE",
                amount: _amount,
                performedBy: msg.sender,
                timestamp: block.timestamp,
                expenseId: _expenseId,
                evidenceHash: _evidenceHash
            })
        );

        emit ExpenseRecorded(
            _projectId,
            _expenseId,
            _amount,
            _evidenceHash,
            msg.sender
        );
    }

    // ============================================
    // COMPLETE PROJECT
    // ============================================

    function completeProject(
        uint256 _projectId
    )
        public
        onlyAdminOrOfficer
    {
        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            projects[_projectId].status != ProjectStatus.COMPLETED,
            "Project already completed"
        );

        require(
            projects[_projectId].spentAmount
                <= projects[_projectId].releasedAmount,
            "Invalid expenditure"
        );

        projects[_projectId].status =
            ProjectStatus.COMPLETED;

        emit ProjectCompleted(
            _projectId,
            msg.sender
        );
    }

    // ============================================
    // GET PROJECT
    // ============================================

    function getProject(
        uint256 _projectId
    )
        public
        view
        returns (Project memory)
    {
        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        return projects[_projectId];
    }

    // ============================================
    // TRANSACTION COUNT
    // ============================================

    function getTransactionCount(
        uint256 _projectId
    )
        public
        view
        returns (uint256)
    {
        return projectTransactions[_projectId].length;
    }

    // ============================================
    // GET TRANSACTION
    // ============================================

    function getTransaction(
        uint256 _projectId,
        uint256 _index
    )
        public
        view
        returns (Transaction memory)
    {
        require(
            _index < projectTransactions[_projectId].length,
            "Transaction does not exist"
        );

        return projectTransactions[_projectId][_index];
    }
}