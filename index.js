const Immutable = require('immutable')

const RtmClient = require('@slack/client').RtmClient
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS
const RTM_EVENTS = require('@slack/client').RTM_EVENTS
const path = require('path')
const fs = require('fs')

if (process.env.SLACK_BOT_TOKEN) {
  throw new Error('Missing environment variable: SLACK_BOT_TOKEN')
}
const rtm = new RtmClient(process.env.SLACK_BOT_TOKEN)

const scriptsFile = path.join(__dirname, 'scripts.json')

let scripts = Immutable.List()
let ims

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, rtmStartData => {
  // console.log(rtmStartData.ims)
  ims = Immutable.fromJS(rtmStartData.ims)
})

const isDM = channel => ims.find(im => im.get('id') === channel) !== undefined

rtm.on(RTM_EVENTS.MESSAGE, function(a) {
  const { channel, subtype, user, text, ts, source_team, team } = a

  if (subtype !== undefined) {
    return
  }

  if (isDM(channel)) {
    onDM(channel, text)
  }
})

function onDM(channel, text) {
  addScriptCommand(channel, text)
  listScriptsCommand(channel, text)
  deleteScriptCommand(channel, text)
}
function addScriptCommand(channel, text) {
  const result = text.match(/^```(.*)```$/)
  if (result === null) {
    return
  }
  const code = result[1]

  scripts = scripts.push(code)
  save()
}

function listScriptsCommand(channel, text) {
  if (text !== 'list') {
    return
  }

  scripts.forEach((code, n) => {
    rtm.sendMessage('*' + n + '.*\n```\n' + code + '\n```', channel)
  })
}

function deleteScriptCommand(channel, text) {
  const result = text.match(/^delete ([0-9]+)$/)

  if (result === null) {
    return
  }

  const idx = Number(result[1])

  if (!scripts.has(idx)) {
    rtm.sendMessage(`The script with index *${idx}* doesn't exist`, channel)
    return
  }

  scripts = scripts.remove(idx)
  save()

  rtm.sendMessage(`The script with index *${idx}* was deleted`, channel)
}

function save() {
  fs.writeFile(
    scriptsFile,
    JSON.stringify(scripts.toJS(), null, '    '),
    () => {}
  )
}

function load() {
  fs.readFile(scriptsFile, (err, data) => {
    if (err) {
      throw err
    }
    scripts = Immutable.fromJS(JSON.parse(data))
  })
}

load()
rtm.start()
