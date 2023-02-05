// TODO: DOWNLOAD USER DATA
// TODO: Load users into User dropdown

// Store note data here
const userData = [];

////////////////////////////////////////
// CREATE A NEW STICKY NOTE
// current functionality: double click icon
// hopeful future functionality: drag and drop onto board

let noteNum = 1;

function addNote(leftPos, topPos) {
	//note
	let newNote = document.createElement('div');
	newNote.setAttribute('id', `${'note' + noteNum}`);
	newNote.setAttribute('class', 'note');
	newNote.setAttribute('ondblclick', `editNote(this.id)`);
	let stickyBoard = document.getElementById('stickyBoard');
	newNote.style.cssText = `left:${leftPos}px;top:${topPos}px;z-index:${noteNum};background-image: url('img/fff15b.png');`;
	stickyBoard.appendChild(newNote);

	//delete button
	let deleteDiv = document.createElement('div');
	deleteDiv.setAttribute('class', 'deleteDiv');
	deleteDiv.innerHTML = `<span id='delete${noteNum}' onclick='deleteNote(this.id)'>X</span>`;
	newNote.appendChild(deleteDiv);

	//note text
	let noteText = document.createElement('div');
	noteText.setAttribute('class', 'noteText');
	noteText.innerHTML = '';
	newNote.appendChild(noteText);

	//initialize newNote.onmousedown event (prevents the user from having to click the note twice)
	dragNote(newNote);
	noteNum++;
}
////////////////////////////////////////
// Delete Sticky Note
function deleteNote(deleteID) {
	const deleteButton = document.getElementById(deleteID);
	const curNote = deleteButton.parentElement.parentElement;
	let curIndex = curNote.style.zIndex;
	let idNumDeleted = parseInt(curNote.id.slice(4));
	curNote.remove();

	//decrement notenum
	noteNum--;

	//reset ids
	//reset z-indexes
	let allNotes = document.querySelectorAll('.note');
	for (let note of allNotes) {
		//lower all z-index that were greater than the
		//	deleted note
		if (note.style.zIndex > curIndex) {
			note.style.zIndex -= 1;
		}
		//decrease all ids that were greater than the delete note
		let loopIdNum = parseInt(note.id.slice(4));
		if (loopIdNum > idNumDeleted) {
			loopIdNum--;
			note.id = 'note' + loopIdNum.toString();
		}
	}
}

////////////////////////////////////////
// Edit Sticky Note

function editNote(noteID) {
	//load text
	let textArea = document.getElementById('editNoteText');
	let note = document.getElementById(noteID);
	let htmlText = note.lastChild.innerHTML;
	let regText = htmlText.split('<br>').join('\n');
	textArea.value = regText;

	//select active colorBox
	let noteColor = note.style.backgroundImage.substring(9, 15);
	let colorBoxID = 'z' + noteColor;
	//remove borders from all elements
	let allColorBoxes = document.querySelectorAll('.colorBoxBorder');
	for (let border of allColorBoxes) {
		border.className = 'colorBoxBorder';
	}
	let colorBoxBorder = document.getElementById(colorBoxID).parentElement;
	colorBoxBorder.classList.toggle('activeColorBox');

	//set TEXTAREA BACKGROUND COLOR
	noteColor = '#' + noteColor;
	textArea.style.backgroundColor = noteColor;

	//make editor visible
	let overlay = document.getElementById('editOverlay');
	// passing the noteID to overlay so it can be used by the saveNote function
	overlay.className = noteID;
	overlay.style.display = 'flex';
}

function changeColor(colorID) {
	//remove borders from all elements
	let allColorBoxes = document.querySelectorAll('.colorBoxBorder');
	for (let border of allColorBoxes) {
		border.className = 'colorBoxBorder';
	}
	//set active colorbox
	let colorBoxBorder = document.getElementById(colorID).parentElement;
	colorBoxBorder.classList.toggle('activeColorBox');

	//change note background image
	// CHANGE TEXTAREA BACKGROUND COLOR
	let textArea = document.getElementById('editNoteText');
	colorID = colorID.slice(1);
	colorID = '#' + colorID;
	textArea.style.backgroundColor = colorID;
}

function closeEdit() {
	let overlay = document.getElementById('editOverlay');
	overlay.style.display = 'none';
}

// prevents the edit window from disappearing when clicked (doesn't allow the click event to propogate to the overlay parent (who calls the closeEdit() function))
document.getElementById('editWindow').addEventListener('click', (e) => {
	e.stopPropagation();
});

function saveNote() {
	let overlay = document.getElementById('editOverlay');
	let noteID = overlay.className;
	let textArea = document.getElementById('editNoteText');
	let note = document.getElementById(noteID);
	let regText = textArea.value;
	//COPIED FROM: https://stackoverflow.com/questions/784539/how-do-i-replace-all-line-breaks-in-a-string-with-br-elements
	regText = regText.replace(/(?:\r\n|\r|\n)/g, '<br>');
	note.lastChild.innerHTML = regText;

	// SET NOTE BACKGROUND IMAGE
	let activeColorBox = document.querySelector('.activeColorBox');
	let colorBox = activeColorBox.firstElementChild;
	let colorHex = colorBox.id;
	colorHex = colorHex.slice(1);
	note.style.backgroundImage = `url('img/${colorHex}.png')`;

	// Get note data and save
	let noteData = findNoteData(noteID);
	if (noteData === 0) {
		// no note data, create a new one
		noteData = {
			id: noteID,
			color: colorHex,
			content: textArea.value,
		};
	}
	saveNoteData(noteID, noteData);

	closeEdit();
}

function findNoteData(id) {
	if (userData.length > 0) {
		for (let note of userData) {
			if (note.id === id) {
				return note;
			}
		}
	}
	return 0;
}

function saveNoteData(id, noteData) {
	if (userData.length > 0) {
		for (let i in userData) {
			if (userData[i].id === id) {
				userData[i] = noteData;
			}
		}
		//couldn't find the data, add the data...
		userData.push(noteData);
	} else {
		// userData has no data, add the data...
		userData.push(noteData);
	}
}

//Keep textarea input within the bounds of 21 cols, 9 rows
// COPIED FROM: https://stackoverflow.com/questions/14259580/textarea-with-limited-lines-and-char-limits
let textarea = document.getElementById('editNoteText');
textarea.onkeyup = function () {
	let lines = textarea.value.split('\n');
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].length <= 21) continue;
		let j = 0;
		space = 21;
		while (j++ <= 21) {
			if (lines[i].charAt(j) === ' ') space = j;
		}
		lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || '');
		lines[i] = lines[i].substring(0, space);
	}
	textarea.value = lines.slice(0, 9).join('\n');
};

////////////////////////////////////////
// MOVE A STICKY NOTE
//

function rotaryZIndex(curNote) {
	let curIndex = curNote.style.zIndex;
	let allNotes = document.querySelectorAll('.note');

	//For every note that had a higher zindex than curNote's previous
	// zindex value, decrease their zIndex value by 1
	for (let note of allNotes) {
		if (note.id === curNote.id) continue;
		if (note.style.zIndex > curIndex) note.style.zIndex -= 1;
	}
	//set current note to highest zIndex
	curNote.style.zIndex = allNotes.length;
}

// ADAPTED FROM:
// https://dev.to/shantanu_jana/how-to-create-a-draggable-div-in-javascript-iff
const dragNote = (note) => {
	let pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;

	//MouseUp occurs when the user releases the mouse button
	const dragMouseUp = () => {
		document.onmouseup = null;
		//onmousemove attribute fires when the pointer is moving while it is over an note.
		document.onmousemove = null;

		note.classList.remove('drag');
		note.style.cursor = 'default';

		////////
		// solves the transparent corner issue of the sticky
		///////
		const underNoteBox = document.getElementById('underNoteBoxShadow');
		let noteDims = note.getBoundingClientRect();
		underNoteBox.style.left = `-300px`;
		underNoteBox.style.top = `-300px`;
	};

	const dragMouseMove = (event) => {
		event.preventDefault();
		//clientX property returns the horizontal coordinate of the mouse pointer
		pos1 = pos3 - event.clientX;
		//clientY property returns the vertical coordinate of the mouse pointer
		pos2 = pos4 - event.clientY;
		pos3 = event.clientX;
		pos4 = event.clientY;
		//offsetTop property returns the top position relative to the parent
		note.style.top = `${note.offsetTop - pos2}px`;
		note.style.left = `${note.offsetLeft - pos1}px`;
		note.style.cursor = 'move';

		//PREVENTS DRAGGING STICKIES OFF OF THE SCREEN
		//pageX/Y coordinates are relative to the top left corner of the whole rendered page (including parts hidden by scrolling),
		//clientX/Y coordinates are relative to the top left corner of the visible part of the page, "seen" through browser window.
		//screenX/Y are relative to the physical screen.
		////////
		// solves the transparent corner issue of the sticky
		///////
		const underNoteBox = document.getElementById('underNoteBoxShadow');
		let noteDims = note.getBoundingClientRect();
		underNoteBox.style.left = `${noteDims.left + 22}px`;
		underNoteBox.style.top = `${noteDims.top + 22}px`;
		underNoteBox.style.zIndex = note.style.zIndex;
		///////////////
		const stickyBoard = document.getElementById('stickyBoard');
		let stickyBoardDims = stickyBoard.getBoundingClientRect();
		let mouseX = event.pageX - stickyBoardDims.left;
		let mouseY = event.pageY - stickyBoardDims.top;
		//Right boundary
		if (mouseX >= stickyBoardDims.width) {
			document.onmousemove = null;
			note.classList.remove('drag');
		}
		//Left
		if (mouseX <= 0) {
			document.onmousemove = null;
			note.classList.remove('drag');
		}
		//Top
		if (mouseY <= 0) {
			document.onmousemove = null;
			note.classList.remove('drag');
		}
		//Bottom
		if (mouseY >= stickyBoardDims.height) {
			document.onmousemove = null;
			note.classList.remove('drag');
		}
	};

	const dragMouseDown = (event) => {
		//set z-index of cur element to highest of notes, rotates other z-index values
		rotaryZIndex(note);

		event.preventDefault();

		pos3 = event.clientX;
		pos4 = event.clientY;

		note.classList.add('drag');

		document.onmouseup = dragMouseUp;
		document.onmousemove = dragMouseMove;
	};
	note.onmousedown = dragMouseDown;
};

//called once to prep the mousedown event
dragNewNote();
document.getElementById('stickyIcon').addEventListener('mousedown', (e) => {
	dragNewNote();
});

//function for creating a new sticky note
function dragNewNote() {
	const dragIcon = document.getElementById('dragStickyIcon');
	const staticIcon = document.getElementById('stickyIcon');

	let pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;

	//MouseUp occurs when the user releases the mouse button
	const dragMouseUp = (event) => {
		document.onmouseup = null;
		//onmousemove attribute fires when the pointer is moving while it is over an dragIcon.
		document.onmousemove = null;
		dragIcon.style.cursor = 'default';
		dragIcon.style.display = 'none';

		const stickyBoard = document.getElementById('stickyBoard');
		// const nodeChain = document.querySelectorAll(':hover');  cool, but doesn't work for this application
		const nodeChain = document.elementsFromPoint(event.pageX, event.pageY);
		if (nodeChain.length < 4) {
			console.error('Cannot place a sticky note there.');
			return;
		}
		const possibleStickyBoard = nodeChain[nodeChain.length - 4]; //sticky board is 4 indexes up from the end of the array
		if (possibleStickyBoard.id === stickyBoard.id) {
			//The user is attempting to place the sticky in the correct location
			//Insert sticky here
			addNote(event.pageX - 75, event.pageY - 75);
		} else {
			console.error('Cannot place a sticky note there.');
		}
	};

	const dragMouseMove = (event) => {
		event.preventDefault();
		//clientX property returns the horizontal coordinate of the mouse pointer
		pos1 = pos3 - event.clientX;
		//clientY property returns the vertical coordinate of the mouse pointer
		pos2 = pos4 - event.clientY;
		pos3 = event.clientX;
		pos4 = event.clientY;
		//offsetTop property returns the top position relative to the parent
		dragIcon.style.top = `${event.clientY - 30}px`;
		dragIcon.style.left = `${event.clientX - 30}px`;
	};

	const dragMouseDown = (event) => {
		event.preventDefault();

		pos3 = event.clientX;
		pos4 = event.clientY;
		document.onmouseup = dragMouseUp;
		document.onmousemove = dragMouseMove;
		dragIcon.style.cursor = 'grabbing';
		dragIcon.style.display = 'inline';
		dragIcon.style.top = `${event.clientY - 30}px`;
		dragIcon.style.left = `${event.clientX - 30}px`;
	};
	staticIcon.onmousedown = dragMouseDown;
}

// document.addEventListener(
// 	'mousemove',
// 	(e) => {
// 		console.clear();
// 		console.log(document.querySelectorAll(':hover'));
// 	},
// 	{ passive: true }
// );
