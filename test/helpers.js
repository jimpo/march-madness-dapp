function assertRevert(promise) {
  return promise
    .then(() => assert.fail("Expected error to be thrown"))
    .catch((error) => assert.include(error.message, "revert"));
}

exports.assertRevert = assertRevert;
