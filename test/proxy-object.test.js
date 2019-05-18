import {ProxyObject, proxyObject, observePath} from '../src/data-flow/proxy-object.js'
import {assert, assertThrow, assertNotThrow} from './utils.js'

globalThis.__testMode__ = true

class City extends ProxyObject {
	constructor(props) {
		super()
		this.name = ''
		this.people = proxyObject([])
		this.districts = proxyObject([])
		this.mayor = new Human
		this.obj = {x: 1}
		Object.assign(this, props)
	}
}

class District extends ProxyObject {
	constructor(props) {
		super()
		this.name = ''
		Object.assign(this, props)
	}
}

class Human extends ProxyObject {
	constructor(props) {
		super()
		this.firstName = ''
		this.lastName = ''
		this.birthdate = new Date(2000, 2, 2)
		Object.assign(this, props)
	}

	get age() {
		return (new Date).getFullYear() - this.birthdate.getFullYear()
	}
}

let newCity = () => {
	let city = new City({name: 'Signapore'})

	city.mayor = new Human({firstName: 'John', lastName: 'Wick'})

	city.districts.push(new District({name: 'D10'}))
	city.districts.push(new District({name: 'F20'}))
	city.districts.push(new District({name: 'G30'}))
	city.districts.push(new District({name: 'Y40'}))

	city.people.push(new Human({firstName: 'A', lastName: 'AA'}))
	city.people.push(new Human({firstName: 'B', lastName: 'BB'}))
	city.people.push(new Human({firstName: 'C', lastName: 'CC'}))

	return city
}


let city
let ok


// city.mayor =
city = newCity()
ok = false

observePath(city, 'mayor', (old, val) => {
	ok = true
})
city.mayor = new Human
assert(ok, 'city.mayor = new Human must trigger an observer')


// city.mayor.firstName =
city = newCity()
ok = false

observePath(city, 'mayor.firstName', (old, val) => {
	ok = old === 'John' && val == 'Jack'
})
observePath(city, 'mayor.lastName', (old, val) => {
	throw 'Must not trigger'
})
city.mayor.firstName = 'Jack'
assert(ok, `city.mayor.firstName = 'Jack' must trigger an observer`)


// observing non-proxy object
city = newCity()
ok = false

city.mayor = {firstName: 'John'}
assertNotThrow(`Observing the path 'mayor' must not throw an exception`, () => {
	observePath(city, 'mayor', (old, val) => {})
})
assertThrow(`Observing the path 'mayor.firstName' must throw an exception`, () => {
	observePath(city, 'mayor.firstName', (old, val) => {})
})
assertThrow(`Observing the path 'mayor.nonexistent' must throw an exception`, () => {
	observePath(city, 'mayor.nonexistent', (old, val) => {})
})

// return proxy object
city.mayor = new Human
assertNotThrow(`Observing the path 'mayor' must not throw an exception`, () => {
	observePath(city, 'mayor', (old, val) => {})
})
assertNotThrow(`Observing the path 'mayor.firstName' must not throw an exception`, () => {
	observePath(city, 'mayor.firstName', (old, val) => {})
})
assertNotThrow(`Observing the path 'mayor.nonexistent' must not throw an exception`, () => {
	observePath(city, 'mayor.nonexistent', (old, val) => {})
})


// observing non-proxy object (case 2)
city = newCity()
ok = false

assertNotThrow(`Must allow observing a non-proxy object`, () => {
	observePath(city, 'obj', (old, val) => {})
})
assertThrow(`Must not allow observing nested path on a non-proxy object`, () => {
	observePath(city, 'obj.x', (old, val) => {})
})
assertNotThrow(`Must allow observing a non-proxy Date object`, () => {
	observePath(city, 'mayor.birthdate', (old, val) => {})
})


// setting a non-proxy object to the observed path
city = newCity()
ok = false

assertNotThrow(`Observing the path 'mayor', before setting a non-proxy object, must not throw an exception`, () => {
	observePath(city, 'mayor', (old, val) => {})
})
assertThrow(`Setting a non-proxy object to the observed path 'mayor' must throw an exception`, () => {
	city.mayor = {firstName: 'John'}
})


// city.mayor = new Human with 'mayor.firstName' observer
city = newCity()
ok = false

observePath(city, 'mayor.firstName', (old, val) => {
	ok = old === 'John' && val == 'Jack'
})
city.mayor = new Human({firstName: 'Jack'})
assert(ok, `city.mayor = new Human must trigger 'mayor.firstName' observer`)


// city.mayor.wife = new Human with 'mayor.wife.firstName' observer
city = newCity()
ok = false

city.mayor.wife = new Human({firstName: 'Julia'})
observePath(city, 'mayor.wife.firstName', (old, val) => {
	ok = old === 'Julia' && val == 'Jasmine'
})
city.mayor.wife = new Human({firstName: 'Jasmine'})
assert(ok, `city.mayor.wife = new Human must trigger 'mayor.wife.firstName' observer`)


// city.mayor = new Human with 'mayor.wife.firstName' observer
city = newCity()
ok = false

city.mayor.wife = new Human({firstName: 'Julia'})
observePath(city, 'mayor.wife.firstName', (old, val) => {
	ok = old === 'Julia' && val == 'Jasmine'
})
city.mayor = new Human({
	firstName: 'Jack',
	wife: new Human({firstName: 'Jasmine'}),
})
assert(ok, `city.mayor = new Human must trigger 'mayor.wife.firstName' observer`)



// arrays

// city.districts = proxyObject([]) with 'districts' observer
city = newCity()
ok = false
observePath(city, 'districts', (old, val) => {
	ok = true
})
city.districts = proxyObject([])
assert(ok, `city.districts = proxyObject([]) must trigger 'districts' observer`)


// city.districts.push(new District) with 'districts' observer
city = newCity()
ok = true
observePath(city, 'districts', (old, val) => {
	ok = false
})
city.districts.push(new District)
assert(ok, `city.districts.push(new District) must not trigger 'districts' observer`)


// city.districts.push(new District) with 'districts.length' observer
city = newCity()
ok = false
observePath(city, 'districts.length', (old, val) => {
	ok = true
})
city.districts.push(new District)
assert(ok, `city.districts.push(new District) must trigger 'districts.length' observer`)


// city.districts.push(new District) with 'districts' observer
city = newCity()
ok = true
observePath(city, 'districts', (old, val) => {
	ok = false
})
city.districts.push(new District)
assert(ok, `city.districts.push(new District) must not trigger 'districts' observer`)


// city.districts[1].name = ... with 'districts.1.name' observer
city = newCity()
ok = false
observePath(city, 'districts.1.name', (old, val) => {
	ok = old === 'F20' && val === 'Z'
})
city.districts[1].name = 'Z'
assert(ok, `city.districts[1].name = 'Z' must trigger 'districts.1.name' observer`)


// city.districts[1] = new District with 'districts.1.name' observer
city = newCity()
ok = false
observePath(city, 'districts.1.name', (old, val) => {
	ok = old === 'F20' && val === 'Z'
})
city.districts[1] = new District({name: 'Z'})
assert(ok, `city.districts[1] = new District must trigger 'districts.1.name' observer`)


// city.districts.shift() with 'districts.1.name' observer
city = newCity()
ok = false
observePath(city, 'districts.1.name', (old, val) => {
	ok = old === 'F20' && val === 'G30'
})
city.districts.shift()
assert(ok, `city.districts.shift() must trigger 'districts.1.name' observer`)