// This server file was created in collaboration between Stephanie Cox and James Cole

const express = require('express');
var fs = require('fs');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//using cors library to allow requests from any origin
app.use(
	cors({
		origin: 'https://stickyboard.jcole.net',
	})
);

// allow any origin
// app.use(cors({
//     origin: "*",
// }));
const PORT = 22333;

//GET Route: Sends userData file contents back to James
app.get('/getUsers', (req, res) => {
	fs.readFile(
		'/root/sticky/stickyServer/userData.json',
		'utf8',
		(error, data) => {
			if (error) {
				console.log(error);
			}
			res.send(JSON.parse(data));
		}
	);
});

//POST Route: Deletes a user from userData file
app.post('/deleteUser', (req, res) => {
	fs.readFile(
		'/root/sticky/stickyServer/userData.json',
		'utf8',
		(error, data) => {
			if (error) {
				console.log(error);
			}
			var users = JSON.parse(data);
			for (var i = 0; i < users.length; i++) {
				if (users[i].userName == req.body.userName) {
					users.splice(i, 1);
				}
			}
			let newData = JSON.stringify(users);
			fs.writeFile(
				'/home/steph/stickyServer/userData.json',
				newData,
				(error, data) => {
					if (error) {
						console.log(error);
					}
				}
			);
			res.send(JSON.parse(newData));
		}
	);
});

//POST Route: Save or update a user to userData file
app.post('/updateUser', (req, res) => {
	fs.readFile(
		'/root/sticky/stickyServer/userData.json',
		'utf8',
		(error, data) => {
			if (error) {
				console.log(error);
			}
			let existingUser = false;
			var users = JSON.parse(data);
			for (var i = 0; i < users.length; i++) {
				if (users[i].userName == req.body.userName) {
					existingUser = true;
					break;
				}
			}
			if (existingUser) {
				//If user exits, replace their data with data from req
				users[i] = req.body;
			} else {
				//If user doesn't exist, then add them
				users.push(req.body);
			}
			let newData = JSON.stringify(users);
			fs.writeFile(
				'/root/sticky/stickyServer/userData.json',
				newData,
				(error, data) => {
					if (error) {
						console.log(error);
					}
				}
			);
			res.send(JSON.parse(newData));
		}
	);
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}... `);
});
