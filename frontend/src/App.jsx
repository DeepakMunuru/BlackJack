import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Game = () => {
  const [gameState, setGameState] = useState(null);
  const [winnerMessage, setWinnerMessage] = useState("");

  useEffect(() => {
    startNewGame();
  }, []);

  const handleHit = () => {
    axios
      .post("http://localhost:3000/game/hit", {
        gameId: gameState._id,
      })
      .then((response) => {
        setGameState(response.data);
        if (response.data.winner) {
          checkWinner(response.data.winner);
        }
      })
      .catch((error) => console.log("Error while hitting", error));
  };

  const handleStand = () => {
    axios
      .post("http://localhost:3000/game/stand", {
        gameId: gameState._id,
      })
      .then((response) => {
        setGameState(response.data);
        if (response.data.winner) {
          checkWinner(response.data.winner);
        }
      })
      .catch((error) => console.log("Error while standing", error));
  };

  const timeoutRef = useRef(null);

  const startNewGame = () => {
    setWinnerMessage("");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // cancel pending reset
      timeoutRef.current = null;
    }

    axios
      .post("http://localhost:3000/game/start")
      .then((response) => setGameState(response.data))
      .catch((error) => console.log("Error while starting a new game", error));
  };

  const checkWinner = (winner) => {
    if (winner) {
      setWinnerMessage(`Winner: ${winner}`);
      timeoutRef.current = setTimeout(() => {
        startNewGame();
      }, 3000);
    }
  };


  if (!gameState) return <p>Loading...</p>;

  return (
    <div className="blackjack-container">
      <h1>Blackjack Game</h1>

      {winnerMessage && (
        <div className="winner-message">{winnerMessage}</div>
      )}

      <div className="ma">
        <div className="playerside">
          <h2>Player's Hand</h2>
          <ul>
            {gameState.player.hand.map((card, index) => (
              <li key={index}>
                {card.rank} of {card.suit}
              </li>
            ))}
          </ul>
          <p>Score: {gameState.player.score}</p>
        </div>

        <div className="dealerside">
          <h2>Dealer's Hand</h2>
          <ul>
            {gameState.dealer.hand.map((card, index) => (
              <li key={index}>
                {card.rank} of {card.suit}
              </li>
            ))}
          </ul>
          <p>Score: {gameState.dealer.score}</p>
        </div>
      </div>

      <div className="buttons">
        <button onClick={startNewGame}>Start Game</button>
        <button onClick={handleHit} disabled={!!winnerMessage}>
          Hit
        </button>
        <button onClick={handleStand} disabled={!!winnerMessage}>
          Stand
        </button>
      </div>
    </div>
  );
};

export default Game;
