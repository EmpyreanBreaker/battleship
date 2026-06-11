import "../../css/index.css";
import { GameUI } from "../dom/game-ui.js";
import { Game } from "../services/game.js";

const game = Game();
const ui = GameUI(document.body);

const render = () => {
  ui.render(game.getState());
};

const runComputerTurn = () => {
  window.setTimeout(() => {
    game.computerAttack();
    render();
  }, 450);
};

ui.onEnemyAttack((x, y) => {
  const result = game.attackComputer(x, y);

  if (result === null) return;

  render();

  if (game.getState().turn === "computer") {
    runComputerTurn();
  }
});

ui.onRestart(() => {
  game.start();
  render();
});

render();
