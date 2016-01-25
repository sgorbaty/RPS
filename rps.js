Players = new Mongo.Collection("players");

if (Meteor.isClient) {  
  Session.setDefault('player', '');
  Session.setDefault('otherPlayersChoice', '');
  Session.setDefault('gameResult', '');
  Session.setDefault('playerChoice', '');


  Template.App_RPS.helpers({
    player: function() {
      return 'You are: Player ' + Session.get('player');
    }
  });

  Template.App_Results.helpers({
    playerChoice: function () {
      return Session.get('playerChoice')=='' ? '' : 'Your choice is: ' + Session.get('playerChoice').toUpperCase();
    },
    otherPlayersChoice: function () {
     return Session.get('otherPlayersChoice')=='' ? '' : 'Other\'s choice is: ' + Session.get('otherPlayersChoice').toUpperCase();
    },
    gameResult: function () {
      return Session.get('gameResult')=='' ? '' : 'Result: ' + Session.get('gameResult').toUpperCase();
    }
  });


  Template.App_Results.events({
  'click': function () {
      setProgress(STATE.IDLE,RPS.ROCK);
    }
  });

  Template.App_RPS.events({
    'click #rock': function () {
      setProgress(STATE.PLAYING,RPS.ROCK);
    },
      'click #paper': function () {
      setProgress(STATE.PLAYING,RPS.PAPER);
    },
      'click #scissors': function () {
      setProgress(STATE.PLAYING,RPS.SCISSORS);
    }
  });

  var STATE = {
    IDLE: 0,
    PLAYING: 1,
    FINISHED: 2,    
  };

  var RPS = {
    ROCK: 0,
    PAPER: 1,
    SCISSORS: 2,
    properties: {
      '0' : 'rock',
      '1' : 'paper',
      '2' : 'scissors'
    },
    evaluate: function(userInput, randomInput) {
      var diff = Math.abs(randomInput-userInput);
      if (diff == 0) {
        return 'draw';
      } else if (diff == 1) {
        return randomInput > userInput ? randomInput : userInput;         
      } else if (diff == 2) {
        return randomInput < userInput ? randomInput : userInput;         
      }
    }
  };

  var setProgress = function(val, _choice) {
    var player = Session.get('playerObj');
    Players.update({'_id':player._id},{ $set: { state:val, choice: _choice } });    
  };

  var finishPlaying = function(currPlayer,otherPlayer) {
    Session.set('playerChoice', RPS.properties[currPlayer]);            
    Session.set('otherPlayersChoice',RPS.properties[otherPlayer]);

    var res = RPS.evaluate(currPlayer, otherPlayer);
    
    if (res == currPlayer) {
      Session.set('gameResult','You win');
    } else if (res == otherPlayer) {
      Session.set('gameResult','Other player wins');      
    } else {
      Session.set('gameResult','Draw');
    }
    setProgress(STATE.FINISHED,RPS.ROCK);
  };

  Tracker.autorun( function() {
    if (FlowRouter.subsReady( 'players' ) ) {
      var currentPlayer = Players.findOne({'id': Session.get('player')});      
      var otherPlayer = Players.findOne({'id': Session.get('player') === 1 ? 2 : 1});
      Session.set('playerObj',currentPlayer);

      if(currentPlayer.state === STATE.IDLE) {
        BlazeLayout.render('App_RPS');
      } else if (currentPlayer.state === STATE.PLAYING && otherPlayer.state === STATE.PLAYING) {
        finishPlaying(currentPlayer.choice,otherPlayer.choice);                       
      } else if (currentPlayer.state === STATE.PLAYING && otherPlayer.state === STATE.FINISHED) {
        BlazeLayout.render('App_wait1');                        
      } else if (currentPlayer.state === STATE.FINISHED) {
        BlazeLayout.render('App_Results'); 
      } else {
        BlazeLayout.render('App_wait2');        
      }
    }
  });
  
  FlowRouter.route('/player:id', {
    subscriptions: function(params) {
        this.register('players', Meteor.subscribe('players', params.id));
    },
  action(params, queryParams) {   
    var id = parseInt(FlowRouter.getParam('id'));
    if (id>2 || id<1) {
      BlazeLayout.render('App_notFound');
    } else {
      Session.set('player', id);
    }
  }  
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.publish('players', function() {
      return Players.find(); 
    });    

    if (Players.find().count() === 0) {
      var _players = [ {id:1, state:0, choice:0}, {id:2, state:0, choice:0}];
      for (player in _players) {
        Players.insert(_players[player]);
      }
    }
  });
}
