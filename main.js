const LSystem = require ('./Systems/LSystem_New.js');
const scribble = require('scribbletune');
const Renderer = require('./Renderer/Renderer.js');
const config = require('./properties.json');


/*
=====================================================
L System Work
=====================================================
*/



let systems = config.systems;
for(let sysIndex in systems) {
	let system = systems[sysIndex];
	let lSys = new LSystem(system.axiom, system.predicates, system.ignoreContext);
	lSys.advanceGenerations(system.generations);
	console.log('currentLexicon', lSys.currentLexicon);
	console.log('===========================');
	
	console.log('key', scribble.scale(config.midi.key + ' 3').concat(scribble.scale(config.midi.key + ' 4')).concat(scribble.scale(config.midi.key + ' 5')));
	let globalKey = scribble.scale(config.midi.key + ' 3').concat(scribble.scale(config.midi.key + ' 4')).concat(scribble.scale(config.midi.key + ' 5'))
	let renderer = new Renderer(globalKey);
	renderer.render(lSys.currentLexicon);
	let track = scribble.clip({
		notes: renderer._notes,
		pattern: renderer._pattern,
		sizzle: config.midi.sizzle,
		noteLength: system.timeScale
	});
	scribble.midi(track, system.name);
}


let test = scribble.clip({
	notes: [['a4', 'b4', 'c4'], 'FMaj', 'GMaj', 'CMaj'],
	pattern: 'x---'.repeat(4)
});
scribble.midi(test, "test_mid_track.mid");

console.log("done");