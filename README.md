# RNPong
A two-player Pong game created with React Native and Pusher Channels.

You can read the tutorial at: [https://pusher.com/tutorials/react-native-pong-game](https://pusher.com/tutorials/react-native-pong-game)

### Prerequisites

- React Native development environment or [Expo](https://expo.io/)
- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/en/)
- [Pusher Channels app instance](https://pusher.com/channels)
- [ngrok account](https://ngrok.com/)

## Getting Started

1. Clone the repo:

```
git clone https://github.com/anchetaWern/RNPong.git
cd RNPong
```

2. Install the app dependencies:

```
yarn install
```

3. Eject the project (re-creates the `ios` and `android` folders):

```
react-native eject
```

4. Link the packages:

```
react-native link react-native-gesture-handler
```

5. Update `.env` file with your Pusher app credentials.

6. Setup the server:

```
cd server
yarn
```

7. Update the `server/.env` file with your Pusher app credentials.

8. Run the server:

```
node server.js
```

9. Run ngrok:

```
./ngrok http 5000
```

10. Update the `src/screens/Login.js` file with your ngrok https URL.

11. Run the app:

```
react-native run-android
```


## Built With

* [React Native](http://facebook.github.io/react-native/)
