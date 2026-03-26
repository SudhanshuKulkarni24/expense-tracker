// __mocks__/firebase/functions.js
module.exports = {
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
};
