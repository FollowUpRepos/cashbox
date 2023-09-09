// Create a cash box outside any closures, so that it can be
// accessed both from inside the createCashCounter closure and
// from the test suite. Fill it with cash.

const cashBox = [
  // { denomination: 200,    number: 4 },
  // { denomination: 100,    number: 4 },
  { denomination:  50,    number: 4 },
  { denomination:  20,    number: 4 },
  { denomination:  10,    number: 4 },
  { denomination:   5,    number: 4 },
  { denomination:   2,    number: 4 },
  { denomination:   1,    number: 4 },
  { denomination:   0.5,  number: 4 },
  { denomination:   0.2,  number: 4 },
  { denomination:   0.1,  number: 4 },
  { denomination:   0.05, number: 4 },
  { denomination:   0.02, number: 4 },
  { denomination:   0.01, number: 4 },
]


const calculateCashInBox = () => {
  const cash = cashBox.reduce((cash, { denomination, number }) => {
    return cash + denomination * number
  }, 0)

  return Math.round(cash * 100) / 100
}


const cashBefore = calculateCashInBox()
console.log("Cash before:", cashBefore);

let totalRevenue = 0


// Create a function to act as a closure for the transactions 
const createCashCounter = () => {
  
  /**
   * giveChange
   *
   * @param {number} amount - the amount of change to return
   * @returns 
   *     { say: string, 
   *       change?: undefined | number
   *     }
   */
  const giveChange = (amount) => {
    // Copy `amount` so that we have a value that can be 
    // decremented as we take money from the cash box, and yet
    // we still have a record of the total amount to give back.
    let remaining = amount

    // Create an array to store how much of each denomination
    // we want to take from the cash box... but don't take
    // anything from the cash box until we can be sure that we
    // have the correct change.
    const change = []

    // The Array.prototype.every() method is like .forEach()
    // except that it stops iterating if a falsy value is
    // returned. If we can find enough change, then we will set
    // notEnough to false, and stop iterating.
    const notEnough = cashBox.every((drawer) => {
      const { denomination, number } = drawer

      if (number && denomination <= remaining) {
        // This drawer is not empty and this denomination will be
        // useful as part of the change
        let needed = (remaining / denomination) // floating point
        needed = parseInt(needed, 10)           // integer

        if (number < needed) {
          // There's not enough of this denomination. Take as
          // many of this denomination as we can, and hope that
          // we can find the rest in smaller denominations.
          needed = number
        }

        // Remember what we are about to take...
        change.push(
          { denomination, number: needed }
        )

        // ... and how much change we still need to find
        remaining -= (denomination * needed)
        remaining = Math.round(remaining * 100) / 100
      }

      // `remaining` may never become exactly zero because of
      // rounding errors. However, if the amount to return is
      // less than the smallest coin, we can igrone it

      return remaining > 0.001
      // false if the total amount has been found
    })

    if (!notEnough) { // We DID find enough change
      // Remove the various denominations from their drawers
      change.forEach(({ denomination, number }) => {
        const cashDrawer = cashBox.find((drawer) => (
          denomination === drawer.denomination
        ))

        cashDrawer.number -= number
      })

      // We could give details about how the change is made up,
      // but that would require refining the testing procedure.
      return {
        say: `Here's your change: €${amount}.`,
        change: amount
      }
    }

    // We only get here if `notEnough` is true
    return {
      say: `I'm sorry. I haven't got enough change.`
    }
  }



  return function treatPayment(price, payment) {
    let remittance // value of money tendered

    if (Array.isArray(payment)) {
      // `payment` may be an array of objects with the structure...
      // { denomination: <number>, number: <integer> }
      // ... representing the notes and coins that were tendered

      // TODO: calculate value of payment from denominations paid
      // remittance = payment.reduce(x => {}, 0)
    } else {
      // Assume for now that the payment is one exact denomination
      // (note or coin).

      remittance = payment
      payment = [{ denomination: payment, number: 1}]

      // TODO: In the future, it might be a floating-point number 
      // that should be split into the smallest number of
      // available denominations
    }

    let change = remittance - price
    change = Math.round(change * 100) / 100

    if (change < 0) {
      // Refuse the transaction
      return {
        say: `You didn't pay enough. I need another €${Math.abs(change)}`
      }
    }

    // We can only get here if the payment was greater than or
    // equal to the price.

    // Put the payment in the cashbox
    payment.forEach(({ denomination, number }) => {
      const cashDrawer = cashBox.find((drawer) => (
        denomination === drawer.denomination
      ))

      cashDrawer.number += number
    })

    totalRevenue += price

    if (change === 0) {
      // There's nothing more to do
      return {
        say: "Thank you for paying the exact amount."
      }
    }

    const result = giveChange(change)
    if (!result.change) {
      // Give back the money and refuse the sale
      totalRevenue -= price

      payment.forEach(({ denomination, number }) => {
        const cashDrawer = cashBox.find((drawer) => (
          denomination === drawer.denomination
        ))
  
        cashDrawer.number -= number
      })
    }

    return result
  }
}


const cashCounter = createCashCounter()


/// TESTS ///

testArray = [
  {
    price: 50,
    payment: 10,
    cashBoxContains: [{ denomination: 10, number: 4 }],
    result: {
      say: `You didn't pay enough. I need another €40`,
    }
  },
  {
    price: 50,
    payment: 50,
    cashBoxContains: [{ denomination: 50, number: 5 }],
    result: {
      say: "Thank you for paying the exact amount.",
    }
  },
  {
    price: 40,
    payment: 50,
    cashBoxContains: [
      { denomination: 50, number: 6 },
      { denomination: 10, number: 3}
    ],
    result: {
      say: `Here's your change: €10.`,
      change: 10
    }
  },
  {
    price: 5.67,
    payment: 10,
    cashBoxContains: [
      { denomination: 10, number: 4},
      { denomination: 2, number: 2},
      { denomination: 0.2, number: 3},
      { denomination: 0.1, number: 3},
      { denomination: 0.02, number: 3},
      { denomination: 0.01, number: 3}
    ],
    result: {
      say: `Here's your change: €4.33.`,
      change: 4.33
    }
  },
  {
    price: 0.01,
    payment: 1,
    cashBoxContains:  [
      { denomination: 1, number: 5},
      { denomination: 0.2, number: 1},
      { denomination: 0.1, number: 3},
      { denomination: 0.02, number: 1},
      { denomination: 0.01, number: 3}
    ],
    result: {
      say: `Here's your change: €0.99.`,
      change: 0.99
    }
  },
  {
    price: 0.01,
    payment: 1,
    cashBoxContains:  [
      { denomination: 1, number: 6},
      { denomination: 0.2, number: 0},
      { denomination: 0.1, number: 1},
      { denomination: 0.02, number: 0},
      { denomination: 0.01, number: 1}
    ],
    result: {
      say: `Here's your change: €0.99.`,
      change: 0.99
    }
  },
  {
    price: 0.28,
    payment: 1,
    cashBoxContains:  [
      { denomination: 1, number: 6},
      { denomination: 0.2, number: 0},
      { denomination: 0.1, number: 1},
      { denomination: 0.02, number: 0},
      { denomination: 0.01, number: 1}
    ],
    result: {
      say: `I'm sorry. I haven't got enough change.`
    }
  },
  {
    price: 0.29,
    payment: 1,
    cashBoxContains:  [
      { denomination: 50, number: 6 },
      { denomination: 10, number: 4},
      { denomination: 2, number: 2},
      { denomination: 0.5, number: 1},
      { denomination: 0.2, number: 0},
      { denomination: 0.1, number: 0},
      { denomination: 0.02, number: 0},
      { denomination: 0.01, number: 0}
    ],
    result: {
      say: `Here's your change: €0.71.`,
      change: 0.71
    }
  }
]

let errors = 0

testArray.forEach(({ price, payment, result, cashBoxContains }) => {
  const outcome = cashCounter(price, payment)

  let speechErrorString = ""
  let changeErrorString = ""
  if (outcome.say !== result.say) {
    speechErrorString += `Speech:
    expected: ${result.say}
    found: ${outcome.say}`
  } else if (outcome.change !== result.change) {
    changeErrorString += `Change:
    expected: ${result.change}
    found: ${outcome.change}`
  }

  // Check the cashbox
  let cashErrorString = ""

  cashBoxContains.forEach((cashCheck) => {
    const { denomination, number } = cashCheck
    const drawer = cashBox.find(drawer => (
      drawer.denomination === denomination
    ))

    if (drawer.number !== number) {
      cashErrorString += `
    expected: €${cashCheck.denomination} x ${cashCheck.number}
    found:  €${drawer.denomination} x ${drawer.number}`
    }
  })


  const speechErrors = speechErrorString.length
  const changeErrors = changeErrorString.length
  const cashErrors = cashErrorString.length

  if (speechErrors || changeErrors || cashErrors ) {
    errors += speechErrors + changeErrors + cashErrors

    console.log(`!!!!!!
    ERROR with price: ${price}, payment: ${payment}
    ${speechErrors ? speechErrorString : ""}
    ${changeErrors ? changeErrorString : ""}
    ${cashErrors ? cashErrorString : ""}
    `)

  } else {
    console.log(`After treating price: ${price}, payment: ${payment}`)
    console.log(result.say)
    console.table(cashBox)
  }

})


if (!errors) {
  const cashAfter = calculateCashInBox()
  console.log("Cash after:", cashAfter);

  if (cashBefore + totalRevenue === cashAfter) {

    console.log("✓ All tests passed!")
  } else {
    console.log(`ERROR
    expected cash in box: ${cashBefore + totalRevenue}
    actual cash in box: ${cashAfter}`)
    
  }
}