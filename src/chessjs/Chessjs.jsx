import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import "./chessjs.css"

function Paragraph() {
  return  <p>
  To make a move, say the coordinates of the starting square, 
  followed by a short pause, and then the coordinates of the target square.
  <br/><br/>
  For example, you might make your first move by saying: "E2 E4"
  <br/><br/>
  Commands:
  <br/>
  "play" = submit move 
  <br/>
  "stop" = turn off microphone
  <br/>
  "reset" = reset board
  <br/>
  "clear" = clear transcript 
  <br/>
  Press any key to turn on microphone
</p>
}

export default function Game() {
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const startListening = () => SpeechRecognition.startListening({continuous:true, language: 'en-US'})
  const stopListening = () => SpeechRecognition.stopListening()
  const commands = [
    {
      command: 'Play',
      callback: onVoiceDrop
    },
    {
      command: 'Stop',
      callback: stopListening
    },
    {
      command: 'Reset',
      callback: resetBoard
    },
    {
      command: 'clear',
      callback: ({ resetTranscript }) => resetTranscript()
    }
  ]
  const {transcript, resetTranscript, browserSupportsSpeechRecognition} = useSpeechRecognition({ commands })

  if (!browserSupportsSpeechRecognition) {
      console.log("not supported")
      return null
  }

  useEffect(()=>{
    document.addEventListener('keydown', startListening, true);
    return () => {
      document.removeEventListener('keydown', startListening);
    };
  });

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  function makeAMove(move) {
    const gameCopy = { ...game };
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result; // null if the move was illegal, the move object if the move was legal
  }

  // moves a piece by drag and drop
  function onHandDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: promote()
    });

    // illegal move
    if (move === null) return false;
    return true;
  }

  // moves a piece by voice input
  function onVoiceDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: srcSquare(),
      to: trgSquare(),
      promotion: promote()
    });

    // illegal move
    if (move === null) return false;
    return true;
  }

  function promote() {
    return document.getElementById("choosePiece").value   
  }

  function srcSquare() {
    let myJSON = JSON.stringify({transcript}) // round-a-bout way to convert transcript obj to string
    let myObj = JSON.parse(myJSON) // first convert to json string then to javascript object
    let myArr = myObj.transcript.split(" ")
    return myArr[0].toLowerCase()
  }

  function trgSquare() {
    let myJSON = JSON.stringify({transcript})
    let myObj = JSON.parse(myJSON)
    let myArr = myObj.transcript.split(" ")
    return myArr[1].toLowerCase()
  }

  function resetBoard() {
    safeGameMutate((game) => {
      game.reset();
    });
  }

  return (
  <div>
    <div class="fboxcontainer">
      <div class="leftcol">
        <h3>Voice Chess</h3>
       <Paragraph />
        <div class="transcriptbox">
          {transcript}
        </div>
        <button class='button' onClick={startListening}>Start Listening</button>
        <button class='button' onClick={stopListening}>Stop Listening</button> 
        <button class='button' onClick={resetTranscript}>Clear</button>
        <button class='button' onClick={onVoiceDrop}>Submit Move</button>
        <button class='button' onClick={resetBoard}>Reset Board</button>
      </div>

      <div class='rightcol'>
        <label htmlFor="choosePiece">Promote to </label>
        <select onChange="promote()" id="choosePiece">
          <option value="q">Queen</option>
          <option value="r">Rook</option>
          <option value="b">Bishop</option>
          <option value="n">Knight</option>
        </select>
        <Chessboard position={game.fen()} onPieceDrop={onHandDrop} />
      </div>
    </div>
    
  </div> 
  );
}