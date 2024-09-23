import { joinRoom } from 'trystero';

class Lobby {
  constructor(name) {
    this.name = name;
    this._lobbyPlayers = [];
    this._lobbyRoom = null;
    this.setupLobby();
  }

  // Setup the lobby and handle peer connections
  setupLobby() {
    // Join the Trystero room
    this._lobbyRoom = joinRoom({ appId: 'com.freehuntx.bomberpengu' }, 'lobby');

    // Handle new peers joining the lobby
    this._lobbyRoom.onPeerJoin(peerId => {
      console.log('[Lobby] peer joined', peerId);
      this.sendJoin({ name: this.name }, peerId); // Send the join message to new peer
    });

    // Handle peers leaving
    this._lobbyRoom.onPeerLeave(peerId => {
      console.log('[Lobby] peer left', peerId);
      this.removeLobbyPlayer(peerId); // Remove the player who left
    });

    // Receive 'join' message from other peers
    this.getJoin((data, peerId) => {
      console.log('[Lobby] join received from', peerId);
      this.addLobbyPlayer(new LobbyPlayer(peerId, data.name, 0));
    });

    // Handle player state updates
    this.getUpdate((data, peerId) => {
      console.log(`[Lobby] update received from ${peerId}:`, data);
      const lobbyPlayer = this._lobbyPlayers.find(e => e.id === peerId);
      if (!lobbyPlayer) return;

      lobbyPlayer.state = data.state;
      this.recvXml(`<playerUpdate name="${lobbyPlayer.name}" skill="${lobbyPlayer.skill}" state="${lobbyPlayer.state}" />`);
    });
  }

  // Function to send join message
  sendJoin(data, peerId) {
    console.log('[Lobby] Sending join message to peer:', peerId);
    this._lobbyRoom.send('join', data, peerId);
  }

  // Function to receive join message
  getJoin(callback) {
    this._lobbyRoom.onMessage('join', (data, peerId) => {
      callback(data, peerId);
    });
  }

  // Function to handle player state updates
  sendUpdate(data, peerId) {
    console.log('[Lobby] Sending update:', data);
    this._lobbyRoom.send('update', data, peerId);
  }

  // Function to handle receiving player state updates
  getUpdate(callback) {
    this._lobbyRoom.onMessage('update', (data, peerId) => {
      callback(data, peerId);
    });
  }

  // Add player to the lobby
  addLobbyPlayer(player) {
    console.log('[Lobby] Adding player:', player);
    this._lobbyPlayers.push(player);
    this.recvXml(`<playerJoined name="${player.name}" skill="${player.skill}" />`);
  }

  // Remove player from the lobby
  removeLobbyPlayer(peerId) {
    const index = this._lobbyPlayers.findIndex(player => player.id === peerId);
    if (index !== -1) {
      console.log('[Lobby] Removing player:', this._lobbyPlayers[index].name);
      this._lobbyPlayers.splice(index, 1);
      this.recvXml(`<playerLeft name="${this._lobbyPlayers[index].name}" />`);
    }
  }

  // Challenge logic
  recvChallenge(doc) {
    const data = readAttributes(doc);
    const lobbyPlayer = this._lobbyPlayers.find(e => e.name === data.name);

    if (!lobbyPlayer) return;

    // Challenge logic: Send a challenge invite to the specified player
    console.log(`[Lobby] Challenging player: ${lobbyPlayer.name}`);
    this.sendChallenge(lobbyPlayer);
  }

  sendChallenge(lobbyPlayer) {
    // Here you send a challenge invite to the selected player
    console.log(`[Lobby] Sending challenge invite to: ${lobbyPlayer.name}`);
    this._lobbyRoom.send('challenge', { name: this.name }, lobbyPlayer.id);
  }

  // Function to receive challenges from peers
  getChallenge(callback) {
    this._lobbyRoom.onMessage('challenge', (data, peerId) => {
      console.log(`[Lobby] Challenge received from: ${data.name}`);
      callback(data, peerId);
    });
  }

  // Placeholder function for receiving XML (mockup function)
  recvXml(xmlString) {
    console.log('[Lobby] XML Received:', xmlString);
  }
}

// Define the LobbyPlayer class (simplified)
class LobbyPlayer {
  constructor(id, name, skill) {
    this.id = id;
    this.name = name;
    this.skill = skill;
    this.state = 'idle'; // Default state
  }
}

// Helper function to parse attributes from XML-like structure (simplified mock)
function readAttributes(doc) {
  // Simplified mock for extracting attributes
  return {
    name: doc.getAttribute('name'),
  };
}

// Usage example
const myLobby = new Lobby('Player1');
