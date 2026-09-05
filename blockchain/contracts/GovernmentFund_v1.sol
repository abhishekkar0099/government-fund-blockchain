// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GovernmentFundV1 {

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
    }

    uint256 private nextProjectId = 1;

    mapping(uint256 => Project) public projects;

    mapping(uint256 => Transaction[])
        private projectTransactions;

    mapping(address => bool) public officers;

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
        uint256 amount,
        address recordedBy
    );

    event OfficerAdded(
        address indexed officer
    );

    event OfficerRemoved(
        address indexed officer
    );

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

    constructor() {
        admin = msg.sender;
    }

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

    function createProject(
        string memory _projectId,
        string memory _name
    ) public onlyAdmin returns (uint256) {

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

    function allocateFund(
        uint256 _projectId,
        uint256 _amount
    ) public onlyAdmin {

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
                timestamp: block.timestamp
            })
        );

        emit FundAllocated(
            _projectId,
            _amount,
            msg.sender
        );
    }

    function releaseFund(
        uint256 _projectId,
        uint256 _amount
    ) public onlyAdmin {

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
                timestamp: block.timestamp
            })
        );

        emit FundReleased(
            _projectId,
            _amount,
            msg.sender
        );
    }

    function recordExpense(
        uint256 _projectId,
        uint256 _amount
    ) public onlyAdminOrOfficer {

        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            _amount > 0,
            "Amount must be greater than zero"
        );

        require(
            projects[_projectId].spentAmount + _amount
                <= projects[_projectId].releasedAmount,
            "Expense exceeds released funds"
        );

        projects[_projectId].spentAmount += _amount;

        projectTransactions[_projectId].push(
            Transaction({
                projectId: _projectId,
                transactionType: "EXPENSE",
                amount: _amount,
                performedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit ExpenseRecorded(
            _projectId,
            _amount,
            msg.sender
        );
    }

    function completeProject(
        uint256 _projectId
    ) public onlyAdminOrOfficer {

        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        require(
            projects[_projectId].spentAmount
                <= projects[_projectId].releasedAmount,
            "Invalid expenditure"
        );

        projects[_projectId].status =
            ProjectStatus.COMPLETED;
    }

    function getProject(
        uint256 _projectId
    ) public view returns (Project memory) {

        require(
            projects[_projectId].active,
            "Project does not exist"
        );

        return projects[_projectId];
    }

    function getTransactionCount(
        uint256 _projectId
    ) public view returns (uint256) {

        return projectTransactions[_projectId].length;
    }

   function getTransaction(
    uint256 _projectId,
    uint256 _index
) public view returns (Transaction memory) {

    return projectTransactions[_projectId][_index];
}

}