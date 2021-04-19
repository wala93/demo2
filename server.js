'use strict';

// Application Dependencies 
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodoverride = require('method-override');

// Environmental variables
require('dotenv').config();

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

// Application Setup
const app = express();
const client = new pg.Client(DATABASE_URL);

// Express Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride('_method'));
app.use(express.static('./public'));

app.set('view engine', 'ejs');
// routes:

app.get('/home', getAllCharacters);
app.get('/character/create', renderCreatePage);
app.get('/character/my-fav-characters', getAllFavCharacters);
app.get('/character/my-characters', getAllCreatedCharacters);
app.get('/character/:character_id', getCharacterDetails);
app.post('/favorite-character', saveCharacter);
app.post('/character/create', createCharacter);
app.put('/character/:character_id', updateCharacter);
app.delete('/character/:character_id', deleteCharacter);


function getAllCharacters(req, res) {
    const url = 'http://hp-api.herokuapp.com/api/characters';

    superagent.get(url).then(results => {
        // to render the character using ejs template
        const characters = results.body.map(object => new Character(object));
        res.render('index', { characters: characters });
    });
}

function renderCreatePage(req, res) {
    res.render('create-character.ejs');
}
function getAllFavCharacters(req, res) {

    const sql = `SELECT * FROM characters WHERE created_by=$1;`;
    const safeValues = ['api'];

    client.query(sql, safeValues).then(results => {
        res.render('display-characters', { characters: results.rows })
    }).catch(error => console.log(error));

}

function getAllCreatedCharacters(req, res) {
    const sql = `SELECT * FROM characters WHERE created_by=$1;`;
    const safeValues = ['user'];

    client.query(sql, safeValues).then(results => {
        res.render('display-characters', { characters: results.rows })
    }).catch(error => console.log(error));
}

function getCharacterDetails(req, res) {
    const characterId = req.params.character_id;
    console.log(req.params);
    const sql = `SELECT * FROM  characters WHERE id=$1`;
    const safeValues = [characterId];

    client.query(sql, safeValues).then(results => {
        res.render('character-details', { characterInfo: results.rows });
    });
    // res.send('all good');
}

function saveCharacter(req, res) {
    console.log(req.body);
    // const name = req.body.name;
    // const house = req.body.house;
    // const patronus = req.body.patronus;
    // const alive = req.body.alive;

    const { name, house, patronus, alive } = req.body;

    const sql = `INSERT INTO characters(name,house,patronus,is_alive,created_by) VALUES($1, $2, $3, $4, $5);`;
    const safeValues = [name, house, patronus, alive, 'api'];

    client.query(sql, safeValues).then(() => {
        res.redirect('/character/my-fav-characters');
    });

}

function updateCharacter(req, res) {
    const characterId = req.params.character_id;
    const { name, house, patronus, status } = req.body;
    const sql = `UPDATE characters SET name=$1, house=$2, patronus=$3, is_alive=$4 WHERE id=$5;`;
    const safeValues = [name, house, patronus, status, characterId];

    client.query(sql, safeValues).then(() => {
        res.redirect(`/character/${characterId}`);
    });
}

function deleteCharacter(req, res) {
    const characterId = req.params.character_id;
    const sql = `DELETE FROM characters WHERE id=$1;`;
    const safeValues = [characterId];

    client.query(sql, safeValues).then(() => {
        res.redirect('/character/my-fav-characters');
    });
}

function createCharacter(req, res) {
    const { name, house, patronus, status } = req.body;
    const sql = `INSERT INTO characters(name,house,patronus,is_alive,created_by) VALUES($1, $2, $3, $4, $5);`;
    const safeValues = [name, house, patronus, status, 'user'];

    client.query(sql, safeValues).then(() => {
        res.redirect('/character/my-characters');
    });
}

function Character(charInfo) {
    this.name = charInfo.name;
    this.house = charInfo.house;
    this.patronus = charInfo.patronus;
    this.alive = charInfo.alive;
}

client.connect().then(() => {
    app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
}).catch(error => console.log(error));