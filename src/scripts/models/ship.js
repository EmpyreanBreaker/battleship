// This function creates and manipulates ship objects
const Ship = (length = 0) => {
  let hits = 0;

  const hit = () => {
    hits += 1;
  };

  const isSunk = () => {
    return hits >= length;
  };

  const getData = () => {
    return { length, hits };
  };

  // Use closure to interact with local variables
  return { hit, isSunk, getData };
};

export { Ship };
