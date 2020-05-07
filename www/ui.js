/*
 Psi2d.

 This small Vue.js app  makes a nice index.html page where  the user
 can choose a nick name and a player model.

*/

var usernames = ['Dog', 'Cat', 'Dead', 'Corvo', 'Nero', 'Dark', 'Deadly', 'Horse', 'Caveman', 'Rudolph', 'Deer', '1979', 'Mario', 'Annette', 'Destroyer', 'Carl', 'Carol', '2018', 'Peewee', 'Soldier', 'Candy', 'Monster', 'Rick', 'Hungry', 'Unnamed', 'Forgotten', 'Rock', 'Outlaw', 'Dead', 'Lovely', 'Grande', 'Piccolo', 'Pizzaiolo', 'Maestro', 'Esplosivo', '456', 'Psi', 'Psipsi', 'Dev', 'Jogurt', 'Lupo']
var classes = ['Cat', 'Dog', 'Roby', 'Annette'];
var arandom = function(a) {
    return a[Math.floor((Math.random() * a.length))];
}
if (!localStorage.username) localStorage.username = arandom(usernames) + arandom(usernames) + arandom(usernames)
if (!localStorage.class) localStorage.class = 'Cat'
if (!localStorage.premium) localStorage.premium = false
if (!localStorage.premiumCode) localStorage.premiumCode = null

function lock() {

    $("#loading-mask").addClass('loading-mask')
}

function unlock() {
    $("#loading-mask").removeClass('loading-mask')
}
var app = new Vue({

    el: '#app',
    data: {
	options:classes,
        get character() {
            return localStorage.class
        },
        set character(v) {
            localStorage.class = v
        },
        get username() {
            return localStorage.username
        },
        set username(v) {
            localStorage.username = v
        },
        showModal: false,
        serverList: null,
        showServerList: false,
        get premium() {
            return JSON.parse(localStorage.premium)
        },
        set premium(v) {
            localStorage.premium = v
        },
        get premiumCode() {
            return localStorage.premiumCode
        },
        set premiumCode(v) {
            localStorage.premiumCode = v
        },
    },
    computed: {
        compiledMarkdown: function() {
            return this.input + 123
        }
    },
    methods: {
        update: function(e) {
            this.input = e.target.value
        },
        loadServerList: function(cb) {
            var that = this
            lock();
            $.ajax({
                url: 'servers.txt'
            }).done(function(data) {
                console.log(data)
                that.serverList = JSON.parse(data)
                cb();
                unlock();
            })
        },
        testServer: function(i, final) {
	    //gran test proprio
        },
        testServers: function() {},
        showOtherServers: function() {
            var that = this
            this.loadServerList(
                function() {
                    console.log(that)
                    //alert(that.showServerList)
                    that.showServerList = true;
                    //alert(that.showServerList)
                });
        },
        regen: function() {
            this.username = arandom(usernames) + arandom(usernames) + arandom(usernames)
	    this.character = arandom(classes);
        },
        joinRandom: function() {
            //this.loadServerList(this.testServers.bind(this));
            window.location.replace("play.html?username=" + this.username + "&class=" + this.character);
        },
        create: function() {
            return alert('Not implemented yet')
	    //
	    //when I will be famous and gold users will be able to create rooms:
	    //
            //if(this.premium==false) {	alert('Only premium members can create a match'); return}
            var roomName = prompt('Room name')
            if (roomName) window.location.replace("create.html?room=" + roomName + "&premiumCode=" + this.premiumCode);
        },
        join: function() {
            var roomName = prompt('Room name')
            if (roomName) window.location.replace("play.html?username=" + this.username + "&class=" + this.character + "&room=" + roomName);
        },
        premiumInsert: function() {
            var code = prompt('Premium code')
            if (code) {

                lock();
                $.ajax({
                    url: "testCode?code=" + code
                }).done(function(r) {
                    if (r.accepted) {
                        this.premiumCode = code;
                        this.premium = true;
                    }
                    unlock();
                });
            }
        },
        credits: function() {
            this.showModal = true
            alert('\
                                              Ψ2D is a 2D web-based multiplayer shooting game\n\
\n\
Author:\n\
    Antonio Ragagnin <spocchio@gmail.com> \n\
\n\
Resources:\n\
    http://www.gameart2d.com/freebies.html\n\
    https://kenney.nl/assets\n\
    https://github.com/jakesgordon/javascript-tiny-platformer\n')
        }
    },
    filters: {
        getImageSrc: function(value) {
            return 'players/' + value.toLowerCase() + '/Idle (1).png'
        },
    }
})
