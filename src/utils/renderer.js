import {createScheduler} from './scheduler-factory.js'

export let {
	throttle: throttleRender,
	request: requestRender,
	afterNext: afterNextRender,
	waitForNext: waitForNextRender
} = createScheduler(requestAnimationFrame)