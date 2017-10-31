const request = require('request')

events.onDM.register((user, text, reply) => {
  if (text.startsWith !== 'bell') {
    return
  }

  request.post('bellringer.com/ring')
  let state = loadState()
  if (state === undefined) {
    state = 0
  }
  state += 1
  saveState(state)
})

events.onDM.register((user, text, reply) => {
  if (text !== 'bellstats') {
    return
  }

  request.post('bellringer.com/ring')
  let state = loadState()
  if (state === undefined) {
    state = 0
  }
  reply(`Bell has been rung ${state} times`)
})
