// LOGGER, VANILLA

export const logger = {
  log: (message, type, color) => {
    // CURRENT DATE FORMAT HH:MM:SS

    console.log(
      `%c${new Date().toLocaleTimeString().split(' ')} [${type ? type : 'INFO'}] : ${message}`,
      `color: ${color ? color : 'black'}`
    );
  },
};
