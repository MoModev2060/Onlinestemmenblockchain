App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  //Initialiseren van onze app.
  init: function() {
    return App.initWeb3();
  },

  //Initialiseren van Web3 - connecten van onze blockchain met onze website.
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  //Onze contract initialiseren
  initContract: function() {
    $.getJSON("Verkiezing.json", function(verkiezing) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Verkiezing = TruffleContract(verkiezing);
      // Connect provider to interact with contract
      App.contracts.Verkiezing.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Verkiezing.deployed().then(function(instance) {
      // Restart chrome if you are unable to receive this event
      // This is a known issua with Metamask
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },
  
   render: function() {
    var verkiezingInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data - list candidate
    App.contracts.Verkiezing.deployed().then(function(instance) {
      verkiezingInstance = instance;
      return verkiezingInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      //Loop om alle kandidaten te listen.
      for (var i = 1; i <= candidatesCount; i++) {
        verkiezingInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return verkiezingInstance.voters(App.account);
    }).then(function(hasVoted) {
      //Do not allow a user to vote
      if (hasVoted) {
        $('form').hide(); // dit gaat de button verbergen als er gestemd is.
      }
      //STOP de loader
      loader.hide();
      //Resultaten laten zien
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  // Cast a vote with the smart contract
  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Verkiezing.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});