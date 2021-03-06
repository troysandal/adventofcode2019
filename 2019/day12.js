import {assert, arraysEqual} from './util.js'

/*
--- Day 12: The N-Body Problem ---
The space near Jupiter is not a very safe place; you need to be careful of a big distracting red spot, extreme radiation, and a whole lot of moons swirling around. You decide to start by tracking the four largest moons: Io, Europa, Ganymede, and Callisto.

After a brief scan, you calculate the position of each moon (your puzzle input). You just need to simulate their motion so you can avoid them.

Each moon has a 3-dimensional position (x, y, and z) and a 3-dimensional velocity. The position of each moon is given in your scan; the x, y, and z velocity of each moon starts at 0.

{position:[x,y,z], velocity:[x,y,z]}

Simulate the motion of the moons in time steps. Within each time step, first update the velocity of every moon by applying gravity. Then, once all moons' velocities have been updated, update the position of every moon by applying velocity. Time progresses by one step once all of the positions are updated.
*/

function simulate(moons) {
    return velocity(gravity(moons))
}

/*
To apply gravity, consider every pair of moons.
*/

function pairs(array, visitor) {
    for (let leftIx = 0 ; leftIx < (array.length - 1) ; leftIx++) {
        for (let rightIx = leftIx + 1; rightIx < array.length ; rightIx++) {
            visitor([array[leftIx], array[rightIx]], leftIx, rightIx)
        }
    }
  }

(() => {
    function testPairs(input, expected) {
        const actual = []
        pairs(input, (pair) => actual.push(pair))
        assert(arraysEqual(actual, expected))
    }
    testPairs(['a'], [])
    testPairs(['a','b'], [['a','b']])
    testPairs(
        ['a','b','c','d'],
        [['a','b'], ['a','c'], ['a','d'], ['b','c'], ['b','d'], ['c','d']]
    )
})()

/*
To apply gravity, consider every pair of moons. On each axis (x, y, and z), the velocity of each moon changes by exactly +1 or -1 to pull the moons together. For example, if Ganymede has an x position of 3, and Callisto has a x position of 5, then Ganymede's x velocity changes by +1 (because 5 > 3) and Callisto's x velocity changes by -1 (because 3 < 5). However, if the positions on a given axis are the same, the velocity on that axis does not change for that pair of moons.
*/
function gravity(moons) {
    function pull(positionA, positionB) {
        const res = [[], []]

        function trichotomy(a, b) {
            if (a - b) {
                return (a > b) ? [-1, 1] : [1, -1]
            }
            return [0, 0]
        }
        assert(arraysEqual(trichotomy(0, 0), [0, 0]))
        assert(arraysEqual(trichotomy(3, 5), [1, -1]))
        assert(arraysEqual(trichotomy(5, 3), [-1, 1]))

        positionA.forEach((_, index) => {
            const temp = trichotomy(positionA[index], positionB[index])
            res[0][index] = temp[0]
            res[1][index] = temp[1]
        })

        return res
    }

    let pulls = moons.map(() => [])

    pairs(moons, (pair,lix, rix) => {
        const effect = pull(pair[0].position, pair[1].position)
        pulls[lix].push(effect[0])
        pulls[rix].push(effect[1])
    })
    return moons.map((moon, ix) => {
      return {
        position: moon.position,
        velocity: pulls[ix].reduce((p,c) => vectorAdd(p,c), moon.velocity),
      }
    })
  }

  function vectorAdd(a,b) {
    return a.map((_,ix) => a[ix] + b[ix])
  }

(() => {
    function testGravity(moons, expected) {
        const actual = gravity(moons)
        assert(
            arraysEqual(actual, expected),
            `Actual\n${JSON.stringify(actual)}\nExpected:\n${JSON.stringify(expected,null,true)}`)
    }
    testGravity([
        {position:[3,0,0], velocity:[0,0,0]},
        {position:[5,0,0], velocity:[0,0,0]}
    ], [
        {position:[3,0,0], velocity:[1,0,0]},
        {position:[5,0,0], velocity:[-1,0,0]}
    ])
})()

/*
Once all gravity has been applied, apply velocity: simply add the velocity of each moon to its own position. For example, if Europa has a position of x=1, y=2, z=3 and a velocity of x=-2, y=0,z=3, then its new position would be x=-1, y=2, z=6. This process does not modify the velocity of any moon.
*/

function velocity(moons) {
    return moons.map((moon) => {
        return {
            position: moon.position.map(
                (magnitude, axis) => magnitude + moon.velocity[axis]
            ),
            velocity: moon.velocity
        }
    })
}

(() => {
    function testVelocity(moon, expected) {
        const actual = velocity([moon])
        assert(
            arraysEqual(actual[0].position, expected),
            `${actual[0].position} !== ${expected}`)
    }
    testVelocity({position:[1,2,3], velocity:[-2,0,3]}, [-1,2,6])
})()

function printSystem(moons) {
    // moons.forEach((moon) => console.log(JSON.stringify(moon)))
    moons.map(JSON.stringify).forEach((moon) => console.log(moon))
}

function asteroidsEqual(a,b) {
    return arraysEqual(a.position, b.position) &&
           arraysEqual(a.velocity, b.velocity)
}

function parseCoord(coordStr) {
    return coordStr.split(',').map((col) => parseInt(col.split('=')[1]))
}
function parseSmallScan(map) {
    return map
      .split('\n')
      .filter((row) => row.trim().length)
      .map((row) => parseCoord(row))
      .map((row) => ({position:row, velocity:[0,0,0]}))
}

(() => {
    function test(map, expected) {
        const actual = parseSmallScan(map)
        assert(actual.length === expected.length)
        actual.forEach((_,ix) => {
            assert(
                asteroidsEqual(actual[ix], {position:expected[ix],velocity:[0,0,0]}),
                `smallMap ${ix} ${JSON.stringify(actual[ix].position)} !== ${JSON.stringify(expected[ix])}`
                )
        });
    }
    const test1Map = `<x=-1, y=0, z=2>
        <x=2, y=-10, z=-7>
        <x=4, y=-8, z=8>
        <x=3, y=5, z=-1>`

    test(test1Map, [[ -1, 0, 2 ], [ 2, -10, -7 ], [ 4, -8, 8 ], [ 3, 5, -1 ] ])
})()

function parseFullScan(map) {
    return map
      .split('\n')
      .filter((row) => row.trim().length)
      .map((row) => {
          return row
            .match(/<[^>]+>/g)
            .map((v) => parseCoord(v))
        })
      .map((row) => ({position:row[0], velocity:row[1]}))
}

(() => {
    function test(map, expected) {
        const actual = parseFullScan(map)
        assert(actual.length === expected.length)
        actual.forEach((_,ix) => {
            assert(
                asteroidsEqual(actual[ix], expected[ix]),
                `smallMap ${ix} ${JSON.stringify(actual[ix].position)} !== ${JSON.stringify(expected[ix])}`
            )
        })
    }
    test(`pos=<x=-1, y=  0, z= 2>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 2, y=-10, z=-7>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 4, y= -8, z= 8>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 3, y=  5, z=-1>, vel=<x= 0, y= 0, z= 0>`,
        [
        { position: [-1, 0, 2], velocity: [0, 0, 0] },
        { position: [2, -10, -7], velocity: [0, 0, 0] },
        { position: [4, -8, 8], velocity: [0, 0, 0] },
        { position: [3, 5, -1], velocity: [0, 0, 0] }
    ])
})();


/*
Simulating the motion of these moons would produce the following:
*/
function systemsEqual(systemA, systemB) {
    if (systemA.length === systemB.length) {
        return !systemA
            .map((moon, ix) => asteroidsEqual(systemA[ix], systemB[ix]))
            .some((equal) => !equal)
    }
}

function test_compareSystems(actual, expected) {
    assert(actual.length === expected.length)
    actual.forEach((_,ix) => {
        assert(
            asteroidsEqual(actual[ix], expected[ix]),
            `${ix}: ${JSON.stringify(actual[ix])} !== ${JSON.stringify(expected[ix])}`
        )
    })
}

(() => {
    const steps = [
        //After 0 steps:
        `pos=<x=-1, y=  0, z= 2>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 2, y=-10, z=-7>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 4, y= -8, z= 8>, vel=<x= 0, y= 0, z= 0>
        pos=<x= 3, y=  5, z=-1>, vel=<x= 0, y= 0, z= 0>`,

        //After 1 step:
        `pos=<x= 2, y=-1, z= 1>, vel=<x= 3, y=-1, z=-1>
        pos=<x= 3, y=-7, z=-4>, vel=<x= 1, y= 3, z= 3>
        pos=<x= 1, y=-7, z= 5>, vel=<x=-3, y= 1, z=-3>
        pos=<x= 2, y= 2, z= 0>, vel=<x=-1, y=-3, z= 1>`,

        // After 2 steps:
        `pos=<x= 5, y=-3, z=-1>, vel=<x= 3, y=-2, z=-2>
        pos=<x= 1, y=-2, z= 2>, vel=<x=-2, y= 5, z= 6>
        pos=<x= 1, y=-4, z=-1>, vel=<x= 0, y= 3, z=-6>
        pos=<x= 1, y=-4, z= 2>, vel=<x=-1, y=-6, z= 2>`,

        // After 3 steps:
        `pos=<x= 5, y=-6, z=-1>, vel=<x= 0, y=-3, z= 0>
        pos=<x= 0, y= 0, z= 6>, vel=<x=-1, y= 2, z= 4>
        pos=<x= 2, y= 1, z=-5>, vel=<x= 1, y= 5, z=-4>
        pos=<x= 1, y=-8, z= 2>, vel=<x= 0, y=-4, z= 0>`,

        // After 4 steps:
        `pos=<x= 2, y=-8, z= 0>, vel=<x=-3, y=-2, z= 1>
        pos=<x= 2, y= 1, z= 7>, vel=<x= 2, y= 1, z= 1>
        pos=<x= 2, y= 3, z=-6>, vel=<x= 0, y= 2, z=-1>
        pos=<x= 2, y=-9, z= 1>, vel=<x= 1, y=-1, z=-1>`,

        // After 5 steps:
        `pos=<x=-1, y=-9, z= 2>, vel=<x=-3, y=-1, z= 2>
        pos=<x= 4, y= 1, z= 5>, vel=<x= 2, y= 0, z=-2>
        pos=<x= 2, y= 2, z=-4>, vel=<x= 0, y=-1, z= 2>
        pos=<x= 3, y=-7, z=-1>, vel=<x= 1, y= 2, z=-2>`,

        // After 6 steps:
        `pos=<x=-1, y=-7, z= 3>, vel=<x= 0, y= 2, z= 1>
        pos=<x= 3, y= 0, z= 0>, vel=<x=-1, y=-1, z=-5>
        pos=<x= 3, y=-2, z= 1>, vel=<x= 1, y=-4, z= 5>
        pos=<x= 3, y=-4, z=-2>, vel=<x= 0, y= 3, z=-1>`,

        // After 7 steps:
        `pos=<x= 2, y=-2, z= 1>, vel=<x= 3, y= 5, z=-2>
        pos=<x= 1, y=-4, z=-4>, vel=<x=-2, y=-4, z=-4>
        pos=<x= 3, y=-7, z= 5>, vel=<x= 0, y=-5, z= 4>
        pos=<x= 2, y= 0, z= 0>, vel=<x=-1, y= 4, z= 2>`,

        // After 8 steps:
        `pos=<x= 5, y= 2, z=-2>, vel=<x= 3, y= 4, z=-3>
        pos=<x= 2, y=-7, z=-5>, vel=<x= 1, y=-3, z=-1>
        pos=<x= 0, y=-9, z= 6>, vel=<x=-3, y=-2, z= 1>
        pos=<x= 1, y= 1, z= 3>, vel=<x=-1, y= 1, z= 3>`,

        // After 9 steps:
        `pos=<x= 5, y= 3, z=-4>, vel=<x= 0, y= 1, z=-2>
        pos=<x= 2, y=-9, z=-3>, vel=<x= 0, y=-2, z= 2>
        pos=<x= 0, y=-8, z= 4>, vel=<x= 0, y= 1, z=-2>
        pos=<x= 1, y= 1, z= 5>, vel=<x= 0, y= 0, z= 2>`,

        // After 10 steps:
        `pos=<x= 2, y= 1, z=-3>, vel=<x=-3, y=-2, z= 1>
        pos=<x= 1, y=-8, z= 0>, vel=<x=-1, y= 1, z= 3>
        pos=<x= 3, y=-6, z= 1>, vel=<x= 3, y= 2, z=-3>
        pos=<x= 2, y= 0, z= 4>, vel=<x= 1, y=-1, z=-1>`
    ].map(parseFullScan)
    const expectedEnergy = 179

    let state = steps[0]
    for (let index = 1 ; index < steps.length; index++) {
        state = simulate(state)
        test_compareSystems(state, steps[index])
    }
    const actualEnergy = systemEnergy(state)
    assert(
        expectedEnergy === actualEnergy,
        `System energy ${actualEnergy}, expected ${expectedEnergy}`
        )
})();

/*
Then, it might help to calculate the total energy in the system. The total energy for a single moon is its potential energy multiplied by its kinetic energy. A moon's potential energy is the sum of the absolute values of its x, y, and z position coordinates. A moon's kinetic energy is the sum of the absolute values of its velocity coordinates. Below, each line shows the calculations for a moon's potential energy (pot), kinetic energy (kin), and total energy:

Energy after 10 steps:
pot: 2 + 1 + 3 =  6;   kin: 3 + 2 + 1 = 6;   total:  6 * 6 = 36
pot: 1 + 8 + 0 =  9;   kin: 1 + 1 + 3 = 5;   total:  9 * 5 = 45
pot: 3 + 6 + 1 = 10;   kin: 3 + 2 + 3 = 8;   total: 10 * 8 = 80
pot: 2 + 0 + 4 =  6;   kin: 1 + 1 + 1 = 3;   total:  6 * 3 = 18
Sum of total energy: 36 + 45 + 80 + 18 = 179
In the above example, adding together the total energy for all moons after 10 steps produces the total energy in the system, 179.
*/
function totalEnergy(moon) {
    const potential = moon.position.map(Math.abs).reduce((p,c) => p + c, 0)
    const kinetic = moon.velocity.map(Math.abs).reduce((p,c) => p + c, 0)
    return potential * kinetic
}
function systemEnergy(moons) {
    return moons
        .map((moon) => totalEnergy(moon))
        .reduce((p,c) => p + c, 0)
}
(() => {
    function test(map, expected) {
        const moons = parseFullScan(map)
        const actual = systemEnergy(moons)
        assert(actual === expected, `${actual} !== ${expected}`)
    }
    test(`pos=<x= 2, y= 1, z=-3>, vel=<x=-3, y=-2, z= 1>
    pos=<x= 1, y=-8, z= 0>, vel=<x=-1, y= 1, z= 3>
    pos=<x= 3, y=-6, z= 1>, vel=<x= 3, y= 2, z=-3>
    pos=<x= 2, y= 0, z= 4>, vel=<x= 1, y=-1, z=-1>`,179)

    test(`pos=<x=  8, y=-12, z= -9>, vel=<x= -7, y=  3, z=  0>
    pos=<x= 13, y= 16, z= -3>, vel=<x=  3, y=-11, z= -5>
    pos=<x=-29, y=-11, z= -1>, vel=<x= -3, y=  7, z=  4>
    pos=<x= 16, y=-13, z= 23>, vel=<x=  7, y=  1, z=  1>`, 1940)
})();

/*
Here's a second example:

*/

(() => {
    const keyedSteps = {
        // After 0 Steps:
        0: `pos=<x= -8, y=-10, z=  0>, vel=<x=  0, y=  0, z=  0>
        pos=<x=  5, y=  5, z= 10>, vel=<x=  0, y=  0, z=  0>
        pos=<x=  2, y= -7, z=  3>, vel=<x=  0, y=  0, z=  0>
        pos=<x=  9, y= -8, z= -3>, vel=<x=  0, y=  0, z=  0>`,

        // After 10 steps:
        10: `pos=<x= -9, y=-10, z=  1>, vel=<x= -2, y= -2, z= -1>
        pos=<x=  4, y= 10, z=  9>, vel=<x= -3, y=  7, z= -2>
        pos=<x=  8, y=-10, z= -3>, vel=<x=  5, y= -1, z= -2>
        pos=<x=  5, y=-10, z=  3>, vel=<x=  0, y= -4, z=  5>`,

        // After 20 steps:
        20: `pos=<x=-10, y=  3, z= -4>, vel=<x= -5, y=  2, z=  0>
        pos=<x=  5, y=-25, z=  6>, vel=<x=  1, y=  1, z= -4>
        pos=<x= 13, y=  1, z=  1>, vel=<x=  5, y= -2, z=  2>
        pos=<x=  0, y=  1, z=  7>, vel=<x= -1, y= -1, z=  2>`,

        // After 30 steps:
        30: `pos=<x= 15, y= -6, z= -9>, vel=<x= -5, y=  4, z=  0>
        pos=<x= -4, y=-11, z=  3>, vel=<x= -3, y=-10, z=  0>
        pos=<x=  0, y= -1, z= 11>, vel=<x=  7, y=  4, z=  3>
        pos=<x= -3, y= -2, z=  5>, vel=<x=  1, y=  2, z= -3>`,

        // After 40 steps:
        40: `pos=<x= 14, y=-12, z= -4>, vel=<x= 11, y=  3, z=  0>
        pos=<x= -1, y= 18, z=  8>, vel=<x= -5, y=  2, z=  3>
        pos=<x= -5, y=-14, z=  8>, vel=<x=  1, y= -2, z=  0>
        pos=<x=  0, y=-12, z= -2>, vel=<x= -7, y= -3, z= -3>`,

        // After 50 steps:
        50: `pos=<x=-23, y=  4, z=  1>, vel=<x= -7, y= -1, z=  2>
        pos=<x= 20, y=-31, z= 13>, vel=<x=  5, y=  3, z=  4>
        pos=<x= -4, y=  6, z=  1>, vel=<x= -1, y=  1, z= -3>
        pos=<x= 15, y=  1, z= -5>, vel=<x=  3, y= -3, z= -3>`,

        // After 60 steps:
        60: `pos=<x= 36, y=-10, z=  6>, vel=<x=  5, y=  0, z=  3>
        pos=<x=-18, y= 10, z=  9>, vel=<x= -3, y= -7, z=  5>
        pos=<x=  8, y=-12, z= -3>, vel=<x= -2, y=  1, z= -7>
        pos=<x=-18, y= -8, z= -2>, vel=<x=  0, y=  6, z= -1>`,

        // After 70 steps:
        70: `pos=<x=-33, y= -6, z=  5>, vel=<x= -5, y= -4, z=  7>
        pos=<x= 13, y= -9, z=  2>, vel=<x= -2, y= 11, z=  3>
        pos=<x= 11, y= -8, z=  2>, vel=<x=  8, y= -6, z= -7>
        pos=<x= 17, y=  3, z=  1>, vel=<x= -1, y= -1, z= -3>`,

        // After 80 steps:
        80: `pos=<x= 30, y= -8, z=  3>, vel=<x=  3, y=  3, z=  0>
        pos=<x= -2, y= -4, z=  0>, vel=<x=  4, y=-13, z=  2>
        pos=<x=-18, y= -7, z= 15>, vel=<x= -8, y=  2, z= -2>
        pos=<x= -2, y= -1, z= -8>, vel=<x=  1, y=  8, z=  0>`,

        // After 90 steps:
        90: `pos=<x=-25, y= -1, z=  4>, vel=<x=  1, y= -3, z=  4>
        pos=<x=  2, y= -9, z=  0>, vel=<x= -3, y= 13, z= -1>
        pos=<x= 32, y= -8, z= 14>, vel=<x=  5, y= -4, z=  6>
        pos=<x= -1, y= -2, z= -8>, vel=<x= -3, y= -6, z= -9>`,

        // After 100 steps:
        100: `pos=<x=  8, y=-12, z= -9>, vel=<x= -7, y=  3, z=  0>
        pos=<x= 13, y= 16, z= -3>, vel=<x=  3, y=-11, z= -5>
        pos=<x=-29, y=-11, z= -1>, vel=<x= -3, y=  7, z=  4>
        pos=<x= 16, y=-13, z= 23>, vel=<x=  7, y=  1, z=  1>`,
    }
    const steps = []
    let MAX_STEP = 0
    Object.keys(keyedSteps).map((key) => {
        steps[key] = parseFullScan(keyedSteps[key])
        MAX_STEP = Math.max(parseInt(key))
    })

    let state = steps[0]
    let actualEnergy
    for (let index = 1 ; index <= 1000 ; index++) {
        state = simulate(state)
        actualEnergy = systemEnergy(state)
        if (index === 100) {
            const expectedEnergy = 1940
            assert(
                expectedEnergy === actualEnergy,
                `System energy ${actualEnergy}, expected ${expectedEnergy}`
                )
        }
        if (steps[index]) {
            test_compareSystems(state, steps[index])
        }
    }
    console.log(actualEnergy)
})();

(() => {
    let state = parseSmallScan(`<x=14, y=2, z=8>
        <x=7, y=4, z=10>
        <x=1, y=17, z=16>
        <x=-4, y=-1, z=1>`)

    for (let index = 0 ; index < 1000 ; index++) {
        state = simulate(state)
    }
    const energy = systemEnergy(state)
    console.log(`Part One Answer is ${energy}`)
    assert(9139 === energy, `You broke part 1`)

})();

// Part II

(() => {
    let state = parseSmallScan(`<x=-1, y=0, z=2>
    <x=2, y=-10, z=-7>
    <x=4, y=-8, z=8>
    <x=3, y=5, z=-1>`)

    function hash64(str) {
        var i = str.length
        var hash1 = 5381
        var hash2 = 52711

        while (i--) {
          const char = str.charCodeAt(i)
          hash1 = (hash1 * 33) ^ char
          hash2 = (hash2 * 33) ^ char
        }

        return (hash1 >>> 0) * 4096 + (hash2 >>> 0)
    }

    function test(smallScan, expected) {
        let state = parseSmallScan(smallScan)
        const hashesFound = {}
        let step = 0

        while (true) {
            const hash = hash64(JSON.stringify(state))
            if (hashesFound[hash] !== undefined) {
                console.log(`Step ${step} has same hash as ${hashesFound[hash]}`)
                break;
            }
            hashesFound[hash] = step
            if (0 === (step % 100000)) {
                console.log(`${step}: Found ${Object.keys(hashesFound).length} energies so far...`)
            }

            state = simulate(state)
            step++
        }
        assert(expected === step, `${expected} !== ${step}`)
    }

    test(`<x=-1, y=0, z=2>
        <x=2, y=-10, z=-7>
        <x=4, y=-8, z=8>
        <x=3, y=5, z=-1>`, 2772)

    test(`<x=-8, y=-10, z=0>
        <x=5, y=5, z=10>
        <x=2, y=-7, z=3>
        <x=9, y=-8, z=-3>`, 4686774924)
})();
