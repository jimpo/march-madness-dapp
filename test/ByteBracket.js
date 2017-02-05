contract('ByteBracket', (accounts) => {
    let byteBracket;

    beforeEach(() => {
        byteBracket = ByteBracket.deployed();
    });

    describe("getBracketScore", () => {
        it("correctly calculates bracket scores", () => {
            const results = "0xFFFFFFFFFFFFFFFF";
            return byteBracket.getScoringMask(results)
                .then((filter) => {
                    const brackets = [
                        "0xFFFFFFFFFFFFFFFF",
                        "0x80000000FFFFFFFF",
                        "0xFFFF0000FFFFFFFF",
                        "0xFFFF5555FFFFFFFF",
                        "0xFFFFaaaaFFFFFFFF"
                    ];
                    const calls = brackets.map(
                        (bracket) => byteBracket.getBracketScore(bracket, results, filter)
                    );
                    return Promise.all(calls);
                })
                .then((scores) => {
                    assert.equal(scores[0].toNumber(), 192);
                    assert.equal(scores[1].toNumber(), 32);
                    assert.equal(scores[2].toNumber(), 32);
                    assert.equal(scores[3].toNumber(), 192 - 2 * 8);
                    assert.equal(scores[4].toNumber(), 32 + 2 * 8);
                });
        });
    });

    describe("getScoringMask", () => {
        it("correctly computes the scoring mask from the results bracket", () => {
            return byteBracket.getScoringMask("0xFFFFFFFFFFFFFFFF")
                .then((mask) => assert.equal(mask.toString(16), "1555555555555555"))
                .then(() => byteBracket.getScoringMask("0x8000000000000000"))
                .then((mask) => assert.equal(mask.toString(16), "2aaaaaaaaaaaaaaa"))
                .then(() => byteBracket.getScoringMask("0xFFFF000000000000"))
                .then((mask) => assert.equal(mask.toString(16), "15555555aaaaaaaa"));
        });
    });
});
