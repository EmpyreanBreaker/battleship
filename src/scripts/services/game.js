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
  let phase;
  let turn;
  let winner;
  let computerAttacks;
  let remainingShips;

  const start = () => {
    realPlayer = Player("real");
    computerPlayer = Player("computer");
    phase = "placement";
    turn = null;
    winner = null;
    computerAttacks = createAttackPool(random);
    remainingShips = [...FLEET];

    placeFleet(computerPlayer.getGameboard(), random);
  };

  const placePlayerShip = (shipType, x, y, orientation) => {
    if (phase !== "placement" || !remainingShips.includes(shipType)) {
      return false;
    }

    const placedShip = realPlayer
      .getGameboard()
      .placeShip(shipType, x, y, orientation);

    if (!placedShip) return false;

    remainingShips = remainingShips.filter((type) => type !== shipType);
    return true;
  };

  const clearPlayerFleet = () => {
    if (phase !== "placement") return false;

    realPlayer.getGameboard().reset();
    remainingShips = [...FLEET];
    return true;
  };

  const randomizePlayerFleet = () => {
    if (!clearPlayerFleet()) return false;

    placeFleet(realPlayer.getGameboard(), random);
    remainingShips = [];
    return true;
  };

  const confirmPlacement = () => {
    if (phase !== "placement" || remainingShips.length > 0) return false;

    phase = "battle";
    turn = "real";
    return true;
  };

  const attackComputer = (x, y) => {
    if (phase !== "battle" || turn !== "real" || winner) return null;

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
    if (phase !== "battle" || turn !== "computer" || winner) return null;

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
    phase,
    realPlayer,
    remainingShips: [...remainingShips],
    turn,
    winner,
  });

  start();

  return {
    attackComputer,
    clearPlayerFleet,
    computerAttack,
    confirmPlacement,
    getState,
    placePlayerShip,
    randomizePlayerFleet,
    start,
  };
};

export { Game };
