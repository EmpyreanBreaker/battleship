import { Game } from "../../scripts/services/game";

const FLEET = ["carrier", "battleship", "cruiser", "submarine", "destroyer"];

const createSeededRandom = (seed = 12345) => {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const countTokens = (gameboard, token) => {
  return gameboard
    .getBoard()
    .flat()
    .filter((cell) => cell.getToken() === token).length;
};

const getCoordinatesWithToken = (gameboard, token) => {
  return gameboard
    .getBoard()
    .flat()
    .filter((cell) => cell.getToken() === token)
    .map((cell) => cell.getIndices());
};

const deployCurrentFleet = (game) => {
  FLEET.forEach((shipType, index) => {
    expect(game.placePlayerShip(shipType, 1, index * 2 + 1, "horizontal")).toBe(
      true,
    );
  });
};

const prepareLocalBattle = (game) => {
  game.start("local");
  deployCurrentFleet(game);
  game.confirmPlacement();
  game.continueHandoff();
  deployCurrentFleet(game);
  game.confirmPlacement();
  game.continueHandoff();
};

describe("Game against the computer", () => {
  let game;

  beforeEach(() => {
    game = Game(createSeededRandom());
  });

  test("starts in placement with an empty player board", () => {
    const { computerPlayer, mode, phase, realPlayer, remainingShips, turn } =
      game.getState();

    expect(mode).toBe("computer");
    expect(realPlayer.getType()).toBe("real");
    expect(computerPlayer.getType()).toBe("computer");
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(0);
    expect(countTokens(computerPlayer.getGameboard(), "S")).toBe(17);
    expect(remainingShips).toEqual(FLEET);
    expect(phase).toBe("placement");
    expect(turn).toBeNull();
  });

  test("places a selected player ship and rejects illegal placements", () => {
    expect(game.placePlayerShip("carrier", 7, 1, "horizontal")).toBe(false);
    expect(game.placePlayerShip("carrier", 1, 1, "horizontal")).toBe(true);
    expect(game.placePlayerShip("carrier", 1, 2, "horizontal")).toBe(false);
    expect(game.canPlacePlayerShip("battleship", 1, 2, "horizontal")).toBe(
      false,
    );
    expect(game.placePlayerShip("battleship", 3, 1, "vertical")).toBe(false);
    expect(countTokens(game.getState().realPlayer.getGameboard(), "S")).toBe(5);
  });

  test("randomizes and clears a complete legal player fleet", () => {
    expect(game.randomizePlayerFleet()).toBe(true);
    expect(countTokens(game.getState().realPlayer.getGameboard(), "S")).toBe(
      17,
    );
    expect(game.getState().remainingShips).toEqual([]);

    expect(game.clearPlayerFleet()).toBe(true);
    expect(countTokens(game.getState().realPlayer.getGameboard(), "S")).toBe(0);
    expect(game.getState().remainingShips).toEqual(FLEET);
  });

  test("rotates a placed player ship only during deployment", () => {
    expect(game.placePlayerShip("destroyer", 2, 3, "horizontal")).toBe(true);
    expect(game.rotatePlayerShip("destroyer")).toBe(true);
    expect(
      game.getState().realPlayer.getGameboard().getShipPlacements()[0],
    ).toEqual(
      expect.objectContaining({
        cells: [
          { column: "B", row: 3 },
          { column: "B", row: 4 },
        ],
        orientation: "vertical",
      }),
    );

    game.randomizePlayerFleet();
    game.confirmPlacement();

    expect(game.rotatePlayerShip("destroyer")).toBe(false);
  });

  test("requires confirmation before alternating computer turns", () => {
    expect(game.confirmPlacement()).toBe(false);
    expect(game.attackOpponent(1, 1)).toBeNull();

    deployCurrentFleet(game);
    expect(game.confirmPlacement()).toBe(true);

    const target = game
      .getState()
      .opponentPlayer.getGameboard()
      .getBoard()
      .flat()
      .find((cell) => cell.getToken() === "S")
      .getIndices();

    expect(game.attackOpponent(target.column, target.row)).toBe(true);
    expect(game.getState().activePlayerType).toBe("computer");

    expect(game.computerAttack()).toEqual({
      result: expect.any(Boolean),
      x: expect.any(Number),
      y: expect.any(Number),
    });
    expect(game.getState().activePlayerType).toBe("real");
  });

  test("targets an adjacent coordinate after hitting a ship", () => {
    game = Game(createSeededRandom(1));
    deployCurrentFleet(game);
    game.confirmPlacement();

    const computerBoard = game
      .getState()
      .opponentPlayer.getGameboard()
      .getBoard();
    const playerTarget = computerBoard
      .flat()
      .find((cell) => cell.getToken() === "O")
      .getIndices();

    game.attackOpponent(playerTarget.column, playerTarget.row);
    const firstAttack = game.computerAttack();

    expect(firstAttack).toEqual({ result: true, x: 1, y: 1 });

    game.attackOpponent(10, 10);
    const adjacentAttack = game.computerAttack();
    const distance =
      Math.abs(adjacentAttack.x - firstAttack.x) +
      Math.abs(adjacentAttack.y - firstAttack.y);

    expect(distance).toBe(1);
    expect(adjacentAttack).toEqual({ result: true, x: 2, y: 1 });
  });

  test("plays through a complete game until the real player wins", () => {
    deployCurrentFleet(game);
    game.confirmPlacement();
    const enemyShipCoordinates = getCoordinatesWithToken(
      game.getState().opponentPlayer.getGameboard(),
      "S",
    );

    enemyShipCoordinates.forEach((target, index) => {
      expect(game.attackOpponent(target.column, target.row)).toBe(true);

      if (index === enemyShipCoordinates.length - 1) return;

      expect(game.getState().activePlayerType).toBe("computer");
      expect(game.computerAttack()).toEqual({
        result: expect.any(Boolean),
        x: expect.any(Number),
        y: expect.any(Number),
      });
      expect(game.getState().activePlayerType).toBe("real");
      expect(game.getState().phase).toBe("battle");
    });

    expect(game.getState().phase).toBe("finished");
    expect(game.getState().winner).toBe("You");
    expect(game.getState().winnerIndex).toBe(0);
    expect(game.attackOpponent(1, 1)).toBeNull();
    expect(game.computerAttack()).toBeNull();
  });

  test("plays through a complete game until the computer wins", () => {
    deployCurrentFleet(game);
    game.confirmPlacement();
    let turns = 0;

    while (game.getState().phase !== "finished" && turns < 100) {
      const enemyBoard = game.getState().opponentPlayer.getGameboard();
      const target =
        getCoordinatesWithToken(enemyBoard, "O")[0] ??
        getCoordinatesWithToken(enemyBoard, "S")[0];

      expect(target).toBeDefined();
      expect(game.attackOpponent(target.column, target.row)).not.toBeNull();

      if (game.getState().phase === "finished") break;

      expect(game.computerAttack()).toEqual({
        result: expect.any(Boolean),
        x: expect.any(Number),
        y: expect.any(Number),
      });
      turns += 1;
    }

    expect(turns).toBeLessThan(100);
    expect(game.getState().phase).toBe("finished");
    expect(game.getState().winner).toBe("Computer");
    expect(game.getState().winnerIndex).toBe(1);
  });

  test("locks fleet placement after confirmation", () => {
    deployCurrentFleet(game);
    game.confirmPlacement();

    expect(game.clearPlayerFleet()).toBe(false);
    expect(game.randomizePlayerFleet()).toBe(false);
    expect(game.canPlacePlayerShip("carrier", 1, 6, "horizontal")).toBe(false);
    expect(game.placePlayerShip("carrier", 1, 6, "horizontal")).toBe(false);
  });

  test("starts a fresh placement phase in the current mode", () => {
    game.randomizePlayerFleet();
    game.confirmPlacement();
    const originalRealPlayer = game.getState().realPlayer;

    game.start();

    expect(game.getState().realPlayer).not.toBe(originalRealPlayer);
    expect(game.getState().mode).toBe("computer");
    expect(game.getState().phase).toBe("placement");
    expect(game.getState().remainingShips).toEqual(FLEET);
  });
});

describe("Local two-player game", () => {
  let game;

  beforeEach(() => {
    game = Game(createSeededRandom());
    game.start("local");
  });

  test("creates two real players with independent empty boards", () => {
    const { currentPlayerLabel, mode, players } = game.getState();

    expect(mode).toBe("local");
    expect(players[0].getType()).toBe("real");
    expect(players[1].getType()).toBe("real");
    expect(players[0].getGameboard()).not.toBe(players[1].getGameboard());
    expect(countTokens(players[0].getGameboard(), "S")).toBe(0);
    expect(countTokens(players[1].getGameboard(), "S")).toBe(0);
    expect(currentPlayerLabel).toBe("Player 1");
  });

  test("uses private handoffs between player fleet deployments", () => {
    deployCurrentFleet(game);

    expect(game.confirmPlacement()).toBe(true);
    expect(game.getState().phase).toBe("handoff");
    expect(game.getState().handoffPlayerLabel).toBe("Player 2");

    expect(game.continueHandoff()).toBe(true);
    expect(game.getState().phase).toBe("placement");
    expect(game.getState().currentPlayerLabel).toBe("Player 2");
    expect(countTokens(game.getState().currentPlayer.getGameboard(), "S")).toBe(
      0,
    );

    deployCurrentFleet(game);
    game.confirmPlacement();

    expect(game.getState().phase).toBe("handoff");
    expect(game.getState().handoffPlayerLabel).toBe("Player 1");

    game.continueHandoff();
    expect(game.getState().phase).toBe("battle");
    expect(game.getState().activePlayerLabel).toBe("Player 1");
  });

  test("shows the attack result before starting the next player's turn", () => {
    prepareLocalBattle(game);
    const target = game
      .getState()
      .opponentPlayer.getGameboard()
      .getBoard()
      .flat()
      .find((cell) => cell.getToken() === "S")
      .getIndices();

    expect(game.attackOpponent(target.column, target.row)).toBe(true);
    expect(game.getState().phase).toBe("turn-result");
    expect(game.getState().lastAttackResult).toBe(true);
    expect(game.getState().activePlayerLabel).toBe("Player 1");
    expect(game.attackOpponent(10, 10)).toBeNull();

    expect(game.endTurn()).toBe(true);
    expect(game.getState().phase).toBe("battle");
    expect(game.getState().activePlayerLabel).toBe("Player 2");
    expect(game.getState().currentPlayerLabel).toBe("Player 2");
  });

  test("reports the winning local player", () => {
    prepareLocalBattle(game);
    const playerOneBoard = game.getState().players[0].getGameboard().getBoard();
    const playerTwoBoard = game.getState().players[1].getGameboard().getBoard();
    const playerOneMisses = playerOneBoard
      .flat()
      .filter((cell) => cell.getToken() === "O")
      .map((cell) => cell.getIndices());
    const playerTwoShips = playerTwoBoard
      .flat()
      .filter((cell) => cell.getToken() === "S")
      .map((cell) => cell.getIndices());

    playerTwoShips.forEach((target, index) => {
      game.attackOpponent(target.column, target.row);

      if (index === playerTwoShips.length - 1) return;

      game.endTurn();

      const miss = playerOneMisses[index];
      game.attackOpponent(miss.column, miss.row);
      game.endTurn();
    });

    expect(game.getState().phase).toBe("finished");
    expect(game.getState().winner).toBe("Player 1");
    expect(game.getState().winnerIndex).toBe(0);
  });

  test("switches back to computer mode with a fresh game", () => {
    expect(game.start("computer")).toBe(true);

    expect(game.getState().mode).toBe("computer");
    expect(game.getState().computerPlayer.getType()).toBe("computer");
    expect(game.getState().phase).toBe("placement");
  });
});
