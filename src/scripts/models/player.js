import { Gameboard } from "./gameboard.js";

const PLAYER_TYPES = ["real", "computer"];

const normalizePlayerType = (type) => {
  if (typeof type !== "string") return "";

  return type.toLowerCase();
};

const Player = (type) => {
  const playerType = normalizePlayerType(type);

  if (!PLAYER_TYPES.includes(playerType)) return null;

  const gameboard = Gameboard();
  gameboard.create();

  const getType = () => playerType;
  const getGameboard = () => gameboard;

  return { getGameboard, getType };
};

export { Player };
