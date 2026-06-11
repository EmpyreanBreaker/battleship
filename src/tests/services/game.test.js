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

const deployPlayerFleet = (game) => {
  FLEET.forEach((shipType, index) => {
    expect(game.placePlayerShip(shipType, 1, index + 1, "horizontal")).toBe(
      true,
    );
  });
};

describe("Game", () => {
  let game;

  beforeEach(() => {
    game = Game(createSeededRandom());
  });

  test("starts in placement with an empty player board", () => {
    const { computerPlayer, phase, realPlayer, remainingShips, turn, winner } =
      game.getState();

    expect(realPlayer.getType()).toBe("real");
    expect(computerPlayer.getType()).toBe("computer");
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(0);
    expect(countTokens(computerPlayer.getGameboard(), "S")).toBe(17);
    expect(remainingShips).toEqual(FLEET);
    expect(phase).toBe("placement");
    expect(turn).toBeNull();
    expect(winner).toBeNull();
  });

  test("places a selected player ship and removes it from the remaining fleet", () => {
    const placed = game.placePlayerShip("carrier", 1, 1, "horizontal");
    const { realPlayer, remainingShips } = game.getState();

    expect(placed).toBe(true);
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(5);
    expect(remainingShips).not.toContain("carrier");
  });

  test("rejects illegal and duplicate player ship placements", () => {
    expect(game.placePlayerShip("carrier", 7, 1, "horizontal")).toBe(false);
    expect(game.placePlayerShip("carrier", 1, 1, "horizontal")).toBe(true);
    expect(game.placePlayerShip("carrier", 1, 2, "horizontal")).toBe(false);
    expect(game.placePlayerShip("battleship", 3, 1, "vertical")).toBe(false);
    expect(countTokens(game.getState().realPlayer.getGameboard(), "S")).toBe(5);
  });

  test("randomizes a complete legal player fleet", () => {
    expect(game.randomizePlayerFleet()).toBe(true);

    const { realPlayer, remainingShips } = game.getState();
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(17);
    expect(remainingShips).toEqual([]);
  });

  test("clears player placements", () => {
    game.randomizePlayerFleet();

    expect(game.clearPlayerFleet()).toBe(true);

    const { realPlayer, remainingShips } = game.getState();
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(0);
    expect(remainingShips).toEqual(FLEET);
  });

  test("requires a complete fleet before combat begins", () => {
    expect(game.confirmPlacement()).toBe(false);
    expect(game.attackComputer(1, 1)).toBeNull();

    deployPlayerFleet(game);

    expect(game.confirmPlacement()).toBe(true);
    expect(game.getState().phase).toBe("battle");
    expect(game.getState().turn).toBe("real");
  });

  test("locks fleet placement after confirmation", () => {
    deployPlayerFleet(game);
    game.confirmPlacement();

    expect(game.clearPlayerFleet()).toBe(false);
    expect(game.randomizePlayerFleet()).toBe(false);
    expect(game.placePlayerShip("carrier", 1, 6, "horizontal")).toBe(false);
    expect(countTokens(game.getState().realPlayer.getGameboard(), "S")).toBe(
      17,
    );
  });

  test("alternates between real and computer attacks after confirmation", () => {
    deployPlayerFleet(game);
    game.confirmPlacement();

    const computerBoard = game
      .getState()
      .computerPlayer.getGameboard()
      .getBoard();
    const target = computerBoard
      .flat()
      .find((cell) => cell.getToken() === "S")
      .getIndices();

    expect(game.attackComputer(target.column, target.row)).toBe(true);
    expect(game.getState().turn).toBe("computer");

    const computerAttack = game.computerAttack();

    expect(computerAttack).toEqual({
      result: expect.any(Boolean),
      x: expect.any(Number),
      y: expect.any(Number),
    });
    expect(game.getState().turn).toBe("real");
  });

  test("starts a fresh placement phase", () => {
    game.randomizePlayerFleet();
    game.confirmPlacement();
    const originalRealPlayer = game.getState().realPlayer;

    game.start();

    expect(game.getState().realPlayer).not.toBe(originalRealPlayer);
    expect(game.getState().phase).toBe("placement");
    expect(game.getState().remainingShips).toEqual(FLEET);
    expect(game.getState().turn).toBeNull();
    expect(game.getState().winner).toBeNull();
  });
});
