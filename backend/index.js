const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();


const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

mongoose.connect(process.env.MONGO_URI);

const cardSchema = new mongoose.Schema({
    suit: String,
    rank: String,
    value: Number
});

const playerSchema = new mongoose.Schema({
    name: String,
    hand: [cardSchema],
    score: Number
});

const gameSchema = new mongoose.Schema({
    deck: [cardSchema],
    player: playerSchema,
    dealer: playerSchema,
    winner: String
})

const Card = mongoose.model('Card', cardSchema)
const Player = mongoose.model('Player', playerSchema)
const Game = mongoose.model('Game', gameSchema)


function createDeck() {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

    const deck = []
    for (const suit of suits) {
        for (const rank of ranks) {
            const card = new Card({
                suit: suit,
                rank: rank,
                value: rank === 'A' ? 11 : isNaN(rank) ? 10 : parseInt(rank)
            });
            deck.push(card)
        }
    }

    return deck
}


app.post('/game/start', async (req, res) => {
    try {
        const newDeck = createDeck()

        //shuffling
        for (let i = newDeck.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
        }

        const newGame = new Game({
            deck: newDeck,
            player: {
                name: 'player',
                hand: [],
                score: 0
            },
            dealer: {
                name: 'dealer',
                hand: [],
                score: 0
            },
            winner: null
        })

        newGame.player.hand.push(newGame.deck.pop())
        newGame.player.hand.push(newGame.deck.pop())
        newGame.dealer.hand.push(newGame.deck.pop())
        newGame.dealer.hand.push(newGame.deck.pop())

        newGame.player.score = calculateScore(newGame.player.hand)
        newGame.dealer.score = calculateScore(newGame.dealer.hand)

        if (newGame.player.score === 21 && newGame.player.score === 21) newGame.winner = 'Draw'
        else if (newGame.dealer.score === 21) newGame.winner = 'Dealer'
        else if (newGame.player.score === 21) newGame.winner = 'Player'

        await newGame.save()
        res.status(201).json(newGame)

    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
})


app.post('/game/hit', async (req, res) => {
    try {
        const gameId = req.body.gameId
        const game = await Game.findById(gameId)

        const cardDrawn = game.deck.pop()
        game.player.hand.push(cardDrawn)

        game.player.score = calculateScore(game.player.hand)

        if (game.player.score > 21) {
            game.winner = 'Dealer'
        }

        await game.save()

        return res.json({
            ...game.toObject(),
            winner: game.winner
        })
    } catch (error) {
        console.log(error)
        res.status(400).send("internal server errror")
    }
})

app.post('/game/stand', async (req, res) => {
    try {

        const gameId = req.body.gameId
        const game = await Game.findById(gameId)

        while (game.dealer.score < 17) {
            const cardDrawn = game.deck.pop()
            game.dealer.hand.push(cardDrawn)

            game.dealer.score = calculateScore(game.dealer.hand)
        }

        if (game.dealer.score > 21) {
            game.winner = "Player"
        }

        game.winner = determineWinner(game.player.score, game.dealer.score)

        await game.save()

        return res.json({
            ...game.toObject(),
            winner: game.winner
        })

    } catch (error) {
        console.log(error)
        res.status(400).send("internal server errror")
    }
})


function calculateScore(hand) {
    let score = hand.reduce((total, card) =>
        total + card.value, 0)

    hand.filter(card => card.rank === 'A')
        .forEach(_ => {
            if (score > 21) {
                score -= 10
            }
        })

    return score
}

function determineWinner(playerScore, dealerScore) {
    if (playerScore > 21) return 'Dealer'
    if (dealerScore > 21) return 'Player'

    if (playerScore > dealerScore) return 'Player'
    else if (dealerScore > playerScore) return 'Dealer'
    else return 'Draw'
}

app.listen(port, () => console.log(`Server running on port ${port}`))
