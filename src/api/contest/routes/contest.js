'use strict';

 module.exports = {
   routes: [
     {
       method: 'GET',
       path: '/contests',
       handler: 'contest.find',
       config: {
         auth: false,
       },
     },
     {
       method: 'GET',
       path: '/contests/:id',
       handler: 'contest.findOne',
       config: {
         auth: false,
       },
     },
     {
       method: 'POST',
       path: '/contests/:id/join',
       handler: 'contest.join',
       config: {
         policies: ['global::ensure-authenticated'],
       },
     },
     {
       method: 'POST',
       path: '/contests/:id/submit',
       handler: 'contest.submit',
       config: {
         policies: ['global::ensure-authenticated'],
       },
     },
     {
       method: 'GET',
       path: '/contests/:id/leaderboard',
       handler: 'contest.leaderboard',
       config: {
         policies: ['global::ensure-authenticated'],
       },
     },
   ],
 };
