import { Game } from "../../scripts/services/game";

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

describe("Game", () => {
  let game;

  beforeEach(() => {
    game = Game(createSeededRandom());
  });

  test("starts with two players and a complete fleet on each board", () => {
    const { computerPlayer, realPlayer, turn, winner } = game.getState();

    expect(realPlayer.getType()).toBe("real");
    expect(computerPlayer.getType()).toBe("computer");
    expect(countTokens(realPlayer.getGameboard(), "S")).toBe(17);
    expect(countTokens(computerPlayer.getGameboard(), "S")).toBe(17);
    expect(turn).toBe("real");
    expect(winner).toBeNull();
  });

  test("alternates between real and computer attacks", () => {
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

  test("starts a fresh game", () => {
    const originalRealPlayer = game.getState().realPlayer;

    game.start();

    expect(game.getState().realPlayer).not.toBe(originalRealPlayer);
    expect(game.getState().turn).toBe("real");
    expect(game.getState().winner).toBeNull();
  });
});
