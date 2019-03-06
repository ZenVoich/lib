import {createScheduler} from './scheduler-factory.js'

export let {
	debounce: debounceRender,
	request: requestRender,
	afterNext: afterNextRender,
	waitForNext: waitForNextRender
} = createScheduler(requestAnimationFrame)