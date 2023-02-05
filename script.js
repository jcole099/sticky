//	Author: James Cole
//	Project: Sticky Note Application
//	Class: CS361
//	Date: 02/15/23
//

// Store note data here
let userData = [];
let noteNum = 1;

//get data from server
loadData();
async function loadData() {
	await fetch('http://jcole.net:22333/getUsers')
		.then((response) => response.json())
		.then((data) => {
			userData = data;
		});
	const selectUserDrop = document.getElementById('selectUserDropDown');
	//sort user data TODO:
	userData = quickSort(userData, 0, userData.length - 1);

	//add to users to the dropdown menu
	for (let user of userData) {
		let option = document.createElement('option');
		option.innerHTML = user.userName;
		option.value = user.userName;
		selectUserDrop.options.add(option);
	}
}

/////////////////////////////////////////////////////////
// SORTING FUNCTIONS
////////////

// Quicksort function and helper functions COPIED FROM:
// https://www.guru99.com/quicksort-in-javascript.html
function swap(items, leftIndex, rightIndex) {
	var temp = items[leftIndex];
	items[leftIndex] = items[rightIndex];
	items[rightIndex] = temp;
}
function partition(items, left, right) {
	var pivot = items[Math.floor((right + left) / 2)].userName, //middle element
		i = left, //left pointer
		j = right; //right pointer
	while (i <= j) {
		while (items[i].userName < pivot) {
			i++;
		}
		while (items[j].userName > pivot) {
			j--;
		}
		if (i <= j) {
			swap(items, i, j); //sawpping two elements
			i++;
			j--;
		}
	}
	return i;
}

function quickSort(items, left, right) {
	var index;
	if (items.length > 1) {
		index = partition(items, left, right); //index returned from partition
		if (left < index - 1) {
			//more elements on the left side of the pivot
			quickSort(items, left, index - 1);
		}
		if (index < right) {
			//more elements on the right side of the pivot
			quickSort(items, index, right);
		}
	}
	return items;
}
/////////////////////////////////////////////////////////////

//load board data
function loadBoard() {
	noteNum = 1;
	const selectUserDrop = document.getElementById('selectUserDropDown');
	if (selectUserDrop.value === 'selectUserValue') return;

	//Clear the sticky board
	let allNotes = document.querySelectorAll('.note');
	for (let note of allNotes) {
		note.remove();
	}

	//get the object that the user selected
	for (let user of userData) {
		if (user.userName === selectUserDrop.value) {
			//create each sticky element
			for (let sticky of user.stickies) {
				//note
				let newNote = document.createElement('div');
				newNote.setAttribute('id', `${sticky.id}`);
				newNote.setAttribute('class', 'note');
				newNote.setAttribute('ondblclick', `editNote(this.id)`);
				let stickyBoard = document.getElementById('stickyBoard');
				newNote.style.cssText = `left:${sticky.left};top:${sticky.top};z-index:${sticky.zIndex};background-image:url('img/${sticky.color}.png');`;
				stickyBoard.appendChild(newNote);

				//delete button
				let deleteDiv = document.createElement('div');
				deleteDiv.setAttribute('class', 'deleteDiv');
				//get noteNum from sticky.id
				let idIndex = sticky.id.slice(4);
				deleteDiv.innerHTML = `<span id='delete${idIndex}' onclick='deleteNote(this.id)'>X</span>`;
				newNote.appendChild(deleteDiv);

				//note text
				let regText = sticky.content;
				let htmlText = regText.replace(/(?:\r\n|\r|\n)/g, '<br>');
				let noteText = document.createElement('div');
				noteText.setAttribute('class', 'noteText');
				noteText.innerHTML = `${htmlText}`;
				newNote.appendChild(noteText);
				dragNote(newNote);
				noteNum++;
			}
			break;
		}
	}
}

//Save Board
//change background color of button on click
let saveBoardButton = document.getElementById('saveBoardButton');
saveBoardButton.addEventListener('mousedown', (e) => {
	saveBoardButton.style.backgroundColor = 'rgb(95,218,217)';
});
saveBoardButton.addEventListener('mouseup', (e) => {
	saveBoardButton.style.backgroundColor = 'rgb(144,242,241)';
});
function saveBoard() {
	//get all stickies
	const allNotes = document.querySelectorAll('.note');

	//find user object in userData
	let curUser = document.getElementById('selectUserDropDown').value;
	if (curUser === 'selectUserValue') {
		console.error('Select a valid user in order to save the board.');
		return;
	}
	let userIndex;
	for (let index in userData) {
		if (userData[index].userName === curUser) {
			//found the object
			userIndex = index;
		}
	}
	//create an array of object, assign array to stickes
	let userStickies = [];
	for (let note of allNotes) {
		let htmlText = note.lastChild.innerHTML;
		let regText = htmlText.split('<br>').join('\n');
		let noteColor = note.style.backgroundImage.substring(9, 15);
		userStickies.push({
			id: note.id,
			top: note.style.top,
			left: note.style.left,
			content: regText,
			color: noteColor,
			zIndex: note.zIndex,
		});
	}
	//assign newly built sticky array to the appropriate user
	userData[userIndex].stickies = userStickies;

	//send request
	fetch('http://jcole.net:22333/updateUser', {
		method: 'POST',
		body: JSON.stringify(userData[userIndex]),
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	});
}

////////////////////////////////////////
// Delete a user
//
function deleteUser() {
	const currentUser = document.getElementById('selectUserDropDown').value;
	//clear board
	let allNotes = document.querySelectorAll('.note');
	for (let note of allNotes) {
		note.remove();
	}

	//set dropdown to default
	document.getElementById('selectUserDropDown').value = 'selectUserValue';

	//remove user from dropdown
	const userOption = document.getElementById('selectUserDropDown');
	for (let i = 0; i < userOption.length; i++) {
		if (userOption.options[i].value === currentUser) {
			userOption.remove(i);
		}
	}
	//remove user from local userData
	for (let index in userData) {
		if (userData[index].userName === currentUser) {
			userData.splice(index, 1);
		}
	}

	//send request
	const userObject = {
		userName: currentUser,
	};
	fetch('http://jcole.net:22333/deleteUser', {
		method: 'POST',
		body: JSON.stringify(userObject),
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	});
}

////////////////////////////////////////
// Create a user
//

function checkEnter(element) {
	if (event.key === 'Enter') {
		createUser();
	}
}

function createUser() {
	const textValue = document.getElementById('createUserText').value;
	document.getElementById('createUserText').value = '';
	//check for other users with that name
	for (let user of userData) {
		if (user.userName == textValue) {
			document.getElementById('createUserText').value =
				'Error: Create a unique name';
			return;
		}
	}
	if (textValue === '') {
		document.getElementById('createUserText').value =
			'Error: Must enter a name';
		return;
	}
	//register enter
	userData.push({
		userName: textValue,
		stickies: [],
	});

	const selectUserDrop = document.getElementById('selectUserDropDown');

	//sort data
	userData = quickSort(userData, 0, userData.length - 1);

	//remove all data from select
	for (let i = selectUserDrop.options.length; i >= 0; i--) {
		selectUserDrop.remove(i);
	}

	//add 'Select a user' to top of the select
	let option = document.createElement('option');
	option.innerHTML = 'Select a user';
	option.value = 'selectUserValue';
	selectUserDrop.options.add(option);
	//reload select with sorted data
	for (let user of userData) {
		let option = document.createElement('option');
		option.innerHTML = user.userName;
		option.value = user.userName;
		selectUserDrop.options.add(option);
	}
	//clear board when a new user is created
	let allNotes = document.querySelectorAll('.note');
	for (let note of allNotes) {
		note.remove();
	}

	//select new user in the select
	selectUserDrop.value = textValue;
}

////////////////////////////////////////
// CREATE A NEW STICKY NOTE
//

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
	//Regular expression COPIED FROM: https://stackoverflow.com/questions/784539/how-do-i-replace-all-line-breaks-in-a-string-with-br-elements
	regText = regText.replace(/(?:\r\n|\r|\n)/g, '<br>');
	note.lastChild.innerHTML = regText;

	// SET NOTE BACKGROUND IMAGE
	let activeColorBox = document.querySelector('.activeColorBox');
	let colorBox = activeColorBox.firstElementChild;
	let colorHex = colorBox.id;
	colorHex = colorHex.slice(1);
	note.style.backgroundImage = `url('img/${colorHex}.png')`;
	closeEdit();
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

// The dragNote function has been ADAPTED FROM:
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
