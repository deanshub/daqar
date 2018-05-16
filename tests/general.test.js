import * as Rx from 'rxjs'
import {
  skipWhile,
  skipUntil,
  bufferCount,
  filter,
  merge,
  take,
  takeUntil,
  takeWhile,
  map,
  share,
} from 'rxjs/operators'
import daqController from '../daqController'

test('get devices', () => {
  const devices = daqController.getAvailableDevices()
  expect(devices.length).toBeGreaterThan(0)
  expect(devices[0]).toHaveProperty('name')
  expect(devices[0]).toHaveProperty('productType')
})

test('read from device', done => {
  const device = 'Dev1'
  const rate = 10000.0
  const samplesPerChannel = 10

  const task = daqController.createTaskByConsecutiveChannels(
    device,
    0,
    3,
    rate,
    samplesPerChannel
  )

  let threeDataPoints = []
  daqController.readSamples(task).subscribe(data => {
    threeDataPoints.push(data)
    expect(data).toBeDefined()
    if (threeDataPoints.length >= 3) {
      expect(threeDataPoints.length).toBeGreaterThanOrEqual(3)
      done()
    }
  })
})

test('get simulated data that is over 5 times and max of 1000', done => {
  const soundThreshold = 0.5
  const minTimesToStart = 5
  const minTimesToEnd = 5
  const maxTimes = 1000
  const muteThreshold = 0.5 // default soundThreshold

  const dataStream = Rx.from([0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,1,1,1,1,0,0,0,1,1,1,1,1,0,1,1,0,1,1,1,1,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0]).pipe(share())
  const expectedResults = [1,1,1,1,0,0,0,1,1,1,1,1,0,1,1,0,1,1,1,1,0,0,0,0,1,0,0,0,1,1]

  // const valuedStream = dataStream.pipe(
  //   skipWhile(sample => {
  //     return sample < soundThreshold
  //   })
  // )

  const lastSamplesAreAboveThreshold = dataStream.pipe(
    bufferCount(minTimesToStart, 1),
    takeWhile(group => group.length === minTimesToStart),
    filter(group => {
      const mutedSample = group.find(sample => {
        return sample < soundThreshold
      })
      return mutedSample === undefined
    })
  )

  const soundStream = dataStream.pipe(skipUntil(lastSamplesAreAboveThreshold))
  // const soundStream = dataStream.pipe(skipUntil(Rx.timer(0)))

  const lastSamplesAreBelowThreshold = soundStream.pipe(
    bufferCount(minTimesToEnd, 1),
    takeWhile(group => group.length === minTimesToEnd),
    filter(lastX => {
      return lastX.find(sample => sample > muteThreshold) === undefined
    })
  )
  const maxSamples = soundStream.pipe(take(maxTimes))
  const soundStreamFiltered = soundStream.pipe(
    takeUntil(merge(lastSamplesAreBelowThreshold, maxSamples))
  )

  let results = []
  // soundStream.subscribe(d => console.log('a:', d), null, () => {
  //   console.log('b')
  //   done()
  // })

  soundStreamFiltered.subscribe(
    sample => {
      results.push(sample)
    },
    console.error,
    () => {
      expect(results).toEqual(expectedResults)
      done()
    }
  )
})

// test('get sound that is over 5 times and max of 1000', () => {
//   const soundThreshold = 0.5
//   const minTimesToStart = 5
//   const minTimesToEnd = 5
//   const maxTimes = 1000
//   const muteThreshold = 0.5 // default soundThreshold
//
//   // at least minTimesToStart times that the value is soundThreshold and above
//   // then to end at least minTimesToEnd times that the value is equal or lower then muteThreshold
//   // or samples length is equal or more then maxTimes
//
//   const device = 'Dev1'
//   const rate = 10000.0
//   const samplesPerChannel = 10
//   const task = daqController.createTaskByConsecutiveChannels(device,  0,  3,  rate,  samplesPerChannel)
//   const dataStream = daqController.readSamples(task)
//
//   const soundsStream = dataStream.skiptWhile(sample => {
//     return sample < soundThreshold
//   })
//   // dataStream.flatMap(sample=>{
//   //
//   //   // .takeUntil()
//   // })
// })
