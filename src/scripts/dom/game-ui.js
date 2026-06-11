const COLUMNS = "ABCDEFGHIJ";

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) element.className = className;
  if (text) element.textContent = text;

  return element;
};

const createBoardShell = (title, boardName) => {
  const section = createElement("section", "board-panel");
  const heading = createElement("h2", "board-title", title);
  const grid = createElement("div", "board-grid");

  grid.dataset.board = boardName;
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", title);

  section.append(heading, grid);

  return { grid, section };
};

const getCellLabel = (cell, token, hideShips) => {
  const { row, column } = cell.getIndices();
  const visibleToken = hideShips && token === "S" ? "O" : token;
  const states = {
    M: "miss",
    O: "open water",
    S: "your ship",
    X: "hit",
  };

  return `${column}${row}: ${states[visibleToken]}`;
};

const renderBoard = (grid, gameboard, options = {}) => {
  const { disabled = false, hideShips = false, interactive = false } = options;
  const board = gameboard.getBoard();
  const fragment = document.createDocumentFragment();

  const corner = createElement("span", "board-label board-corner");
  corner.setAttribute("aria-hidden", "true");
  fragment.append(corner);

  for (const column of COLUMNS) {
    const label = createElement("span", "board-label", column);
    label.setAttribute("aria-hidden", "true");
    fragment.append(label);
  }

  board.forEach((row, rowIndex) => {
    const rowLabel = createElement("span", "board-label", String(rowIndex + 1));
    rowLabel.setAttribute("aria-hidden", "true");
    fragment.append(rowLabel);

    row.forEach((cell, columnIndex) => {
      const token = cell.getToken();
      const visibleToken = hideShips && token === "S" ? "O" : token;
      const element = createElement(
        interactive ? "button" : "div",
        `board-cell token-${visibleToken.toLowerCase()}`,
      );

      element.dataset.x = String(columnIndex + 1);
      element.dataset.y = String(rowIndex + 1);
      element.dataset.token = visibleToken;
      element.setAttribute("role", "gridcell");
      element.setAttribute("aria-label", getCellLabel(cell, token, hideShips));

      if (interactive) {
        element.type = "button";
        element.disabled = disabled || token === "X" || token === "M";
      }

      if (visibleToken === "X") {
        element.textContent = "×";
      }

      fragment.append(element);
    });
  });

  grid.replaceChildren(fragment);
  grid.classList.toggle("is-disabled", disabled);
};

const getStatus = ({ turn, winner }) => {
  if (winner === "real") {
    return { detail: "Enemy fleet destroyed", title: "Victory" };
  }

  if (winner === "computer") {
    return { detail: "Your fleet has been destroyed", title: "Defeat" };
  }

  if (turn === "computer") {
    return { detail: "Enemy targeting in progress", title: "Computer turn" };
  }

  return { detail: "Targeting systems ready", title: "Your turn" };
};

const GameUI = (root) => {
  const app = createElement("main", "game");
  const header = createElement("header", "game-header");
  const brand = createElement("div", "brand");
  const brandMark = createElement("span", "brand-mark", "B");
  const brandName = createElement("h1", "brand-name", "Battleship");
  const restartButton = createElement("button", "restart-button", "New game");
  const statusBar = createElement("section", "status-bar");
  const statusCopy = createElement("div", "status-copy");
  const statusTitle = createElement("p", "status-title");
  const statusDetail = createElement("p", "status-detail");
  const turnLight = createElement("span", "turn-light");
  const boards = createElement("div", "boards");
  const playerBoard = createBoardShell("Your fleet", "player");
  const enemyBoard = createBoardShell("Enemy waters", "enemy");

  restartButton.type = "button";
  statusBar.setAttribute("aria-live", "polite");
  turnLight.setAttribute("aria-hidden", "true");

  brand.append(brandMark, brandName);
  header.append(brand, restartButton);
  statusCopy.append(statusTitle, statusDetail);
  statusBar.append(turnLight, statusCopy);
  boards.append(playerBoard.section, enemyBoard.section);
  app.append(header, statusBar, boards);
  root.replaceChildren(app);

  const render = (state) => {
    const isEnemyBoardDisabled = state.turn !== "real" || Boolean(state.winner);
    const status = getStatus(state);

    statusTitle.textContent = status.title;
    statusDetail.textContent = status.detail;
    turnLight.className = `turn-light turn-${state.winner || state.turn}`;

    renderBoard(playerBoard.grid, state.realPlayer.getGameboard());
    renderBoard(enemyBoard.grid, state.computerPlayer.getGameboard(), {
      disabled: isEnemyBoardDisabled,
      hideShips: !state.winner,
      interactive: true,
    });
  };

  const onEnemyAttack = (handler) => {
    enemyBoard.grid.addEventListener("click", (event) => {
      const cell = event.target.closest(".board-cell");

      if (!cell || cell.disabled) return;

      handler(Number(cell.dataset.x), Number(cell.dataset.y));
    });
  };

  const onRestart = (handler) => {
    restartButton.addEventListener("click", handler);
  };

  return { onEnemyAttack, onRestart, render };
};

export { GameUI };
