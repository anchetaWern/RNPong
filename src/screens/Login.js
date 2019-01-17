import React, { Component } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

import Pusher from "pusher-js/react-native";

const pusher_app_key = "YOUR PUSHER APP KEY";
const pusher_app_cluster = "YOUR PUSHER APP CLUSTER";
const base_url = "YOUR HTTPS NGROK URL";

class LoginScreen extends Component {
  static navigationOptions = {
    title: "Login"
  };

  state = {
    username: "",
    enteredGame: false
  };

  constructor(props) {
    super(props);
    this.pusher = null;
    this.myChannel = null;
  }

  render() {
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.main}>
            <View>
              <Text style={styles.label}>Enter your username</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={username => this.setState({ username })}
                value={this.state.username}
              />
            </View>

            {!this.state.enteredGame && (
              <TouchableOpacity onPress={this.enterGame}>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Login</Text>
                </View>
              </TouchableOpacity>
            )}

            {this.state.enteredGame && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  enterGame = async () => {
    const username = this.state.username;

    if (username) {
      this.setState({
        enteredGame: true
      });

      this.pusher = new Pusher(pusher_app_key, {
        authEndpoint: `${base_url}/pusher/auth`,
        cluster: pusher_app_cluster,
        auth: {
          params: { username: username }
        },
        encrypted: true
      });

      this.myChannel = this.pusher.subscribe(`private-user-${username}`);
      this.myChannel.bind("pusher:subscription_error", status => {
        Alert.alert(
          "Error",
          "Subscription error occurred. Please restart the app"
        );
      });

      this.myChannel.bind("pusher:subscription_succeeded", () => {
        this.myChannel.bind("opponent-found", data => {
          let opponent =
            username == data.player_one ? data.player_two : data.player_one;

          const playerOneObjects = {
            plank: "plankOne",
            wall: "leftWall",
            plankColor: "green"
          };

          const playerTwoObjects = {
            plank: "plankTwo",
            wall: "rightWall",
            plankColor: "blue"
          };

          const isPlayerOne = username == data.player_one ? true : false;

          const myObjects = isPlayerOne ? playerOneObjects : playerTwoObjects;
          const opponentObjects = isPlayerOne
            ? playerTwoObjects
            : playerOneObjects;

          const myPlank = myObjects.plank;
          const myPlankColor = myObjects.plankColor;
          const opponentPlank = opponentObjects.plank;
          const opponentPlankColor = opponentObjects.plankColor;

          const myWall = myObjects.wall;
          const opponentWall = opponentObjects.wall;

          Alert.alert("Opponent found!", `Your plank color is ${myPlankColor}`);

          this.opponentChannel = this.pusher.subscribe(
            `private-user-${opponent}`
          );
          this.opponentChannel.bind("pusher:subscription_error", data => {
            console.log("Error subscribing to opponent's channel: ", data);
          });

          this.opponentChannel.bind("pusher:subscription_succeeded", () => {
            this.props.navigation.navigate("Game", {
              pusher: this.pusher,
              username: username,
              myChannel: this.myChannel,
              opponentChannel: this.opponentChannel,

              opponent: opponent,
              isPlayerOne: isPlayerOne,
              myPlank: myPlank,
              opponentPlank: opponentPlank,
              myPlankColor: myPlankColor,
              opponentPlankColor: opponentPlankColor,

              myWall: myWall,
              opponentWall: opponentWall
            });
          });

          this.setState({
            username: "",
            enteredGame: false
          });
        });
      });
    }
  };
}

export default LoginScreen;

const styles = {
  wrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFF"
  },
  fieldContainer: {
    marginTop: 20
  },
  label: {
    fontSize: 16
  },
  textInput: {
    height: 40,
    marginTop: 5,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#eaeaea",
    padding: 5
  },
  button: {
    alignSelf: "center",
    marginTop: 10
  },
  buttonText: {
    fontSize: 18,
    color: "#05a5d1"
  },
  loadingText: {
    alignSelf: "center"
  }
};
