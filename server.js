const WS = require('ws');
const { v4: uuid } = require('uuid');
const clients = {};
let usernames = [];
let messages = [];

const port = process.env.PORT || 8080;
const wss = new WS.Server({ port });

wss.on('connection', (ws) => {
	const id = uuid();
	clients[id] = ws;
	ws.send(JSON.stringify({ renderUsers: true, names: usernames }));
	if (messages.length !== 0) {
		ws.send(JSON.stringify({ renderMessages: true, messages: messages }));
	}

	ws.on('message', (rawMessage) => {
		const message = JSON.parse(rawMessage);
		console.log(message);

		if (message.chooseUsername) {
			if (usernames.length === 0) {
				usernames.push(message.username);
				clients[id].username = message.username;
				const name = clients[id].username;

				for (const id in clients) {
					if (clients[id].username === name) {
						clients[id].send(
							JSON.stringify({ nameIsFree: true, name: message.username })
						);
					} else {
						clients[id].send(
							JSON.stringify({ renderNames: true, name: message.username })
						);
					}
				}

				return;
			}
			if (usernames.every((name) => name !== message.username)) {
				usernames.push(message.username);
				clients[id].username = message.username;
				const name = clients[id].username;

				for (const id in clients) {
					if (clients[id].username === name) {
						clients[id].send(
							JSON.stringify({ nameIsFree: true, name: message.username })
						);
					} else {
						clients[id].send(
							JSON.stringify({ renderNames: true, name: message.username })
						);
					}
				}
				return;
			} else {
				clients[id].send(JSON.stringify({ nameIsFree: false }));
				return;
			}
			return;
		}

		if (message.chatMessage) {
			const date = new Date().getTime();
			const name = clients[id].username;

			messages.push({
				name: name,
				message: message.messageText,
				date: date,
			});

			for (const id in clients) {
				if (clients[id].username === name) {
					clients[id].send(
						JSON.stringify({
							renderOwnMessage: true,
							name: 'You',
							message: message.messageText,
							date: date,
						})
					);
				} else {
					clients[id].send(
						JSON.stringify({
							renderMessage: true,
							name: name,
							message: message.messageText,
							date: date,
						})
					);
				}
			}
		}
	});

	ws.on('close', () => {
		usernames = usernames.filter((name) => name !== clients[id].username);
		for (const index in clients) {
			clients[index].send(
				JSON.stringify({ closeUser: true, name: clients[id].username })
			);
		}
		console.log(usernames);
		delete clients[id];
	});
});
