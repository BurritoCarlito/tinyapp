const { assert } = require('chai');

const { getUsersByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUsersByEmail', () => {
  it('should return a user with a valid email', function() {
    const user = getUsersByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return user when given an valid email', () => {
    const user = getUsersByEmail("user2@example.com", testUsers);
    const expectedUserID = "user2RandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined when an invalid email', () => {
    const user = getUsersByEmail("example3@example.com", testUsers);
    const expectedUserID = undefined;
    console.log(user.id);
    assert.strictEqual(user.id, expectedUserID);
  })
});