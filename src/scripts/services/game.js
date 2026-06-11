import { Player } from "../models/player.js";

const FLEET = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];
const BOARD_SIZE = 10;

const randomInteger = (maximum, random) => {
  return Math.floor(random() * maximum) + 1;
};

const randomOrientation = (random) => {
  return random() < 0.5 ? "horizontal" : "vertical";
};

const placeFleet = (gameboard, random) => {
  for (const shipType of FLEET) {
    let placedShip = null;

    while (!placedShip) {
      placedShip = gameboard.placeShip(
        shipType,
        randomInteger(BOARD_SIZE, random),
        randomInteger(BOARD_SIZE, random),
        randomOrientation(random),
      );
    }
  }
};

const shuffle = (items, random) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

const createAttackPool = (random) => {
  const coordinates = [];

  for (let y = 1; y <= BOARD_SIZE; y++) {
    for (let x = 1; x <= BOARD_SIZE; x++) {
      coordinates.push({ x, y });
    }
  }

  return shuffle(coordinates, random);
};

const Game = (random = Math.random) => {
  let realPlayer;
  let computerPlayer;
  let turn;
  let winner;
  let computerAttacks;

  const start = () => {
    realPlayer = Player("real");
    computerPlayer = Player("computer");
    turn = "real";
    winner = null;
    computerAttacks = createAttackPool(random);

    placeFleet(realPlayer.getGameboard(), random);
    placeFleet(computerPlayer.getGameboard(), random);
  };

  const attackComputer = (x, y) => {
    if (turn !== "real" || winner) return null;

    const result = computerPlayer.getGameboard().receiveAttack(x, y);

    if (result === null) return null;

    if (computerPlayer.getGameboard().allShipsSunk()) {
      winner = "real";
    } else {
      turn = "computer";
    }

    return result;
  };

  const computerAttack = () => {
    if (turn !== "computer" || winner) return null;

    const coordinates = computerAttacks.pop();
    const result = realPlayer
      .getGameboard()
      .receiveAttack(coordinates.x, coordinates.y);

    if (realPlayer.getGameboard().allShipsSunk()) {
      winner = "computer";
    } else {
      turn = "real";
    }

    return { ...coordinates, result };
  };

  const getState = () => ({
    computerPlayer,
    realPlayer,
    turn,
    winner,
  });

  start();

  return { attackComputer, computerAttack, getState, start };
};

export { Game };
