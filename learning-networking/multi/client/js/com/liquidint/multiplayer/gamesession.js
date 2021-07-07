function GameSession() {
    console.log('New GameSession');
    this.sessionToken = "somerandomtoken";    
    console.log('GameSession Created');   
}

GameSession.prototype = {
    constructor: GameSession
}

GameSession.prototype.init = function () {
    console.log('GameSession Initialized');
}