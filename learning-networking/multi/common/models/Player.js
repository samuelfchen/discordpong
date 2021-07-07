// REQUIRE
var uuid = require('node-uuid'); // required package for generating unique, hard to predict player IDs.

module.exports = function (Player) {
    
    // when POST "/setlocation" is called, update the model data with new values and return player list
    Player.setlocation = function (guid, x, y, cb) {

        // find player model to update by GUID
        Player.findOne(
                    {
                        where: { GUID: guid }
                    }, function (err, player) {
                        
                        if (player != null) {

                            // udpate the values and save
                            player.LocationX = x;
                            player.LocationY = y;
                            player.LastCheck = new Date(); // update this to prevent the player from being wiped later
                            player.save();

                            // get all players and return to client
                            Player.find(function (err, players) {
                                if (players != null) {
                                    for (var p = 0; p < players.length; p++) {
                                        var player = players[p];

                                        // before returning player, check if player hasn't posted for 10 seconds.
                                        var currentTime = new Date();
                                        if (currentTime.getTime() > player.LastCheck.getTime() + 10000) {

                                            // remove the player if stale
                                            Player.destroyById(player.id, function (err, players) { });

                                        }

                                        // hide the player GUID
                                        player.GUID = "";
                                    }
                                }

                                // return players
                                cb(null, players);
                            });
                            
                        } else {
                            // TODO: return error
                            cb(null, null);
                        }
                    });
    }
    // expose remote method and configure paramters.
    Player.remoteMethod(
        'setlocation',
        {
            accepts: [{ arg: 'guid', type: 'string' }, { arg: 'x', type: 'number' }, { arg: 'y', type: 'number' }],
            returns: { arg: 'players', type: 'object' }
        }
    );
    

    // first call from client upon page load
    Player.initgame = function (cb) {
        
        // generate unique ID
        var playerGuid = uuid.v1();        

        // create player
        Player.create([
            { GUID: playerGuid, LocationX: 0, LocationY: 0, LastCheck: new Date() }
        ], function (err, players) {
            if (err) throw err;
            if (players != null) {
                console.log('Player Model Created: \n', players);

                // return GUID and ID
                cb(null, players[0].GUID, players[0].id);

            } else {

                cb(null, 'ERROR', -1);

            }
        });

    }
    // expose remote method and configure return paramters.
    Player.remoteMethod(
        'initgame',
        {
            returns: [{ arg: 'GUID', type: 'string' }, { arg: 'id', type: 'number' }]
        }
    );

};
