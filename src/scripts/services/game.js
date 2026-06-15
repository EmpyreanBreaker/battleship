import { Player } from "../models/player.js";

const FLEET = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];
const GAME_MODES = ["computer", "local"];
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

const getCoordinateKey = ({ x, y }) => `${x},${y}`;

const getAdjacentCoordinates = ({ x, y }) => {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ].filter(
    (coordinates) =>
      coordinates.x >= 1 &&
      coordinates.x <= BOARD_SIZE &&
      coordinates.y >= 1 &&
      coordinates.y <= BOARD_SIZE,
  );
};

const Game = (random = Math.random) => {
  let mode = "computer";
  let players;
  let phase;
  let placementPlayerIndex;
  let activePlayerIndex;
  let winnerIndex;
  let computerAttacks;
  let computerTargets;
  let computerAttackedCoordinates;
  let remainingShipsByPlayer;
  let handoffPlayerIndex;
  let handoffNextPhase;
  let lastAttackResult;

  const getPlayerLabel = (index) => {
    if (mode === "computer") return index === 0 ? "You" : "Computer";

    return `Player ${index + 1}`;
  };

  const getViewerIndex = () => {
    if (mode === "computer") return 0;
    if (phase === "placement") return placementPlayerIndex;
    if (phase === "handoff") return handoffPlayerIndex;

    return activePlayerIndex;
  };

  const prepareHandoff = (playerIndex, nextPhase) => {
    handoffPlayerIndex = playerIndex;
    handoffNextPhase = nextPhase;
    phase = "handoff";
  };

  const start = (nextMode = mode) => {
    if (!GAME_MODES.includes(nextMode)) return false;

    mode = nextMode;
    players = [
      Player("real"),
      Player(mode === "computer" ? "computer" : "real"),
    ];
    phase = "placement";
    placementPlayerIndex = 0;
    activePlayerIndex = 0;
    winnerIndex = null;
    computerAttacks = createAttackPool(random);
    computerTargets = [];
    computerAttackedCoordinates = new Set();
    remainingShipsByPlayer = [
      [...FLEET],
      mode === "computer" ? [] : [...FLEET],
    ];
    handoffPlayerIndex = null;
    handoffNextPhase = null;
    lastAttackResult = null;

    if (mode === "computer") {
      placeFleet(players[1].getGameboard(), random);
    }

    return true;
  };

  const placePlayerShip = (shipType, x, y, orientation) => {
    const remainingShips = remainingShipsByPlayer[placementPlayerIndex];

    if (phase !== "placement" || !remainingShips.includes(shipType)) {
      return false;
    }

    const placedShip = players[placementPlayerIndex]
      .getGameboard()
      .placeShip(shipType, x, y, orientation);

    if (!placedShip) return false;

    remainingShipsByPlayer[placementPlayerIndex] = remainingShips.filter(
      (type) => type !== shipType,
    );
    return true;
  };

  const canPlacePlayerShip = (shipType, x, y, orientation) => {
    if (
      phase !== "placement" ||
      !remainingShipsByPlayer[placementPlayerIndex].includes(shipType)
    ) {
      return false;
    }

    return players[placementPlayerIndex]
      .getGameboard()
      .canPlaceShip(shipType, x, y, orientation);
  };

  const rotatePlayerShip = (shipType) => {
    if (phase !== "placement") return false;

    return players[placementPlayerIndex].getGameboard().rotateShip(shipType);
  };

  const clearPlayerFleet = () => {
    if (phase !== "placement") return false;

    players[placementPlayerIndex].getGameboard().reset();
    remainingShipsByPlayer[placementPlayerIndex] = [...FLEET];
    return true;
  };

  const randomizePlayerFleet = () => {
    if (!clearPlayerFleet()) return false;

    placeFleet(players[placementPlayerIndex].getGameboard(), random);
    remainingShipsByPlayer[placementPlayerIndex] = [];
    return true;
  };

  const confirmPlacement = () => {
    if (
      phase !== "placement" ||
      remainingShipsByPlayer[placementPlayerIndex].length > 0
    ) {
      return false;
    }

    if (mode === "computer") {
      phase = "battle";
      activePlayerIndex = 0;
      return true;
    }

    if (placementPlayerIndex === 0) {
      placementPlayerIndex = 1;
      prepareHandoff(1, "placement");
    } else {
      activePlayerIndex = 0;
      prepareHandoff(0, "battle");
    }

    return true;
  };

  const continueHandoff = () => {
    if (phase !== "handoff") return false;

    activePlayerIndex = handoffPlayerIndex;
    phase = handoffNextPhase;
    handoffPlayerIndex = null;
    handoffNextPhase = null;
    lastAttackResult = null;
    return true;
  };

  const attackOpponent = (x, y) => {
    if (
      phase !== "battle" ||
      players[activePlayerIndex].getType() !== "real" ||
      winnerIndex !== null
    ) {
      return null;
    }

    const opponentIndex = activePlayerIndex === 0 ? 1 : 0;
    const result = players[opponentIndex].getGameboard().receiveAttack(x, y);

    if (result === null) return null;

    lastAttackResult = result;

    if (players[opponentIndex].getGameboard().allShipsSunk()) {
      winnerIndex = activePlayerIndex;
      phase = "finished";
    } else if (mode === "local") {
      handoffPlayerIndex = opponentIndex;
      phase = "turn-result";
    } else {
      activePlayerIndex = 1;
    }

    return result;
  };

  const endTurn = () => {
    if (mode !== "local" || phase !== "turn-result") return false;

    activePlayerIndex = handoffPlayerIndex;
    handoffPlayerIndex = null;
    lastAttackResult = null;
    phase = "battle";
    return true;
  };

  const getNextComputerTarget = () => {
    const targetPools = [computerTargets, computerAttacks];

    for (const targets of targetPools) {
      while (targets.length > 0) {
        const target =
          targets === computerTargets ? targets.shift() : targets.pop();

        if (!computerAttackedCoordinates.has(getCoordinateKey(target))) {
          return target;
        }
      }
    }

    return null;
  };

  const queueAdjacentTargets = (coordinates) => {
    const queuedTargets = new Set(computerTargets.map(getCoordinateKey));

    getAdjacentCoordinates(coordinates).forEach((target) => {
      const key = getCoordinateKey(target);

      if (!computerAttackedCoordinates.has(key) && !queuedTargets.has(key)) {
        computerTargets.push(target);
        queuedTargets.add(key);
      }
    });
  };

  const computerAttack = () => {
    if (
      mode !== "computer" ||
      phase !== "battle" ||
      players[activePlayerIndex].getType() !== "computer" ||
      winnerIndex !== null
    ) {
      return null;
    }

    let coordinates = getNextComputerTarget();

    while (coordinates) {
      computerAttackedCoordinates.add(getCoordinateKey(coordinates));
      const result = players[0]
        .getGameboard()
        .receiveAttack(coordinates.x, coordinates.y);

      if (result === null) {
        coordinates = getNextComputerTarget();
        continue;
      }

      lastAttackResult = result;

      if (result) queueAdjacentTargets(coordinates);

      if (players[0].getGameboard().allShipsSunk()) {
        winnerIndex = 1;
        phase = "finished";
      } else {
        activePlayerIndex = 0;
      }

      return { ...coordinates, result };
    }

    return null;
  };

  const getState = () => {
    const viewerIndex = getViewerIndex();
    const opponentIndex = viewerIndex === 0 ? 1 : 0;
    const winner = winnerIndex === null ? null : getPlayerLabel(winnerIndex);

    return {
      activePlayerIndex,
      activePlayerLabel: getPlayerLabel(activePlayerIndex),
      activePlayerType: players[activePlayerIndex].getType(),
      computerPlayer: mode === "computer" ? players[1] : null,
      currentPlayer: players[viewerIndex],
      currentPlayerIndex: viewerIndex,
      currentPlayerLabel: getPlayerLabel(viewerIndex),
      handoffPlayerLabel:
        handoffPlayerIndex === null ? null : getPlayerLabel(handoffPlayerIndex),
      lastAttackResult,
      mode,
      opponentPlayer: players[opponentIndex],
      opponentPlayerLabel: getPlayerLabel(opponentIndex),
      phase,
      players: [...players],
      realPlayer: players[0],
      remainingShips:
        phase === "placement"
          ? [...remainingShipsByPlayer[placementPlayerIndex]]
          : [],
      turn: phase === "battle" ? players[activePlayerIndex].getType() : null,
      winner,
      winnerIndex,
    };
  };

  start();

  return {
    attackOpponent,
    canPlacePlayerShip,
    clearPlayerFleet,
    computerAttack,
    confirmPlacement,
    continueHandoff,
    endTurn,
    getState,
    placePlayerShip,
    randomizePlayerFleet,
    rotatePlayerShip,
    start,
  };
};

export { Game };
