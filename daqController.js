// import daqmx from 'daqmx'
import { Observable } from 'rxjs'
import { share } from 'rxjs/operators'
const daqmx = {}

let taskIndex = 1

export function getAvailableDevices() {
  const devices = daqmx.devices()
  return devices
}

export function createTask(
  device,
  channels,
  sampleTiming,
  startTiming,
  name = `myAIVoltageTask${taskIndex}`
) {
  const task = new daqmx.AIVoltageTask({
    name,
    device,
    channels,
    sampleTiming,
    startTiming,
  })
  taskIndex++
  return task
}

export function createTaskByChannelsNames(
  device,
  channelsNames,
  rate,
  samplesPerChannel
) {
  const task = new daqmx.AIVoltageTask({
    device,
    channels: channelsNames.map((name) => {
      return { terminal: name }
    }),
    sampleTiming: {
      rate,
      samplesPerChannel,
    },
  })
  return task

  // task.start();
  // var x = task.read(); // infinite timeout
  //var x = task.read(10.0); // 10 second timeout
}

export function createTaskByConsecutiveChannels(
  device,
  channelStartIndex,
  channelEndIndex,
  rate,
  samplesPerChannel
) {
  const task = new daqmx.AIVoltageTask({
    device,
    channels: [{ terminal: `ai${channelStartIndex}:${channelEndIndex}` }],
    sampleTiming: {
      rate,
      samplesPerChannel,
    },
  })
  return task
}

export function readSamples(task) {
  const readAsync = (observable) => {
    process.nextTick(() => {
      // call canRead() tests if all samples can be read
      if (task.canRead()) {
        const data = task.read(0.0) // should read immediately
        observable.next(data)
      } else {
        // not ready so wait until next tick
        readAsync(observable)
      }
    })
  }
  return Observable.create(readAsync).pipe(share())
}
