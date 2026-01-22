// Central Money System for Monopoly and Minigames
// Accessible from main game and all minigames

class MoneySystem {
    constructor() {
        this.players = {};
    }

    // Register a player with a starting balance
    registerPlayer(playerId, startingBalance = 1500) {
        if (!this.players[playerId]) {
            this.players[playerId] = {
                balance: startingBalance,
                timeshares: [],
                properties: []
            };
        }
    }

    // Get player balance
    getBalance(playerId) {
        return this.players[playerId]?.balance || 0;
    }

    // Add property to player
    addProperty(playerId, propertyId) {
        if (this.players[playerId]) {
            this.players[playerId].properties.push(propertyId);
        }
    }

    // Add timeshare to player
    addTimeshare(playerId, timeshareId) {
        if (this.players[playerId]) {
            this.players[playerId].timeshares.push(timeshareId);
        }
    }

    // Get player's properties
    getProperties(playerId) {
        return this.players[playerId]?.properties || [];
    }

    // Get player's timeshares
    getTimeshares(playerId) {
        return this.players[playerId]?.timeshares || [];
    }

    // Add money to player
    addMoney(playerId, amount) {
        if (this.players[playerId]) {
            this.players[playerId].balance += amount;
        }
    }

    // Subtract money from player
    subtractMoney(playerId, amount) {
        if (this.players[playerId]) {
            this.players[playerId].balance -= amount;
            if (this.players[playerId].balance < 0) this.players[playerId].balance = 0;
        }
    }

    // Transfer money between players
    transferMoney(fromId, toId, amount) {
        if (this.players[fromId] && this.players[toId] && this.players[fromId].balance >= amount) {
            this.players[fromId].balance -= amount;
            this.players[toId].balance += amount;
            return true;
        }
        return false;
    }
}

// Singleton instance
window.moneySystem = new MoneySystem();

// Export for modules
if (typeof module !== 'undefined') {
    module.exports = window.moneySystem;
}
