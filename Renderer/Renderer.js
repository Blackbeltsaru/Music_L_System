class Renderer {
	
	constructor(key) {
		this._stack = [];
		this._key = key;
		this._notes = [];
		this._pattern = '';
	}
	
	get key() {return this._key;}
	set key(key) {this._key = key;}
	
	_createNewState() {
		return {
			note: [0],
			noteLength: 0,
			noteIndex: 0
		}
	}
	
	_renderNote(state) {
		
		if(state.noteLength <= 0) return; //TODO should this be a rest?
		
		let length = this._key.length;
		let midNote = Math.floor(length/2);
		let chord = [];
		for(let nIndex in state.note) {
			let noteLocation = (((midNote + state.note[nIndex]) % this._key.length) + this._key.length) % this._key.length;
			chord.push(this._key[noteLocation]);
		}
		this._notes.push(chord);
		
		let currentPattern = 'x' + '_'.repeat(state.noteLength - 1);
		this._pattern = this._pattern.concat(currentPattern);
	}
	
	render(renderString) {
		let state = this._createNewState();
		let chars = renderString.split('');
		for(let newChar in chars) {
			let currentChar = chars[newChar];
			switch(currentChar) {
				case 'F':
					state.noteLength ++;
					break;
				case '[':
					let tempState = Object.assign({}, state);
					this._stack.push(tempState);
					state = this._createNewState();
					state.note = Object.assign([], tempState.note);
					break;
				case ']':
					this._renderNote(state);
					state = this._stack.pop();
					break;
				case '+':
					state.note[state.noteIndex] ++;
					break;
				case '-':
					state.note[state.noteIndex] --;
					break;
				//Sub branches - start chord
				case '{':
					state.noteIndex ++;
					if(typeof state.note[state.noteIndex] === 'undefined') {
						state.note[state.noteIndex] = state.note[state.noteIndex - 1];
					}
					break;
				case '}':
					state.noteIndex --;
					break;
			}
		}
		this._renderNote(state);
	}
}

module.exports = Renderer