// __mocks__/firebase/app.js
module.exports = {
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
};
