pragma solidity 0.5.16;

contract Verkiezing {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }
    //Store accounts that have voted
    mapping(address => bool) public voters;

    // Store/Read/write candidates --> handig voor getter function
    mapping(uint => Candidate) public candidates;

    // Store Candidates Count
    uint public candidatesCount; 

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    // Constructor
    constructor () public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    // Adding a candidate - private zodat niemand anders een kandidaat kan bijvoegen.
    function addCandidate (string memory _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // Require that they heven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }
}