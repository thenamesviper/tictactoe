//very occasionally, computer will cheat and change a player square
//not sure why this happens, but may only be last square (9) that is affected

$(document).ready(function() {
   
   //allow toggling between piece selected
   $("#X, #O").click(function() {
         if(!$(this).hasClass("selected")) {
               $("#X, #O").removeClass("selected");
               $(this).addClass("selected");
         }
   })
   
   //allow toggling for who goes first
   $("#player-first, #computer-first").click(function() {
         if(!$(this).hasClass("selected")) {
               $("#player-first, #computer-first").removeClass("selected");
               $(this).addClass("selected");
         }
   })
   
   startGame();
})
 
function startGame() {
      let piece, starting;
      $("#start").click(function() {
            $(this).off("click");
            piece = $("#X").hasClass("selected") ? "X" : "O";
            starting = $("#player-first").hasClass("selected") ? "player" : "computer";
            $("#splash").css("display", "none");
            setupPlayers(piece, starting);
      })
}

//basic gameplay flow

function Player(name, piece) {
      this.name = name;
      this.piece = piece;
      this.piecesSelected = [];       //list of selected boxes 1-9
      this.canWinWith = [
            [1, 2, 3],
            [1, 5, 9],
            [1, 4, 7],
            [2, 5, 8],
            [3, 5, 7],
            [3, 6, 9],
            [4, 5, 6],
            [7, 8, 9]
            ]
      this.sound = new Audio("http://res.cloudinary.com/thenamesviper/video/upload/v1461906326/move_fmloou.mp3");
     
}

function setupPlayers(player_piece, whoStarts) {
      let pieces = ["X", "O"];
      pieces.splice(pieces.indexOf(player_piece), 1);
      let player = new Player("Player", player_piece);

      let computer = new Player("Computer", pieces[0])
      if(whoStarts == "player") {
            playerMovement(player, computer);
      } else {
            computerMovement(computer, player);
      }
    
}

function playerMovement(player, computer) {
      $(".square").on("click", function() {
            if($(this).hasClass("selectable")) {
                  player.sound.play();
                  $(this).text(player.piece).removeClass("selectable");
                  $(".square").off("click");

                  //which square in row(1-3) + 3*which row in board(0-2)
                  let added = ($(this).index() + 1) + $(this).parent().index() * 3;
                  player.piecesSelected.push(added);
                  
                  player.canWinWith = reduceArrays(player.canWinWith, added);
                  computer.canWinWith = removeArrays(computer.canWinWith, added);
                  
                  if(computer.piecesSelected.length + player.piecesSelected.length === 9){
                        endGame(null, null);
                  } else if(checkForWin(player.canWinWith)) {
                        endGame(player, computer);
                  } else {
                        computerMovement(computer, player);
                  }
            }
      })
}

function computerMovement(computer, player) {
      let added = +computerLogic(computer, player);
      computer.piecesSelected.push(added);
      computer.canWinWith = reduceArrays(computer.canWinWith, added);
      player.canWinWith = removeArrays(player.canWinWith, added);
      
      //setTimeout to give illusion of thinking / not have sounds overlap
      setTimeout(function() {
            $(".square").eq(added-1).text(computer.piece).removeClass("selectable");
            computer.sound.play();
            if(computer.piecesSelected.length + player.piecesSelected.length === 9){
                  endGame(null, null);
            } else if(checkForWin(computer.canWinWith)) {
                  endGame(computer, player);
            } else {
                  playerMovement(player, computer);
            }
      }, 500);
}

//remove 'piece' from possible winning arrays
function reduceArrays(arr, piece){
      let newArray = [];
      for(let i = 0; i < arr.length; i++){
            newArray.push(arr[i].filter(function(value){
                  return value !== piece;
            }))
      }
      return newArray;
}

//if piece is selected by player A, player B can not win with it
function removeArrays(arr, piece) {
      let newArray = arr.filter(function(value) {
            return value.indexOf(piece) == -1;
      })
      return newArray;
}

//-----------COMPUTER LOGIC---------------------------
//Good logic: computer checks if it can win, if not, checks if player can win
//Meh logic: if neither of above, checks if it can get two, then same for player, etc.
//always picks the square that has the most winning combos
//  at particular step
function computerLogic(computer, player) {
      let move = false;
      
      //not elegant--but stops computer from cheating at end by switching
      //player piece in slot 9..not sure what causes this
      if(computer.piecesSelected.length + player.piecesSelected.length === 8) {
            move = selectEmpty(computer.piecesSelected, player.piecesSelected);
      } else { 
            move = fillingUpArray(computer.canWinWith, 1);
            if(move === false){
                  move = fillingUpArray(player.canWinWith,1);
            }
            if(move === false) {
                  move = fillingUpArray(computer.canWinWith, 2);
            }
            if(move === false) {
                  move = fillingUpArray(player.canWinWith, 2);
            }
            if(move === false){
                  move = fillingUpArray(computer.canWinWith, 3);
            }
      }
      return move;
}

//finds the most common value in winning arrays 
//this method doesn't give any randomness---would be nice to have some
function checkWhichMostCommon(arr){
      let occurrences = {};
      let most = undefined;
      let count = 0;
      
      let newArray = arr.reduce(function(a,b){
            return a.concat(b);
      })
      
      for(let i = 0; i < newArray.length; i++){
            if(occurrences.hasOwnProperty(newArray[i])) {
                  occurrences[newArray[i]] ++;
            } else {
                  occurrences[newArray[i]] = 1;
            }
      }
      for(let key in occurrences){
            if(occurrences[key] > count){
                  count = occurrences[key];
                  most = key;
            }
      }  
      return most;
}

//checks how close an array is to being emptied
function fillingUpArray(arr, numberLeft) {
      newArray = [];
      for(let i = 0; i < arr.length; i++){
            if(arr[i].length == numberLeft){
                  newArray.push(arr[i]);
            }
      }
      if(newArray.length > 0){
            return checkWhichMostCommon(newArray);
      } else {
            return false;
      }
}

//stops computer from cheating by changing player
//piece in square 9 instead of taking last square
//this shouldn't be necessary -- need to go back through code
function selectEmpty(arr1, arr2) {
      let newArray = arr1.concat(arr2);
      for(let i = 1; i <= 9; i++){
            if(newArray.indexOf(i) == -1){
                  return i;
            }
      }
      return "I should never be reached";
}
//-----------END COMPUTER LOGIC----------------------


//checks for an empty array, only possible when player/computer has won
function checkForWin(arrayOfArrays){
      for(let i = 0; i < arrayOfArrays.length; i++){
            if(arrayOfArrays[i].length === 0) {
                  return true;
            }
      }
}

//game won behavior
function endGame(winner, loser) {
      console.log("game over");
      if(winner == null) {
            console.log("game ended in a tie");
      } else {
            console.log("The " + winner.name + " is the winner!");
      }
      
      $("body").append("playyer wins");
      
      setTimeout(function() {
            $("#splash").css("display", "inherit");
            $(".square").html("&nbsp").addClass("selectable");
            startGame();
      }, 2000);
}



