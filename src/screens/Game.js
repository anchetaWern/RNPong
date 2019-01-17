import React, { PureComponent } from "react";
import { View, Text, Alert } from "react-native";
import { GameEngine } from "react-native-game-engine";
import Circle from "../components/Circle";
import Box from "../components/Box";

import Matter from "matter-js";

const BALL_SIZE = 50;
const PLANK_HEIGHT = 70;
const PLANK_WIDTH = 20;

const GAME_WIDTH = 650;
const GAME_HEIGHT = 340;

const BALL_START_POINT_X = GAME_WIDTH / 2 - BALL_SIZE;
const BALL_START_POINT_Y = GAME_HEIGHT / 2;
const BORDER = 15;

const plankSettings = {
  isStatic: true
};

const wallSettings = {
  isStatic: true
};

const ballSettings = {
  inertia: 0,
  friction: 0,
  frictionStatic: 0,
  frictionAir: 0,
  restitution: 1
};

const ball = Matter.Bodies.circle(
  BALL_START_POINT_X,
  BALL_START_POINT_Y,
  BALL_SIZE,
  {
    ...ballSettings,
    label: "ball"
  }
);

const plankOne = Matter.Bodies.rectangle(
  BORDER,
  95,
  PLANK_WIDTH,
  PLANK_HEIGHT,
  {
    ...plankSettings,
    label: "plankOne"
  }
);
const plankTwo = Matter.Bodies.rectangle(
  GAME_WIDTH - 50,
  95,
  PLANK_WIDTH,
  PLANK_HEIGHT,
  { ...plankSettings, label: "plankTwo" }
);

const topWall = Matter.Bodies.rectangle(
  GAME_HEIGHT - 20,
  -30,
  GAME_WIDTH,
  BORDER,
  { ...wallSettings, label: "topWall" }
);
const bottomWall = Matter.Bodies.rectangle(
  GAME_HEIGHT - 20,
  GAME_HEIGHT + 33,
  GAME_WIDTH,
  BORDER,
  { ...wallSettings, label: "bottomWall" }
);

const leftWall = Matter.Bodies.rectangle(-50, 160, 10, GAME_HEIGHT, {
  ...wallSettings,
  isSensor: true,
  label: "leftWall"
});
const rightWall = Matter.Bodies.rectangle(
  GAME_WIDTH + 50,
  160,
  10,
  GAME_HEIGHT,
  { ...wallSettings, isSensor: true, label: "rightWall" }
);

const WINNING_SCORE = 5;

const engine = Matter.Engine.create({ enableSleeping: false });
const world = engine.world;

Matter.World.add(world, [
  ball,
  plankOne,
  plankTwo,
  topWall,
  bottomWall,
  leftWall,
  rightWall
]);

const planks = {
  plankOne: plankOne,
  plankTwo: plankTwo
};

export default class Game extends PureComponent {
  static navigationOptions = {
    header: null
  };

  state = {
    myScore: 0,
    opponentScore: 0
  };

  constructor(props) {
    super(props);

    const { navigation } = this.props;

    this.pusher = navigation.getParam("pusher");
    this.username = navigation.getParam("username");

    this.myChannel = navigation.getParam("myChannel");
    this.opponentChannel = navigation.getParam("opponentChannel");

    this.isPlayerOne = navigation.getParam("isPlayerOne");

    const myPlankName = navigation.getParam("myPlank");
    const opponentPlankName = navigation.getParam("opponentPlank");

    this.myPlank = planks[myPlankName];
    this.opponentPlank = planks[opponentPlankName];

    this.myPlankColor = navigation.getParam("myPlankColor");
    this.opponentPlankColor = navigation.getParam("opponentPlankColor");

    this.opponentWall = navigation.getParam("opponentWall");
    this.myWall = navigation.getParam("myWall");

    const opponent = navigation.getParam("opponent");

    this.myChannel.bind("client-opponent-moved", opponentData => {
      Matter.Body.setPosition(this.opponentPlank, {
        x: this.opponentPlank.position.x,
        y: opponentData.opponentPlankPositionY
      });
    });

    this.myChannel.bind("client-moved-ball", ({ position, velocity }) => {
      Matter.Sleeping.set(ball, false);
      Matter.Body.setPosition(ball, position);
      Matter.Body.setVelocity(ball, velocity);

      setTimeout(() => {
        if (position.x != ball.position.x || position.y != ball.position.y) {
          this.opponentChannel.trigger("client-moved-ball", {
            position: ball.position,
            velocity: ball.velocity
          });

          Matter.Sleeping.set(ball, true);
        }
      }, 200);
    });

    if (!this.isPlayerOne) {
      this.myChannel.bind(
        "client-update-score",
        ({ playerOneScore, playerTwoScore }) => {
          this.setState({
            myScore: playerTwoScore,
            opponentScore: playerOneScore
          });
        }
      );
    }

    this.physics = (entities, { time }) => {
      let engine = entities["physics"].engine;
      engine.world.gravity.y = 0;
      Matter.Engine.update(engine, time.delta);
      return entities;
    };

    this.movePlank = (entities, { touches }) => {
      let move = touches.find(x => x.type === "move");
      if (move) {
        const newPosition = {
          x: this.myPlank.position.x,
          y: this.myPlank.position.y + move.delta.pageY
        };
        Matter.Body.setPosition(this.myPlank, newPosition);
      }

      return entities;
    };

    setInterval(() => {
      this.opponentChannel.trigger("client-opponent-moved", {
        opponentPlankPositionY: this.myPlank.position.y
      });
    }, 300);
  }

  componentDidMount() {
    if (this.isPlayerOne) {
      this.myChannel.bind("start-game", () => {
        Matter.Body.setVelocity(ball, { x: 3, y: 0 });

        this.opponentChannel.trigger("client-moved-ball", {
          position: ball.position,
          velocity: ball.velocity
        });

        Matter.Sleeping.set(ball, true);
      });

      Matter.Events.on(engine, "collisionStart", event => {
        var pairs = event.pairs;

        var objA = pairs[0].bodyA.label;
        var objB = pairs[0].bodyB.label;

        if (objA == "ball" && objB == this.opponentWall) {
          this.setState(
            {
              myScore: +this.state.myScore + 1
            },
            () => {
              Matter.Body.setPosition(ball, {
                x: BALL_START_POINT_X,
                y: BALL_START_POINT_Y
              });

              Matter.Body.setVelocity(ball, { x: -3, y: 0 });

              this.opponentChannel.trigger("client-update-score", {
                playerOneScore: this.state.myScore,
                playerTwoScore: this.state.opponentScore
              });
            }
          );
        } else if (objA == "ball" && objB == this.myWall) {
          this.setState(
            {
              opponentScore: +this.state.opponentScore + 1
            },
            () => {
              Matter.Body.setPosition(ball, {
                x: BALL_START_POINT_X,
                y: BALL_START_POINT_Y
              });
              Matter.Body.setVelocity(ball, { x: 3, y: 0 });

              this.opponentChannel.trigger("client-update-score", {
                playerOneScore: this.state.myScore,
                playerTwoScore: this.state.opponentScore
              });
            }
          );
        }
      });
    }
  }

  render() {
    return (
      <GameEngine
        style={styles.container}
        systems={[this.physics, this.movePlank]}
        entities={{
          physics: {
            engine: engine,
            world: world
          },
          pongBall: {
            body: ball,
            size: [BALL_SIZE, BALL_SIZE],
            renderer: Circle
          },
          playerOnePlank: {
            body: plankOne,
            size: [PLANK_WIDTH, PLANK_HEIGHT],
            color: "#a6e22c",
            renderer: Box,
            xAdjustment: 30
          },
          playerTwoPlank: {
            body: plankTwo,
            size: [PLANK_WIDTH, PLANK_HEIGHT],
            color: "#7198e6",
            renderer: Box,
            type: "rightPlank",
            xAdjustment: -33
          },

          theCeiling: {
            body: topWall,
            size: [GAME_WIDTH, 10],
            color: "#f9941d",
            renderer: Box,
            yAdjustment: -30
          },
          theFloor: {
            body: bottomWall,
            size: [GAME_WIDTH, 10],
            color: "#f9941d",
            renderer: Box,
            yAdjustment: 58
          },
          theLeftWall: {
            body: leftWall,
            size: [5, GAME_HEIGHT],
            color: "#333",
            renderer: Box,
            xAdjustment: 0
          },
          theRightWall: {
            body: rightWall,
            size: [5, GAME_HEIGHT],
            color: "#333",
            renderer: Box,
            xAdjustment: 0
          }
        }}
      >
        <View style={styles.scoresContainer}>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>{this.myPlankColor}</Text>
            <Text style={styles.scoreValue}> {this.state.myScore}</Text>
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>{this.opponentPlankColor}</Text>
            <Text style={styles.scoreValue}> {this.state.opponentScore}</Text>
          </View>
        </View>
      </GameEngine>
    );
  }
}

const styles = {
  container: {
    width: 650,
    height: 340,
    backgroundColor: "#FFF",
    alignSelf: "center"
  },
  scoresContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  score: {
    flexDirection: "row"
  },
  scoreLabel: {
    fontSize: 20
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold"
  }
};
