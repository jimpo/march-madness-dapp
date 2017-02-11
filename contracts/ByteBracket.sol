pragma solidity ^0.4.4;

// This library can be used to score byte brackets. Byte brackets are a succinct encoding of a
// 64 team bracket into an 8-byte array. The tournament results are encoded in the same format and
// compared against the bracket picks. To reduce the computation time of scoring a bracket, a 64-bit
// value called the "scoring mask" is first computed once for a particular result set and used to
// score all brackets.
//
// Algorithm description: https://drive.google.com/file/d/0BxHbbgrucCx2N1MxcnA1ZE1WQW8/view
// Reference implementation: https://gist.github.com/pursuingpareto/b15f1197d96b1a2bbc48
library ByteBracket {
    function getBracketScore(bytes8 bracket, bytes8 results, uint64 filter)
        constant
        returns (uint8 points)
    {
        uint8 roundNum = 0;
        uint8 numGames = 32;
        uint64 blacklist = (uint64(1) << numGames) - 1;
        uint64 overlap = uint64(~(bracket ^ results));

        while (numGames > 0) {
            uint64 scores = overlap & blacklist;
            points += popcount(scores) << roundNum;
            blacklist = pairwiseOr(scores & filter);
            overlap >>= numGames;
            filter >>= numGames;
            numGames /= 2;
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
