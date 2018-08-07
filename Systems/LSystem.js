//This is the main class for the L system 
//This should have an:
    //axiom
    //predicates 
//We don't really care about the vocabulary because we will assume everything in the predicates and axioms is part of the vocabulary

//Note _name signifies private access. Because javascript is weird I think this is the best way to ensure encapsulation. 
//This mean that when attempting to write to currentLexicon, because the setter is a noop (because it shouldn't be changeable from outside the class), you will have to use _currentLexicon

//What do the predicates look like?
/*
[
    {
        predecessor: "",        //What needs replacing
        successor: "",          //What is it getting replaced with
        probability: float      //What is the probability of this predicate getting chosen
                                //This is only valid if there are multiple predicates with the same predecessor
    }
]
*/

//TODO it may be better to refactor the predicates to look something like 
/*
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
*/
class LSystem {
    
    constructor(axiom, predicates) {
		this._validatePredicates(predicates);
        this._axiom = axiom;
        this._predicates = predicates;
		this._currentLexicon = axiom;
    }
	/*
	======================================================
	Getters and Setters
	======================================================
	*/
	get axiom() {return this._axiom;}
	set axiom(newValue) {this._axiom = newValue;}
	
	get currentLexicon() {return this._currentLexicon;}
	set currentLexicon(newValue) {/*NOOP*/}
	
	get predicates() {return this._predicates;}
	set predicates(newValue) {
		this._validatePredicates(newValue);
		this._predicates = newValue;
	}
	//=====================================================
	
	/*
	=======================================================
	Validation
	=======================================================
	*/
	_validatePredicates(predicates) {
		//If the predicates are null then don't do anyting
		if(!predicates) return;
		let predecessors = {};
		
		//for each predicate collect each unique predecessor
		predicates.forEach(function(value) {
			if(!predecessors[value.predecessor]) {
				predecessors[value.predecessor] = [];
			}
			predecessors[value.predecessor].push(value.probability);
		})
		
		//If there is more than one for a given predecessor, ensure the probabilities total 1
		for(let key in predecessors) {
			let array = predecessors[key];
			if(array.size != 1) {
				let total = 0;
				array.forEach(function(prob){
					total += prob
				})
				if(total != 1) {
					throw "Probability not set properly"
				}
			} 
		}
	}
	
	/*
	Advance the L system any number of generations
	*/
	advanceGenerations(numGenerations) {
		for(let i = 0; i < numGenerations; i++) {
			this.nextGeneration();
		}
	}
	
	nextGeneration() {
		let replacements = [];
		let processedPredicates = [];
		//For eahc predicate, collect find all matches and get a list of replacements
		this.predicates.forEach(function(predicate) {
			if(processedPredicates.indexOf(predicate.predecessor) >= 0) {
				return;
			}
			processedPredicates.push(predicate.predecessor);
			//TODO for stocastic systems, pick one based on probability
			//NOTE - this probably shouldn't be done here, but rather in the match
			//So when we are matching, send in all of the predicates for a given predecessor
			let matches = this._match(predicate.predecessor, predicate.successor, this.currentLexicon);
			replacements = replacements.concat(matches);
		}.bind(this)); //NOTE - we use bind here because `this.` scope gets wonky in forEach
		
		//TODO how do I handle replacements that apply to the same indecies
		//Note - changing the lexicon that we are working on while working on it will screw up our replacements
		//This means that we have to do all replacements in parallel
		let newLexiconArray = this.currentLexicon.split('');
		//For each replacement found, assign it to the location that it will be put eventually
		replacements.forEach(function(replacement) {
			//Validation
			if(replacement.endIndex <= replacement.startIndex) {
				throw "Replacement index's incorrect";
			}
			newLexiconArray[replacement.startIndex] = replacement.successor;
			//If the predecessor spans multiple entries, we want to clear those out so they get replaced instead of re-added in the next generation
			for(let i = replacement.startIndex + 1; i < replacement.endIndex; i++) {
				newLexiconArray[i] = ''; //Clear out any overlapping replacements. 
			}
		})
		
		let newLexicon = '';
		//Concat all of the replacements into the new generation
		newLexiconArray.forEach(function(ele, index) {
			newLexicon += ele;
		}.bind(this)) //NOTE - we use bind here because `this.` scope gets wonky in forEach
		
		this._currentLexicon = newLexicon;
	}
	
	/*
	given a predecessor and a string, find the required matches
	we only need the successor as a parameter so that we can add it to the return value
	without that, we can't be certain which replacement goes with which successors
	*/
	_match(predecessor, suc, stringMatch) {
		/*
		[
			{
				startIndex: 1, //Inclusive
				endIndex: 2, //Exclusive
				successor: "some string"
			},
			{
				startIndex: 2,
				endIndex, 4,
				successor: "other string"
			}
		]
		*/		
		//NOTE - predecessors have 2 restricted characters; '<' and '>' - These are used for context sensative predecessors
		let successorList = this._buildSuccessorList(predecessor);
		let contextSensative = false;
		let context = [];
		let matchPredecessor = predecessor
		if(predecessor.indexOf('>') >= 0 || predecessor.indexOf('<') >= 0) {
			//We know that this will be context sensative
			contextSensative = true;
			context = predecessor.split(/[<>]+/);
			matchPredecessor = context[1]; //This assumes there is a forward and backward context TODO fix this
		}
		
		//Find all matches for the predecessor in the axiom
		let returnValue = [];
		let sIndex = this._matchPredecessor(stringMatch, matchPredecessor, contextSensative, context[0], context[2], 0);
		while(sIndex >= 0) {
			let chosenSuc = this._chooseSuccessor(successorList);
			let object = {
				startIndex: sIndex,
				endIndex: sIndex + 1, //TODO how do this NOTE - this currently assumes only one character is getting replaced. For the scope of this project that is probably fine, but if I want to make this more generic, I should find a better way to do this. 
				successor: chosenSuc
			}
			returnValue.push(object);
			sIndex = this._matchPredecessor(stringMatch, matchPredecessor, contextSensative, context[0], context[2], sIndex + 1);
		}
		//Return a list of the index's that match
		return returnValue;
	}
	
	_matchPredecessor(matchIn, predecessor, contextSensative, previous, next, start) {
		let predecessorIndex = matchIn.indexOf(predecessor, start);
		if(!contextSensative || predecessorIndex < 0) {
				return predecessorIndex;
		}
		
		//We have to check all index's in case the first one that we find doesn't match the context
		while(predecessorIndex >= 0) {
			let previousMatch = false;
			let nextMatch = false;
			//We care about previous context - check it
			if(typeof previous != 'undefined' && previous.length != 0) {
				//TODO fix branching context
				//TODO abscrat ignore characters
				let previousIndex = predecessorIndex - 1;
				let previousChar = matchIn.charAt(previousIndex);
				while((previousChar == 'F' || previousChar == '+' || previousChar == '-') && previousIndex >= 0) { 
					previousIndex --;
					previousChar = matchIn.charAt(previousIndex);
				}
				//Check for index out of bounds
				if(previousIndex >= 0) {
					if(previousChar == previous) {
						previousMatch = true;
					}
				}
			} else {
				//We don't care about previous context, it matches
				previousMatch = true;
			}
			
			//We care about next context - check it
			if(typeof next != 'undefined' && next.length != 0) {
				//TODO fix branching context
				//TODO abstract ignore characters
				let nextIndex = predecessorIndex + 1;
				let nextChar = matchIn.charAt(nextIndex);
				while((nextChar == 'F' || nextChar == '+' || nextChar == '-') && nextIndex < matchIn.length) {
					nextIndex ++;
					nextChar = matchIn.charAt(nextIndex);
				}
				//Check for index out of boudns
				if(nextIndex < matchIn.length) {
					if(nextChar == next) {
						nextMatch = true;
					}
				}
			} else {
				//We don't care about next context, it matches
				nextMatch = true;
			}
			
			if(previousMatch && nextMatch) {
				return predecessorIndex;
			}
			
			predecessorIndex = matchIn.indexOf(predecessor, predecessorIndex + 1);
		}
		
		return -1;
	}
	
	_buildSuccessorList(predecessor) {
		let successorList = [];
		this.predicates.forEach(function(predicate) {
			if(predicate.predecessor == predecessor) {
				successorList.push({
					successor: predicate.successor,
					probability: predicate.probability
				});
			}
		})
		
		return successorList;
	}
	
	_chooseSuccessor(successorList) {
		if(successorList.length == 0) {
			throw "Successor List empty";
		}
		if(successorList.length == 1) {
			return successorList[0].successor;
		}
		
		let random = Math.random();
		
		for(let successorIndex in successorList) {
			let ele = successorList[successorIndex];
			random = random - ele.probability;
			if(random <= 0) {
				return ele.successor
			}
		}
		
		console.warn('returning null successor');
		return null;
	}
}

module.exports = LSystem;