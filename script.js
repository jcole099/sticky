// TODO: DOWNLOAD USER DATA
// TODO: Load users into User dropdown

// TODO: ensure sticky note content saves to note body
// Store note data here
const userData = [];

////////////////////////////////////////
// CREATE A NEW STICKY NOTE
// current functionality: double click icon
// hopeful future functionality: drag and drop onto board

let leftPos = 230;
let topPos = 200;
let noteNum = 1;

function addNote() {
	// some of this will be replaced when drag and drop is implemented
	let newNote = document.createElement('div');
	newNote.setAttribute('id', `${'note' + noteNum}`);
	newNote.setAttribute('class', 'note');
	newNote.setAttribute('ondblclick', `editNote(this.id)`);
	let stickyBoard = document.getElementById('stickyBoard');

	if (leftPos > stickyBoard.clientWidth) {
		leftPos = 230;
		topPos += 175;
	}
	console.log(`attempting to add new note...`);
	console.log(`Left: ${leftPos}`);
	console.log(`Top: ${topPos}`);
	console.log(newNote.getAttribute('id'));
	newNote.style.cssText = `position:absolute;
	max-width:150px;
	width:150px;
	max-height:150px;
	height:150px;
	opacity: 1;
	left:${leftPos}px;
	top:${topPos}px;
	background-image: url('img/fff15b.png');
	background-size: contain;
	padding: 0.3rem;
	padding-top: 1.5rem;`;

	leftPos += 175;
	document.body.appendChild(newNote);

	noteNum++;
}

////////////////////////////////////////
// Edit Sticky Note

function editNote(noteID) {
	//load text
	let textArea = document.getElementById('editNoteText');
	let note = document.getElementById(noteID);
	let htmlText = note.innerHTML;
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
	// CHANGE TEXTAREA BACKGROUND COLOR TODO:
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
	note.innerHTML = regText;

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
// current functionality: none
// hopeful future functionality: move sticky around on board
// MOVEABLE STICKY:
// COPIED FROM:
// https://dev.to/shantanu_jana/how-to-create-a-draggable-div-in-javascript-iff
const dragElement = (element, dragzone) => {
	let pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;
	//MouseUp occurs when the user releases the mouse button
	const dragMouseUp = () => {
		document.onmouseup = null;
		//onmousemove attribute fires when the pointer is moving while it is over an element.
		document.onmousemove = null;

		element.classList.remove('drag');
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
		element.style.top = `${element.offsetTop - pos2}px`;
		element.style.left = `${element.offsetLeft - pos1}px`;
	};

	const dragMouseDown = (event) => {
		event.preventDefault();

		pos3 = event.clientX;
		pos4 = event.clientY;

		element.classList.add('drag');

		document.onmouseup = dragMouseUp;
		document.onmousemove = dragMouseMove;
	};

	dragzone.onmousedown = dragMouseDown;
};

// const dragable = document.getElementById('dragable'),
// 	dragzone = document.getElementById('dragzone');

// dragElement(dragable, dragzone);
