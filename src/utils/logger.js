// LOGGER, VANILLA

export const logger = {
  log: (message, type, color, objectAdditionnalMessage) => {
    // CURRENT DATE FORMAT HH:MM:SS
    if (typeof message === 'string') {
      console.log(
        `%c${new Date().toLocaleTimeString().split(' ')} [${type ? type : 'INFO'}] : ${message}`,
        `color: ${color ? color : 'black'}`
      );
    } else {
      console.log(
        `%c${new Date().toLocaleTimeString().split(' ')} [${type ? type : 'INFO'}] : ${objectAdditionnalMessage || ''}`,
        `color: ${color ? color : 'black'}`
      );
      console.log(message);
    }
  },
};
