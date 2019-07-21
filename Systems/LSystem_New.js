//This is the main class for the L system 
//This should have an:
    //axiom
    //predicates 
	//Ignored context characters
//We don't really care about the vocabulary because we will assume everything in the predicates and axioms is part of the vocabulary

//Ignore Context - These are characters in the vocabulary that we want processed but should be ignored when checking for context sensative predicates

//Note _'name' signifies private access. Because javascript is weird I think this is the best way to ensure encapsulation. 
//This mean that when attempting to write to currentLexicon, because the setter is a noop (because it shouldn't be changeable from outside the class), you will have to use _currentLexicon

/*
Predicates:
	{
		PREDECESSOR1: [
			{
				successor: "",
				probability: float
			},
			{
				successor: "",
				probability: float
			}
		]
		PREDECESSOR2: [
			{
				successor: "",
				probability: float
			}
		]
	}
Ignored Context
[
	"F", "+", "-"
]


TODO: the L System looses all information about its previous states - we may want to keep a recod of the history
*/

class LSystem {
	constructor(axiom, predicates, ignoredContext) {
		this._validatePredicates(predicates);
		this._axiom = axiom;
		this._predicates = predicates;
		this._currentLexicon = axiom;
		this._generation = 0;
		this._ignoredContext = ignoredContext
	}
	/*
	=================================================
	Getters and Setters
	=================================================
	*/
	get currentLexicon() {return this._currentLexicon;}
	set currentLexicon(newValue) {/*NOOP*/}
	
	get generation() {return this._generation;}
	set generation(newValue) {/*NOOP*/;}
	
	get axiom() {return this._axiom;}
	set axiom(newValue) {this._axiom = newValue;}
	
	get ignoreContext() {return this._ignoredContext;}
	set ignoreContext(newValue) {this._ignoredContext = newValue;}
	
	get predicates() {return this._predicates;}
	set predicates(newValue) {
		this._validatePredicates(newValue);
		this._predicates = newValue;
	}
	
	/*
	=====================================================
	Validation
	=====================================================
	*/
	_validatePredicates(predicates) {
		this._validateProbability(predicates);
	}
	
	//Validate that there is 100% probability for stocastic predicates
	_validateProbability(predicates) {
		if(!predicates) return;
		
		//For loop through each predecessor
		for(let key in predicates) {
			let successorInformation = predicates[key];
			let sucLength = successorInformation.length;

			//TODO: We will probably want to log the results of this
			if(sucLenght === undefined) {throw "Precidate " + key + "'s successor information was defined incorrectly"};
			if(sucLength === 0) {throw "Predicate " + key + " does not have successor information"; }
			if(sucLength === 1) {return;}
			
			let probability = 0;
			successorInformation.forEach(function(ele) {
				probability += ele.probability;
			})
			
			//TODO: it is possible we are doing float math here (is that a thing in JS) we may need to account for float math error
			//TODO: we probably want to log this
			if(probability !== 1) {throw "Predicate " + predicate + " does not have correct probability distrabution" }
		}
	}
	
	/*
	=======================================================
	Public Methods
	=======================================================
	*/
	
	//Advance the L-System n generations
	advanceGenerations(numGenerations) {
		for(let i = 0; i < numGenerations; i++) {
			//TODO: we probably want to log information here
			this.nextGeneration();
		}
		return this.currentLexicon;
	}
	
	//Move to the next generation
	nextGeneration() {
		let replacements = [];
		
		//For each predecessor, find all replacements
		for(let key in this.predicates) {
			let successorInformation = this.predicates[key];
			let matches = this._match(key, successorInformation, this.currentLexicon);
			replacements = replacements.concat(matches);
		}
		
		//TODO: how do we handle replacements that apply to the same indecies
		//Note = changing the lexicon that we are working on while working on it will screw up our replacements
		//This means that we have to do the replacements in 'parallel'
		//FIXME: inefficient
		let newLexiconArray = this.currentLexicon.split('');
		//For each replacement found, assign it to the location that it will be put eventually
		replacements.forEach(function(replacement) {
			//Validation
			//FIXME: is this ever valid? Probably just inefficient to do this
			if(replacement.endIndex <= replacement.startIndex) {throw "Replacement index's incorrect"; }
			
			newLexiconArray[replacement.startIndex] = replacement.successor;
			//If the predecessor spans multiple entries, we want to clear out those sections so that they get replaced instead of re-added in the next generation
			for(let i = replacement.startIndex + 1; i < replacement.endIndex; i++) {
				newLexiconArray[i] = ''; //Clear out any overlapping replacements
			}
		})
		
		let newLexicon = '';
		//Concat call of the replacements into the new generation
		newLexiconArray.forEach(function(ele, index) {
			newLexicon += ele
		}.bind(this)) //NOTE - we use bind here because 'this.' scope gets wonky in forEach
		
		//TODO: Keep track of historical data here
		this._currentLexicon = newLexicon
		this._generation ++;
	}
	
	/*
	=========================================================
	Private Methods
	=========================================================
	*/
	//Find all index's that match the given predecessor - choose a successor if stocastic
	_match(predecessor, successorInformation, stringMatch) {
		/*
		[
			{
				startIndex: 1, //Inclusive
				endIndex: 2, //Exclusive
				successor: "some String" //Chose from choices if stocastic 
			}
		]
		*/
		//NOTE - predecessors have 2 restricted characters; '<' and '>' - These are used for context sensative predecessors
		let contextSensative = false;
		let context = [];
		let matchPredecessor = predecessor;
		if(predecessor.indexOf('>') >= 0 || predecessor.indexOf('<') >= 0) {
			//We know that this will be context sensative
			contextSensative = true;
			context = predecessor.split(/[<>]+/);
			matchPredecessor = context[1]; //This assumes that there is a forward and backward context TODO: fix this 
		}
		
		let returnValue = [];
		let sIndex = this._matchPredecessor(stringMatch, matchPredecessor, contextSensative, context[0], context[2], 0);
		while(sIndex >= 0) {
			let chosenSuc = this._chooseSuccessor(successorInformation);
			let object = {
				startIndex: sIndex,
				endIndex: sIndex + 1, //TODO: how do we do this NOTE - this currently assumes that only one character is getting replaced. For the scope of this project, that is probably fine, but if I want to make this more generic, I should find a better way to do this.
				successor: chosenSuc
			}
			returnValue.push(object);
			sIndex = this._matchPredecessor(stringMatch, matchPredecessor, contextSensative, context[0], context[2], sIndex + 1);
		}
		
		//Return a list of the index's that match
		return returnValue;
	}
	
	//With a given predecessor, check the context if necessary and find the index
	_matchPredecessor(matchIn, predecessor, contextSensative, previous, next, start) {
		//First we make sure that the thing we are looking for exists in the string - ignroe context right now
		let predecessorIndex = matchIn.indexOf(predecessor, start);
		if(!contextSensative || predecessorIndex < 0) {
			return predecessorIndex;
		}
		
		//Now we are looking at context - its possible that the first match of the character doesn't have the context
		//It is possible that the context is matched later in the string however, so we have to keep looking until we find something or reach the end of the string
		while(predecessorIndex >= 0) {
			let previousMatch = false;
			let nextMatch = false;
			
			//If we care about previous context - check it
			if(typeof previous != 'undefined' && previous.length != 0) {
					previousMatch = this._checkPreviousContext(predecessorIndex, matchIn, previous);
			} else {
				//We don't care about previous context, it matches
				previousMatch = true;
			}
			
			//If we care about next context - check if
			if(typeof next != 'undefined' && next.length != 0) {
				nextMatch = this._checkNextContext(predecessorIndex, matchIn, next);
			} else {
				//We don't care about previous context, it matches
				nextMatch = true;
			}
			
			//Woot - we have matched all of our context, let get out of here
			if(previousMatch && nextMatch) {
				return predecessorIndex;
			}
			
			//Gotta keep looking - move forward
			predecessorIndex = matchIn.indexOf(predecessor, predecessorIndex + 1);
		}
		//Didn't find anything
		return -1;
	}
	
	//Pick a successor from list of random possibilities
	_chooseSuccessor(successorInformation) {
		if(successorInformation.length == 0) {throw 'Successor List empty';}
		//There is only one, check it
		if(successorInformation.length == 1) {return successorInformation[0].successor;}
		
		let random = Math.random();
		
		//Loop through the choices and subtract probability of choosing it - if we are now at 0, pick that one
		for(let successorIndex in successorInformation) {
			let ele = successorInformation[successorIndex];
			random -= ele.probability;
			if(random <= 0) {
				return ele.successor;
			}
		}
		console.warn('returning null successors');
		return null;
	}
	
	//TODO: can we merge checkNext and checkPrevious
	//Check the left context
	//'[' and ']' are special characters
	//Ignroe characters in the ignore context
	_checkPreviousContext(predecessorIndex, matchIn, previous) {
		
		//TODO: this is rather inefficient, fix it
		//find left character - ignore everything in ignore context
		let previousIndex = predecessorIndex - 1;
		let previousChar = matchIn.charAt(previousIndex);
		while(this.ignoreContext.indexOf(previousChar) >= 0 && previousIndex >= 0) {
			previousIndex --;
			previousChar = matchIn.charAt(previousIndex);
		}
		
		//if left character is '['
		if(previousChar == '[') {
			//Find left next character that have an even number of '[' and ']' ignoring the ignroe context and current left character
			//TODO: fix this - do we care about parent branch context
			let openBracket = 0;
			let closeBracket = 0;
			let continueChecking = true;
			while(continueChecking) {
				previousIndex --;
				previousChar = matchIn.charAt(previousIndex);
				if(previousIndex < 0) continueChecking = false;
				
				if(previousChar == '[') {
					openBracket ++;
				}
				if(previousChar == ']') {
					closeBracket ++;
				}
				if(openBracket != closeBracket) continue;
				if(this.ignoreContext.indexOf(previousChar) >= 0) continue;
				continueChecking = false;
			}
		}
		//if left character is ']'
		else if(previousChar == ']') {
			//Find left next character that have an even number of '[' and ']' ignoring the ingore context and including current left character
			//TODO: Fix this - do we care about parent branch context
			let openBracket = 0;
			let closeBracket = 1;
			let continueChecking = true;
			while(continueChecking) {
				previousIndex --;
				previousChar = matchIn.charAt(previousIndex);
				if(previousIndex < 0) continueChecking = false;
				
				if(previousChar == '[') openBracket ++;
				if(previousChar == ']') closeBracket ++;
				if(openBracket != closeBracket) continue;
				if(this.ignoreContext.indexOf(previousChar) >= 0) continue;
				continueChecking = false;
			}
		}
		
		return previousChar == previous;
	}
	
	//TODO: can we merge checkNext and checkPrevious
	//Check the right context
	//'[' and ']' are special characters
	//Ignroe characters in the ignore context
	_checkNextContext(predecessorIndex, matchIn, next) {
		//TODO: this is rather inefficient, fix it
		//find left character - ignore everything in ignore context
		let nextIndex = predecessorIndex + 1;
		let nextChar = matchIn.charAt(nextIndex);
		while(this.ignoreContext.indexOf(nextChar) >= 0 && nextIndex < matchIn.length) {
			nextIndex ++;
			nextChar = matchIn.charAt(nextIndex);
		}
		
		//if right character is ']'
		if(nextChar == ']') {
			//right context is the character at the end of the string
			//TODO: fix this - do we care about parent branch context?
			nextIndex = matchIn.length - 1
			nextChar = matchIn.charAt(nextIndex);
			while(this.ignoreContext.indexOf(nextChar) >= 0 && nextIndex >= 0) {
				nextIndex ++;
				nextChar = matchIn.charAt(nextIndex);
			}
			
		}
			
		//if right character is '['
		else if(nextChar == '[') {
			//right context is the character with equal open and closing brackets
			//TODO: fix this - do we care about parent branch context?
			let openBracket = 1;
			let closeBracket = 0;
			let continueChecking = true;
			while(continueChecking) {
				nextIndex ++;
				if(nextIndex > matchIn.length) break;
				nextChar = matchIn.charAt(nextIndex);
				
				if(nextChar == '[') openBracket ++;
				if(nextChar == ']') closeBracket ++;
				if(openBracket != closeBracket) continue;
				if(this.ignoreContext.indexOf(nextChar) >= 0) continue;
				continueChecking = false;
			}
		}
		
		return nextChar == next;
		
	}
	
}

module.exports = LSystem;