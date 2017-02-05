pragma solidity ^0.4.2;

// Reference: https://gist.github.com/pursuingpareto/b15f1197d96b1a2bbc48
library ByteBracket {
    function getBracketScore(bytes8 bracket, bytes8 results, uint64 filter) constant returns (uint8 points) {
        uint8 roundNum = 0;
        uint8 teamsRemaining = 64;
        uint64 blacklist = uint64(-1);
        uint64 overlap = uint64(~(bracket ^ results));

        while (teamsRemaining > 1) {
            uint8 numGames = teamsRemaining / 2;
            uint64 roundMask = (uint64(1) << numGames) - 1;

            uint64 scores = overlap & blacklist & roundMask;
            blacklist = pairwiseOr(scores & filter);

            overlap >>= numGames;
            filter >>= numGames;

            points += popcount(scores) << roundNum;
            teamsRemaining /= 2;
            roundNum++;
        }
    }

    function getScoringMask(bytes8 results) constant returns (uint64 mask) {
        // Filter for the second most significant bit since MSB is ignored.
        bytes8 bitSelector = 1 << 62;
        for (uint i = 0; i < 31; i++) {
            mask <<= 2;
            if (results & bitSelector != 0) {
                mask |= 1;
            } else {
                mask |= 2;
            }
            results <<= 1;
        }
    }

    // Returns a bitstring of half the length by taking bits two at a time and ORing them.
    //
    // Separates the even and odd bits by repeatedly
    // shuffling smaller segments of a bitstring.
    function pairwiseOr(uint64 bits) internal returns (uint64) {
        uint64 tmp;
        tmp = (bits ^ (bits >> 1)) & 0x22222222;
        bits ^= (tmp ^ (tmp << 1));
        tmp = (bits ^ (bits >> 2)) & 0x0c0c0c0c;
        bits ^= (tmp ^ (tmp << 2));
        tmp = (bits ^ (bits >> 4)) & 0x00f000f0;
        bits ^= (tmp ^ (tmp << 4));
        tmp = (bits ^ (bits >> 8)) & 0x0000ff00;
        bits ^= (tmp ^ (tmp << 8));
        uint64 evens = bits >> 16;
        uint64 odds = bits % 0x10000;
        return evens | odds;
    }

    // Counts the number of 1s in a bitstring.
    function popcount(uint64 bits) internal returns (uint8) {
        bits -= (bits >> 1) & 0x5555555555555555;
        bits = (bits & 0x3333333333333333) + ((bits >> 2) & 0x3333333333333333);
        bits = (bits + (bits >> 4)) & 0x0f0f0f0f0f0f0f0f;
        return uint8(((bits * 0x0101010101010101) & 0xffffffffffffffff) >> 56);
    }
}
